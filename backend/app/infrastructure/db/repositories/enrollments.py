"""
SQLAlchemy repository for Enrollment.
"""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.enrollment import Enrollment


class SqlAlchemyEnrollmentsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_user(self, user_id: UUID) -> List[Enrollment]:
        result = await self._session.execute(
            select(Enrollment)
            .where(Enrollment.user_id == user_id)
            .order_by(Enrollment.enrolled_at.desc())
        )
        return result.scalars().all()

    async def get_by_user_and_course(self, user_id: UUID, course_id: UUID) -> Optional[Enrollment]:
        result = await self._session.execute(
            select(Enrollment).where(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id_and_user(self, enrollment_id: UUID, user_id: UUID) -> Optional[Enrollment]:
        result = await self._session.execute(
            select(Enrollment).where(
                Enrollment.id == enrollment_id,
                Enrollment.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: UUID, course_id: UUID, progress: int = 0) -> Enrollment:
        enrollment = Enrollment(user_id=user_id, course_id=course_id, progress=progress)
        self._session.add(enrollment)
        await self._session.commit()
        await self._session.refresh(enrollment)
        return enrollment

    async def update(self, enrollment: Enrollment, data: dict) -> Enrollment:
        for field, value in data.items():
            setattr(enrollment, field, value)
        await self._session.commit()
        await self._session.refresh(enrollment)
        return enrollment
