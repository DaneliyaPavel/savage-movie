"""
API роуты для платежей (YooKassa webhook)
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from uuid import UUID
import base64
import hashlib
import hmac
import json
import logging
import httpx
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

from app.config import settings
from app.infrastructure.db.session import get_db
from app.infrastructure.integrations.email_service import send_course_enrollment_confirmation
from app.infrastructure.db.models.payment import Payment
from app.infrastructure.db.repositories.courses import SqlAlchemyCoursesRepository
from app.infrastructure.db.repositories.enrollments import SqlAlchemyEnrollmentsRepository
from app.infrastructure.db.repositories.users import SqlAlchemyUsersRepository
from app.rate_limit import limiter


router = APIRouter(prefix="/api/payments", tags=["payments"])


def _yookassa_auth_header() -> str:
    if not settings.YOOKASSA_SHOP_ID or not settings.YOOKASSA_SECRET_KEY:
        raise RuntimeError("YOOKASSA credentials не настроены")
    token = base64.b64encode(f"{settings.YOOKASSA_SHOP_ID}:{settings.YOOKASSA_SECRET_KEY}".encode("utf-8")).decode(
        "utf-8"
    )
    return f"Basic {token}"


async def _get_payment(payment_id: str) -> Dict[str, Any]:
    auth = _yookassa_auth_header()
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"https://api.yookassa.ru/v3/payments/{payment_id}",
            headers={"Authorization": auth},
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"YooKassa API error: {resp.text}")
        return resp.json()


async def _notify_platform_enrollment(
    user_id: UUID,
    course_id: UUID,
    user_email: str,
    user_name: Optional[str],
    user_phone: Optional[str],
    course_title: str,
) -> None:
    """
    Вызов API образовательной платформы при успешной записи на курс.
    Если задан PLATFORM_API_URL — POST туда; иначе логируем (mock).
    """
    body = {
        "user_id": str(user_id),
        "course_id": str(course_id),
        "user_email": user_email,
        "user_name": user_name,
        "user_phone": user_phone,
        "course_title": course_title,
        "action": "enroll",
    }
    if settings.PLATFORM_API_URL:
        url = settings.PLATFORM_API_URL.rstrip("/") + "/enroll"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=body)
            if resp.status_code >= 400:
                logger.warning("Platform API returned %s: %s", resp.status_code, resp.text)
    else:
        logger.info("Platform enrollment (mock): %s", body)


def _verify_webhook_signature(raw_body: bytes, signature_header: str | None) -> None:
    """
    Проверяет HMAC-SHA256 подпись webhook от YooKassa.
    YooKassa отправляет заголовок Content-Hmac в формате: sha256=<hex-digest>.
    Ключ — YOOKASSA_SECRET_KEY.
    """
    if not settings.YOOKASSA_SECRET_KEY:
        raise HTTPException(status_code=500, detail="YOOKASSA_SECRET_KEY not configured")

    if not signature_header:
        logger.warning("Webhook rejected: missing Content-Hmac header")
        raise HTTPException(status_code=401, detail="Missing webhook signature")

    # Формат: "sha256=<hex>"
    parts = signature_header.split("=", 1)
    if len(parts) != 2 or parts[0] != "sha256":
        logger.warning("Webhook rejected: invalid Content-Hmac format: %s", signature_header[:50])
        raise HTTPException(status_code=401, detail="Invalid webhook signature format")

    expected = hmac.new(
        settings.YOOKASSA_SECRET_KEY.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, parts[1]):
        logger.warning("Webhook rejected: HMAC mismatch")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")


@router.post("/yookassa/webhook")
@limiter.limit("30/minute")
async def yookassa_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Webhook от YooKassa.
    Обрабатывает payment.succeeded, подтверждает статус через YooKassa API,
    идемпотентно создаёт enrollment и (только при первом создании) отправляет email.
    """
    raw_body = await request.body()

    # Проверяем HMAC-подпись
    signature = request.headers.get("Content-Hmac")
    _verify_webhook_signature(raw_body, signature)

    payload: Dict[str, Any] = json.loads(raw_body)
    event = payload.get("event")
    obj = payload.get("object") or {}
    payment_id = obj.get("id")

    # Всегда отвечаем 200 на нерелевантные события, чтобы не было лишних ретраев
    if event != "payment.succeeded" or not payment_id:
        return JSONResponse({"received": True})

    payment = await _get_payment(str(payment_id))
    if payment.get("status") != "succeeded":
        # Не подтверждено через API — считаем неуспешным
        return JSONResponse({"received": True})

    metadata: Dict[str, Any] = payment.get("metadata") or {}
    course_id_raw: Optional[str] = metadata.get("courseId")
    user_id_raw: Optional[str] = metadata.get("userId")
    user_email: Optional[str] = metadata.get("userEmail")
    user_name: Optional[str] = metadata.get("userName")
    user_phone: Optional[str] = metadata.get("userPhone")

    if not course_id_raw:
        raise HTTPException(status_code=400, detail="Missing metadata: courseId")

    try:
        course_id = UUID(str(course_id_raw))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid metadata courseId")

    course_repo = SqlAlchemyCoursesRepository(db)
    course = await course_repo.get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    user_id: UUID
    users_repo = SqlAlchemyUsersRepository(db)

    if user_id_raw:
        try:
            user_id = UUID(str(user_id_raw))
            existing_user = await users_repo.get_by_id(user_id)
            if not existing_user:
                raise HTTPException(status_code=404, detail="User not found")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid metadata userId")
    elif user_email:
        # Гость: get_or_create по email
        user = await users_repo.get_by_email(user_email.strip().lower())
        if user:
            updates = {}
            if user_name is not None and (user.full_name is None or user.full_name != user_name):
                updates["full_name"] = user_name
            if user_phone is not None and user.phone != user_phone:
                updates["phone"] = user_phone
            if updates:
                await users_repo.update(user, updates)
            user_id = user.id
        else:
            new_user = await users_repo.create({
                "email": user_email.strip().lower(),
                "full_name": user_name or None,
                "phone": user_phone or None,
                "provider": "email",
                "password_hash": None,
            })
            user_id = new_user.id
    else:
        raise HTTPException(status_code=400, detail="Missing metadata: userId or userEmail")

    # Идемпотентно создаём enrollment (уникальный индекс + пред-проверка)
    enrollment_repo = SqlAlchemyEnrollmentsRepository(db)
    existing = await enrollment_repo.get_by_user_and_course(user_id, course_id)

    created = False
    if not existing:
        try:
            await enrollment_repo.create(user_id=user_id, course_id=course_id, progress=0)
            created = True
        except IntegrityError:
            await db.rollback()

    # Email отправляем только если реально создали enrollment (чтобы ретраи не спамили)
    if created and user_email:
        try:
            await send_course_enrollment_confirmation(user_email, course.title)
        except Exception:
            pass

    # Уведомление платформы обучения (mock или внешний URL)
    try:
        await _notify_platform_enrollment(
            user_id=user_id,
            course_id=course_id,
            user_email=user_email or "",
            user_name=user_name,
            user_phone=user_phone,
            course_title=course.title,
        )
    except Exception:
        pass

    # Записываем платёж для аналитики (идемпотентно по external_id)
    amount_value = payment.get("amount")
    if amount_value is not None:
        if isinstance(amount_value, dict):
            amount = amount_value.get("value")
            if amount is not None:
                amount = float(amount)
        else:
            amount = float(amount_value) if isinstance(amount_value, (int, float)) else None
        if amount is not None:
            existing = await db.execute(select(Payment).where(Payment.external_id == str(payment_id)))
            if existing.scalar_one_or_none() is None:
                pay_record = Payment(
                    user_id=user_id,
                    course_id=course_id,
                    amount=amount,
                    status="succeeded",
                    external_id=str(payment_id),
                )
                db.add(pay_record)
                await db.commit()

    return JSONResponse({"received": True})
