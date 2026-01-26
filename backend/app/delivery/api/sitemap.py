"""
API роуты для sitemap
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.infrastructure.db.session import get_db
from app.infrastructure.db.repositories.sitemap import SqlAlchemySitemapRepository

router = APIRouter(prefix="/api/sitemap", tags=["sitemap"])


class SitemapItem(BaseModel):
    slug: str
    updated_at: datetime


@router.get("/projects", response_model=List[SitemapItem])
async def get_projects_for_sitemap(db: AsyncSession = Depends(get_db)):
    """Получить список проектов для sitemap"""
    repo = SqlAlchemySitemapRepository(db)
    projects = await repo.list_projects()
    
    return [SitemapItem(slug=slug, updated_at=updated_at) for slug, updated_at in projects]


@router.get("/courses", response_model=List[SitemapItem])
async def get_courses_for_sitemap(db: AsyncSession = Depends(get_db)):
    """Получить список курсов для sitemap"""
    repo = SqlAlchemySitemapRepository(db)
    courses = await repo.list_courses()
    
    return [SitemapItem(slug=slug, updated_at=updated_at) for slug, updated_at in courses]


@router.get("/blog", response_model=List[SitemapItem])
async def get_blog_for_sitemap(db: AsyncSession = Depends(get_db)):
    """Получить список опубликованных статей для sitemap"""
    repo = SqlAlchemySitemapRepository(db)
    posts = await repo.list_blog_posts()

    return [SitemapItem(slug=slug, updated_at=updated_at) for slug, updated_at in posts]
