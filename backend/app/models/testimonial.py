"""
Модель отзыва
"""
from sqlalchemy import Column, String, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.database import Base


class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    company = Column(String, nullable=True)
    project_type = Column(String, nullable=True)
    text = Column(String, nullable=True)
    rating = Column(Integer, nullable=False, default=5)
    video_url = Column(String, nullable=True)
    video_playback_id = Column(String, nullable=True)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
