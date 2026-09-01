"""
Модель подписчика на рассылку
"""
from sqlalchemy import Boolean, Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.infrastructure.db.session import Base


class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(320), nullable=False, unique=True, index=True)
    # Откуда пришла подписка: подвал портфолио, страница проекта и т.д.
    source = Column(String(64), nullable=True)
    language = Column(String(8), nullable=True)
    # Отписка не удаляет запись: адрес нужен, чтобы не слать письма повторно.
    is_active = Column(Boolean, nullable=False, server_default="true")
    # Когда человек дал согласие на обработку ПД — доказательство по 152-ФЗ
    consent_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)
