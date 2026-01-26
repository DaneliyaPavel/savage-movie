"""
SQLAlchemy repository for Setting.
"""
from __future__ import annotations

from typing import Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.setting import Setting


class SqlAlchemySettingsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_settings(self) -> List[Setting]:
        result = await self._session.execute(select(Setting))
        return result.scalars().all()

    async def get_by_key(self, key: str) -> Optional[Setting]:
        result = await self._session.execute(select(Setting).where(Setting.key == key))
        return result.scalar_one_or_none()

    async def upsert_many(self, updates: Dict[str, object]) -> None:
        for key, value in updates.items():
            existing = await self.get_by_key(key)
            if existing:
                existing.value = value
            else:
                self._session.add(Setting(key=key, value=value))
        await self._session.commit()
