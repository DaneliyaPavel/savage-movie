"""
Pydantic схемы для материалов курса
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class CourseMaterialBase(BaseModel):
    title: str
    material_type: str = "link"  # 'file' | 'link'
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    lesson_id: Optional[UUID] = None
    display_order: Optional[int] = 0


class CourseMaterialCreate(CourseMaterialBase):
    course_id: UUID


class CourseMaterialUpdate(BaseModel):
    title: Optional[str] = None
    material_type: Optional[str] = None
    file_url: Optional[str] = None
    external_url: Optional[str] = None
    lesson_id: Optional[UUID] = None
    display_order: Optional[int] = None


class CourseMaterial(CourseMaterialBase):
    id: UUID
    course_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
