"""
Pydantic схемы для блога
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class BlogPostBase(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    reading_time: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = False
    published_at: Optional[datetime] = None


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    reading_time: Optional[str] = None
    content: Optional[str] = None
    is_published: Optional[bool] = None
    published_at: Optional[datetime] = None


class BlogPost(BlogPostBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
