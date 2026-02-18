"""
Pydantic схемы для курсов
"""
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class CardCoverSettings(BaseModel):
    """Настройки обложки карточки курса (mesh, grid, scanlines, orbs, etc.)"""
    preset: Optional[str] = None  # mesh, meshGrid, meshGridScanlines, minimalTech
    accent1: Optional[str] = None
    accent2: Optional[str] = None
    accent3: Optional[str] = None
    show_grid: Optional[bool] = None
    show_noise: Optional[bool] = None
    show_scanlines: Optional[bool] = None
    show_orbs: Optional[bool] = None
    show_frame_corners: Optional[bool] = None
    show_play_icon: Optional[bool] = None
    overlay_strength: Optional[str] = None  # low, medium, high

    class Config:
        extra = 'ignore'


class LessonBase(BaseModel):
    title: str
    video_url: Optional[str] = None
    duration: Optional[int] = None
    order: int


class LessonCreate(LessonBase):
    pass


class Lesson(LessonBase):
    id: UUID
    module_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class CourseModuleBase(BaseModel):
    title: str
    order: int


class CourseModuleCreate(CourseModuleBase):
    lessons: Optional[List[LessonCreate]] = []


class CourseModule(CourseModuleBase):
    id: UUID
    course_id: UUID
    lessons: List[Lesson] = []
    created_at: datetime

    class Config:
        from_attributes = True


class CourseBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    price: Decimal
    duration: Optional[int] = None
    cover_image: Optional[str] = None
    video_promo_url: Optional[str] = None
    category: str
    requirements: Optional[List[str]] = None
    what_you_learn: Optional[List[str]] = None
    level: Optional[str] = None  # 'beginner', 'intermediate', 'advanced'
    certificate: Optional[str] = None  # 'yes', 'no'
    format: Optional[str] = None  # 'online', 'offline', 'hybrid', 'online+live'
    display_order: Optional[int] = None
    short_description: Optional[str] = None
    duration_text: Optional[str] = None
    location_text: Optional[str] = None
    schedule_text: Optional[str] = None
    tags: Optional[List[str]] = None
    badge_text: Optional[str] = None
    cta_text: Optional[str] = None
    card_cover: Optional[dict[str, Any]] = None  # CardCoverSettings as dict from JSONB


class CourseCreate(CourseBase):
    instructor_id: Optional[UUID] = None
    modules: Optional[List[CourseModuleCreate]] = []


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    duration: Optional[int] = None
    cover_image: Optional[str] = None
    video_promo_url: Optional[str] = None
    category: Optional[str] = None
    requirements: Optional[List[str]] = None
    what_you_learn: Optional[List[str]] = None
    level: Optional[str] = None
    certificate: Optional[str] = None
    format: Optional[str] = None
    display_order: Optional[int] = None
    short_description: Optional[str] = None
    duration_text: Optional[str] = None
    location_text: Optional[str] = None
    schedule_text: Optional[str] = None
    tags: Optional[List[str]] = None
    badge_text: Optional[str] = None
    cta_text: Optional[str] = None
    card_cover: Optional[dict[str, Any]] = None
    instructor_id: Optional[UUID] = None
    modules: Optional[List[CourseModuleCreate]] = None


class Course(CourseBase):
    id: UUID
    instructor_id: Optional[UUID] = None
    modules: List[CourseModule] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
