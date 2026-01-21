"""
Модель проекта
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, func, ARRAY, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    client = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    video_url = Column(Text, nullable=True)
    images = Column(ARRAY(Text), nullable=True)
    duration = Column(Integer, nullable=True)
    role = Column(Text, nullable=True)
    tools = Column(ARRAY(Text), nullable=True)
    behind_scenes = Column(ARRAY(Text), nullable=True)
    is_featured = Column(Boolean, nullable=False, default=False)  # Для отображения на главной странице
    mux_playback_id = Column(Text, nullable=True)  # Mux playback ID для видео
    title_ru = Column(Text, nullable=True)  # Русское название
    title_en = Column(Text, nullable=True)  # Английское название
    description_ru = Column(Text, nullable=True)  # Русское описание
    description_en = Column(Text, nullable=True)  # Английское описание
    thumbnail_url = Column(Text, nullable=True)  # URL миниатюры для carousel
    cover_image_url = Column(Text, nullable=True)  # URL обложки
    year = Column(Integer, nullable=True)  # Год проекта
    display_order = Column(Integer, nullable=True, default=0)  # Порядок отображения
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
