"""
SQLAlchemy repository for sitemap items.
"""
from __future__ import annotations

from typing import List, Tuple
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.project import Project
from app.infrastructure.db.models.course import Course
from app.infrastructure.db.models.blog_post import BlogPost


class SqlAlchemySitemapRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_projects(self) -> List[Tuple[str, datetime]]:
        result = await self._session.execute(
            select(Project.slug, Project.updated_at).order_by(Project.updated_at.desc())
        )
        return result.all()

    async def list_courses(self) -> List[Tuple[str, datetime]]:
        result = await self._session.execute(
            select(Course.slug, Course.updated_at).order_by(Course.updated_at.desc())
        )
        return result.all()

    async def list_blog_posts(self) -> List[Tuple[str, datetime]]:
        result = await self._session.execute(
            select(BlogPost.slug, BlogPost.updated_at)
            .where(BlogPost.is_published.is_(True))
            .order_by(BlogPost.updated_at.desc())
        )
        return result.all()
