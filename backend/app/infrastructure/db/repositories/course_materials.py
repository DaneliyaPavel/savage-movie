"""
SQLAlchemy repository for CourseMaterial.
"""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.course_material import CourseMaterial


class SqlAlchemyCourseMaterialsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_course(self, course_id: UUID) -> List[CourseMaterial]:
        result = await self._session.execute(
            select(CourseMaterial)
            .where(CourseMaterial.course_id == course_id)
            .order_by(CourseMaterial.display_order.asc().nulls_last(), CourseMaterial.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, material_id: UUID) -> Optional[CourseMaterial]:
        result = await self._session.execute(
            select(CourseMaterial).where(CourseMaterial.id == material_id)
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> CourseMaterial:
        material = CourseMaterial(**data)
        self._session.add(material)
        await self._session.commit()
        await self._session.refresh(material)
        return material

    async def update(self, material: CourseMaterial, data: dict) -> CourseMaterial:
        for field, value in data.items():
            setattr(material, field, value)
        await self._session.commit()
        await self._session.refresh(material)
        return material

    async def delete(self, material: CourseMaterial) -> None:
        await self._session.delete(material)
        await self._session.commit()
