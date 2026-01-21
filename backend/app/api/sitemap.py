"""
API роуты для sitemap
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.project import Project
from app.models.course import Course
from app.models.blog_post import BlogPost

router = APIRouter(prefix="/api/sitemap", tags=["sitemap"])


class SitemapItem(BaseModel):
    slug: str
    updated_at: datetime


@router.get("/projects", response_model=List[SitemapItem])
async def get_projects_for_sitemap(db: AsyncSession = Depends(get_db)):
    """Получить список проектов для sitemap"""
    result = await db.execute(
        select(Project.slug, Project.updated_at)
        .order_by(Project.updated_at.desc())
    )
    projects = result.all()
    
    return [SitemapItem(slug=slug, updated_at=updated_at) for slug, updated_at in projects]


@router.get("/courses", response_model=List[SitemapItem])
async def get_courses_for_sitemap(db: AsyncSession = Depends(get_db)):
    """Получить список курсов для sitemap"""
    result = await db.execute(
        select(Course.slug, Course.updated_at)
        .order_by(Course.updated_at.desc())
    )
    courses = result.all()
    
    return [SitemapItem(slug=slug, updated_at=updated_at) for slug, updated_at in courses]


@router.get("/blog", response_model=List[SitemapItem])
async def get_blog_for_sitemap(db: AsyncSession = Depends(get_db)):
    """Получить список опубликованных статей для sitemap"""
    result = await db.execute(
        select(BlogPost.slug, BlogPost.updated_at)
        .where(BlogPost.is_published.is_(True))
        .order_by(BlogPost.updated_at.desc())
    )
    posts = result.all()

    return [SitemapItem(slug=slug, updated_at=updated_at) for slug, updated_at in posts]
