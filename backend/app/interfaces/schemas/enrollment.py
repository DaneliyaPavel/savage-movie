"""
Pydantic схемы для записей на курсы
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class EnrollmentBase(BaseModel):
    progress: int = 0


class EnrollmentCreate(BaseModel):
    course_id: UUID


class EnrollmentUpdate(BaseModel):
    progress: Optional[int] = None
    completed_at: Optional[datetime] = None


class Enrollment(EnrollmentBase):
    id: UUID
    user_id: UUID
    course_id: UUID
    enrolled_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EnrollmentWithCourse(Enrollment):
    course: dict  # Course данные
