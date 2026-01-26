"""
SQLAlchemy repository for Client.
"""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models.client import Client


class SqlAlchemyClientsRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_clients(self) -> List[Client]:
        result = await self._session.execute(
            select(Client).order_by(Client.order.asc(), Client.created_at.desc())
        )
        return result.scalars().all()

    async def get_by_slug(self, slug: str) -> Optional[Client]:
        result = await self._session.execute(select(Client).where(Client.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_id(self, client_id: UUID) -> Optional[Client]:
        result = await self._session.execute(select(Client).where(Client.id == client_id))
        return result.scalar_one_or_none()

    async def create(self, data: dict) -> Client:
        client = Client(**data)
        self._session.add(client)
        await self._session.commit()
        await self._session.refresh(client)
        return client

    async def update(self, client: Client, data: dict) -> Client:
        for field, value in data.items():
            setattr(client, field, value)
        await self._session.commit()
        await self._session.refresh(client)
        return client

    async def delete(self, client: Client) -> None:
        await self._session.delete(client)
        await self._session.commit()
