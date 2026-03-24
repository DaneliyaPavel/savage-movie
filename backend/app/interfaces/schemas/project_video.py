"""
Pydantic схемы для дополнительных видео проекта
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ProjectVideoCreate(BaseModel):
    title: Optional[str] = None
    mux_playback_id: str
    orientation: str = "horizontal"
    display_order: int = 0


class ProjectVideoUpdate(BaseModel):
    title: Optional[str] = None
    mux_playback_id: Optional[str] = None
    orientation: Optional[str] = None
    display_order: Optional[int] = None


class ProjectVideo(BaseModel):
    id: UUID
    project_id: UUID
    title: Optional[str] = None
    mux_playback_id: str
    orientation: str
    display_order: int
    created_at: datetime

    class Config:
        from_attributes = True
