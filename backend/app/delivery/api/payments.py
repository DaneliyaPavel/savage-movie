"""
API роуты для платежей (YooKassa webhook)
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from uuid import UUID
import base64
import httpx
from typing import Any, Dict, Optional

from app.config import settings
from app.infrastructure.db.session import get_db
from app.infrastructure.integrations.email_service import send_course_enrollment_confirmation
from app.infrastructure.db.repositories.courses import SqlAlchemyCoursesRepository
from app.infrastructure.db.repositories.enrollments import SqlAlchemyEnrollmentsRepository


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


@router.post("/yookassa/webhook")
async def yookassa_webhook(payload: Dict[str, Any], db: AsyncSession = Depends(get_db)):
    """
    Webhook от YooKassa.
    Обрабатывает payment.succeeded, подтверждает статус через YooKassa API,
    идемпотентно создаёт enrollment и (только при первом создании) отправляет email.
    """
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

    if not course_id_raw or not user_id_raw:
        raise HTTPException(status_code=400, detail="Missing metadata: courseId/userId")

    try:
        course_id = UUID(str(course_id_raw))
        user_id = UUID(str(user_id_raw))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid metadata UUIDs")

    course_repo = SqlAlchemyCoursesRepository(db)
    course = await course_repo.get_by_id(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

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
            # Email не должен ломать обработку платежа
            pass

    return JSONResponse({"received": True})
