"""
SQLAlchemy repository for ProjectVideo.
"""
from __future__ import annotations

from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.project_video import ProjectVideo


class SqlAlchemyProjectVideosRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_project(self, project_id: UUID) -> List[ProjectVideo]:
        result = await self._session.execute(
            select(ProjectVideo)
            .where(ProjectVideo.project_id == project_id)
            .order_by(ProjectVideo.display_order.asc(), ProjectVideo.created_at.asc())
        )
        return result.scalars().all()

    async def get_by_id(self, video_id: UUID) -> ProjectVideo | None:
        result = await self._session.execute(
            select(ProjectVideo).where(ProjectVideo.id == video_id)
        )
        return result.scalar_one_or_none()

    async def create(self, project_id: UUID, data: dict) -> ProjectVideo:
        video = ProjectVideo(project_id=project_id, **data)
        self._session.add(video)
        await self._session.commit()
        await self._session.refresh(video)
        return video

    async def update(self, video: ProjectVideo, data: dict) -> ProjectVideo:
        for field, value in data.items():
            setattr(video, field, value)
        await self._session.commit()
        await self._session.refresh(video)
        return video

    async def delete(self, video: ProjectVideo) -> None:
        await self._session.delete(video)
        await self._session.commit()
