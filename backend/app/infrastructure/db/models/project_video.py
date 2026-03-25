"""
Модель дополнительного видео проекта (Bunny Stream)
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.infrastructure.db.session import Base


class ProjectVideo(Base):
    __tablename__ = "project_videos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(Text, nullable=True)
    mux_playback_id = Column(Text, nullable=False)
    orientation = Column(String, nullable=False, default="horizontal")  # horizontal | vertical
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
