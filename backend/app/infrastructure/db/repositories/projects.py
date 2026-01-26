"""
SQLAlchemy repository for Project.
"""
from __future__ import annotations

from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.project import Project


class SqlAlchemyProjectsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_projects(
        self,
        category: Optional[str],
        featured: Optional[bool],
        limit: int,
        offset: int,
    ) -> List[Project]:
        query = select(Project)

        if category and category != "all":
            query = query.where(Project.category == category)

        if featured is not None:
            query = query.where(Project.is_featured == featured)

        query = query.order_by(
            func.coalesce(Project.display_order, 0).asc(),
            Project.created_at.desc(),
        ).limit(limit).offset(offset)

        result = await self._session.execute(query)
        return result.scalars().all()

    async def get_by_slug(self, slug: str) -> Optional[Project]:
        result = await self._session.execute(select(Project).where(Project.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_id(self, project_id: UUID) -> Optional[Project]:
        result = await self._session.execute(select(Project).where(Project.id == project_id))
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Project:
        new_project = Project(**data)
        self._session.add(new_project)
        await self._session.commit()
        await self._session.refresh(new_project)
        return new_project

    async def update(self, project: Project, data: dict) -> Project:
        for field, value in data.items():
            setattr(project, field, value)
        await self._session.commit()
        await self._session.refresh(project)
        return project

    async def delete(self, project: Project) -> None:
        await self._session.delete(project)
        await self._session.commit()

    async def reorder(self, updates: list[dict]) -> None:
        for update in updates:
            project_id = UUID(update["id"])
            display_order = update["display_order"]

            project = await self.get_by_id(project_id)
            if project:
                project.display_order = display_order

        await self._session.commit()
