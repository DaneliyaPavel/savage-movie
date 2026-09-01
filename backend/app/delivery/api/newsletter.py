"""
API роуты подписки на рассылку
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.newsletter import NewsletterSubscriber
from app.interfaces.schemas.newsletter import (
    NewsletterSubscribeRequest,
    NewsletterSubscribeResponse,
)
from app.rate_limit import limiter

router = APIRouter(prefix="/api/newsletter", tags=["newsletter"])


@router.post("/subscribe", response_model=NewsletterSubscribeResponse)
@limiter.limit("5/minute")
async def subscribe(
    request: Request,
    payload: NewsletterSubscribeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Добавить email в список рассылки. Повторная подписка не считается ошибкой."""
    email = payload.email.strip().lower()

    result = await db.execute(
        select(NewsletterSubscriber).where(NewsletterSubscriber.email == email)
    )
    existing = result.scalar_one_or_none()

    if existing is not None:
        if existing.is_active:
            return NewsletterSubscribeResponse(success=True, already_subscribed=True)

        # Человек отписывался и вернулся — реактивируем и обновляем согласие.
        existing.is_active = True
        existing.unsubscribed_at = None
        existing.consent_at = func.now()
        existing.source = payload.source or existing.source
        existing.language = payload.language or existing.language
        await db.commit()
        return NewsletterSubscribeResponse(success=True, already_subscribed=False)

    subscriber = NewsletterSubscriber(
        email=email,
        source=payload.source,
        language=payload.language,
    )
    db.add(subscriber)

    try:
        await db.commit()
    except IntegrityError:
        # Гонка двух одновременных отправок — уникальный индекс уже отработал.
        await db.rollback()
        return NewsletterSubscribeResponse(success=True, already_subscribed=True)

    return NewsletterSubscribeResponse(success=True, already_subscribed=False)
