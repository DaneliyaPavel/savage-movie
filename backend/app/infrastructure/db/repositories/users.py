"""
SQLAlchemy repository for User.
"""
from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.user import User


class SqlAlchemyUsersRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_email_or_provider(
        self,
        email: str,
        provider: str,
        provider_id: str,
    ) -> Optional[User]:
        result = await self._session.execute(
            select(User).where(
                or_(
                    User.email == email,
                    and_(User.provider == provider, User.provider_id == provider_id),
                )
            )
        )
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> User:
        user = User(**data)
        self._session.add(user)
        await self._session.commit()
        await self._session.refresh(user)
        return user

    async def update(self, user: User, data: dict) -> User:
        for field, value in data.items():
            setattr(user, field, value)
        await self._session.commit()
        await self._session.refresh(user)
        return user
