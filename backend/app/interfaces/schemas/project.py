"""
Pydantic схемы для проектов
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ProjectBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    client: Optional[str] = None
    category: str
    video_url: Optional[str] = None
    orientation: Optional[str] = None
    images: Optional[List[str]] = None
    duration: Optional[int] = None
    role: Optional[str] = None
    tools: Optional[List[str]] = None
    behind_scenes: Optional[List[str]] = None
    is_featured: Optional[bool] = False
    mux_playback_id: Optional[str] = None
    title_ru: Optional[str] = None
    title_en: Optional[str] = None
    description_ru: Optional[str] = None
    description_en: Optional[str] = None
    thumbnail_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    year: Optional[int] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    client: Optional[str] = None
    category: Optional[str] = None
    video_url: Optional[str] = None
    orientation: Optional[str] = None
    images: Optional[List[str]] = None
    duration: Optional[int] = None
    role: Optional[str] = None
    tools: Optional[List[str]] = None
    behind_scenes: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    mux_playback_id: Optional[str] = None
    title_ru: Optional[str] = None
    title_en: Optional[str] = None
    description_ru: Optional[str] = None
    description_en: Optional[str] = None
    thumbnail_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    year: Optional[int] = None
    display_order: Optional[int] = None


class Project(ProjectBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
