"""
SQLAlchemy repository for Testimonial.
"""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.testimonial import Testimonial


class SqlAlchemyTestimonialsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_testimonials(self) -> List[Testimonial]:
        result = await self._session.execute(
            select(Testimonial).order_by(Testimonial.order.asc(), Testimonial.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_id(self, testimonial_id: UUID) -> Optional[Testimonial]:
        result = await self._session.execute(select(Testimonial).where(Testimonial.id == testimonial_id))
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Testimonial:
        testimonial = Testimonial(**data)
        self._session.add(testimonial)
        await self._session.commit()
        await self._session.refresh(testimonial)
        return testimonial

    async def update(self, testimonial: Testimonial, data: dict) -> Testimonial:
        for field, value in data.items():
            setattr(testimonial, field, value)
        await self._session.commit()
        await self._session.refresh(testimonial)
        return testimonial

    async def delete(self, testimonial: Testimonial) -> None:
        await self._session.delete(testimonial)
        await self._session.commit()
