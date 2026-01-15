"""
Модель клиента/режиссера
"""
from sqlalchemy import Column, String, Integer, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    order = Column(Integer, default=0, nullable=False)
    
    # Поля для Directors/Режиссеров
    slug = Column(String, nullable=True, unique=True)  # URL slug для страницы режиссера
    video_url = Column(String, nullable=True)  # URL видео для hover эффекта
    video_playback_id = Column(String, nullable=True)  # Mux playback ID для hover видео
    portfolio_videos = Column(JSONB, nullable=True)  # Массив видео для портфолио: [{"url": "...", "playback_id": "...", "title": "..."}, ...]
    bio = Column(Text, nullable=True)  # Биография режиссера
    role = Column(String, nullable=True)  # Роль: director, cinematographer, producer и т.д.
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
