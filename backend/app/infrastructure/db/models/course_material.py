"""
Модель материала курса (файлы, ссылки для офлайн/доп. материалов)
"""
from sqlalchemy import Column, String, Text, Integer, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.infrastructure.db.session import Base


class CourseMaterial(Base):
    __tablename__ = "course_materials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True, index=True)
    title = Column(Text, nullable=False)
    material_type = Column(String(20), nullable=False, default="link")  # 'file' | 'link'
    file_url = Column(Text, nullable=True)
    external_url = Column(Text, nullable=True)
    display_order = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", backref="materials")
