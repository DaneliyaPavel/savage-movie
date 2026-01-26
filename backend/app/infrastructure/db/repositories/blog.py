"""
SQLAlchemy repository for BlogPost.
"""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.blog_post import BlogPost


class SqlAlchemyBlogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_posts(
        self,
        published: Optional[bool],
        limit: int,
        offset: int,
    ) -> List[BlogPost]:
        query = select(BlogPost)
        if published is not None:
            query = query.where(BlogPost.is_published == published)

        query = query.order_by(
            func.coalesce(BlogPost.published_at, BlogPost.created_at).desc(),
            BlogPost.created_at.desc(),
        ).limit(limit).offset(offset)

        result = await self._session.execute(query)
        return result.scalars().all()

    async def get_by_slug(self, slug: str) -> Optional[BlogPost]:
        result = await self._session.execute(select(BlogPost).where(BlogPost.slug == slug))
        return result.scalar_one_or_none()

    async def get_published_by_slug(self, slug: str) -> Optional[BlogPost]:
        result = await self._session.execute(
            select(BlogPost).where(BlogPost.slug == slug, BlogPost.is_published.is_(True))
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, post_id: UUID) -> Optional[BlogPost]:
        result = await self._session.execute(select(BlogPost).where(BlogPost.id == post_id))
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> BlogPost:
        post = BlogPost(**data)
        self._session.add(post)
        await self._session.commit()
        await self._session.refresh(post)
        return post

    async def update(self, post: BlogPost, data: dict) -> BlogPost:
        for field, value in data.items():
            setattr(post, field, value)
        await self._session.commit()
        await self._session.refresh(post)
        return post

    async def delete(self, post: BlogPost) -> None:
        await self._session.delete(post)
        await self._session.commit()
