"""
SQLAlchemy repository for User.
"""
from __future__ import annotations

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.user import User


class SqlAlchemyUsersRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self, limit: int = 100, offset: int = 0) -> List[User]:
        result = await self._session.execute(
            select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars().all())

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self._session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_provider(self, provider: str, provider_id: str) -> Optional[User]:
        # Без provider_id не ищем: иначе "IS NULL" совпал бы с любым аккаунтом без привязки.
        # Уникального индекса на (provider, provider_id) нет, поэтому first(), а не one_or_none.
        if not provider_id:
            return None
        result = await self._session.execute(
            select(User)
            .where(User.provider == provider, User.provider_id == provider_id)
            .order_by(User.created_at)
        )
        return result.scalars().first()

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
