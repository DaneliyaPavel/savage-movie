"""
Модель настроек сайта
"""
from sqlalchemy import Column, String, JSON, DateTime, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.infrastructure.db.session import Base


class Setting(Base):
    __tablename__ = "settings"
    __table_args__ = (UniqueConstraint('key', name='unique_setting_key'),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
