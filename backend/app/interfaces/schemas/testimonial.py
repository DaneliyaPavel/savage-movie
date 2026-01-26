"""
Pydantic схемы для отзывов
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class TestimonialBase(BaseModel):
    name: str
    company: Optional[str] = None
    project_type: Optional[str] = None
    text: Optional[str] = None
    rating: int = Field(ge=1, le=5, default=5)
    video_url: Optional[str] = None
    video_playback_id: Optional[str] = None
    order: int = 0


class TestimonialCreate(TestimonialBase):
    pass


class TestimonialUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    project_type: Optional[str] = None
    text: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    video_url: Optional[str] = None
    video_playback_id: Optional[str] = None
    order: Optional[int] = None


class Testimonial(TestimonialBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
