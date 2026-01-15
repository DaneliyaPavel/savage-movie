"""
Модель проекта
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, func, ARRAY
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
