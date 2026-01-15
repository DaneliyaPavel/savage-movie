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
    images: Optional[List[str]] = None
    duration: Optional[int] = None
    role: Optional[str] = None
    tools: Optional[List[str]] = None
    behind_scenes: Optional[List[str]] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    client: Optional[str] = None
    category: Optional[str] = None
    video_url: Optional[str] = None
    images: Optional[List[str]] = None
    duration: Optional[int] = None
    role: Optional[str] = None
    tools: Optional[List[str]] = None
    behind_scenes: Optional[List[str]] = None


class Project(ProjectBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
