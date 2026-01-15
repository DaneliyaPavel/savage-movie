"""
Модели курсов, модулей и уроков
"""
from sqlalchemy import Column, String, Text, Integer, Numeric, DateTime, func, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False, default=0)
    duration = Column(Integer, nullable=True)
    cover_image = Column(Text, nullable=True)
    video_promo_url = Column(Text, nullable=True)
    instructor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    category = Column(String, nullable=False)
    requirements = Column(ARRAY(Text), nullable=True)
    what_you_learn = Column(ARRAY(Text), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    modules = relationship("CourseModule", back_populates="course", cascade="all, delete-orphan")


class CourseModule(Base):
    __tablename__ = "course_modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(Text, nullable=False)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("course_modules.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(Text, nullable=False)
    video_url = Column(Text, nullable=True)
    duration = Column(Integer, nullable=True)
    order = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    module = relationship("CourseModule", back_populates="lessons")
