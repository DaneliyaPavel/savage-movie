"""
Pydantic схемы для клиентов/режиссеров
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class ClientBase(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    order: int = 0
    # Поля для Directors
    slug: Optional[str] = None
    video_url: Optional[str] = None
    video_playback_id: Optional[str] = None
    portfolio_videos: Optional[List[Dict[str, Any]]] = None
    bio: Optional[str] = None
    role: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    order: Optional[int] = None
    # Поля для Directors
    slug: Optional[str] = None
    video_url: Optional[str] = None
    video_playback_id: Optional[str] = None
    portfolio_videos: Optional[List[Dict[str, Any]]] = None
    bio: Optional[str] = None
    role: Optional[str] = None


class Client(ClientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
