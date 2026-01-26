"""
API роуты для клиентов
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.clients import SqlAlchemyClientsRepository
from app.interfaces.schemas.client import Client as ClientSchema, ClientCreate, ClientUpdate
from app.delivery.api.auth import get_current_user

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("", response_model=List[ClientSchema])
async def get_clients(
    db: AsyncSession = Depends(get_db)
):
    """Получить список клиентов"""
    repo = SqlAlchemyClientsRepository(db)
    return await repo.list_clients()


@router.get("/by-slug/{slug}", response_model=ClientSchema)
async def get_client_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Получить клиента/режиссера по slug"""
    repo = SqlAlchemyClientsRepository(db)
    client = await repo.get_by_slug(slug)
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    return client


@router.post("", response_model=ClientSchema, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать клиента (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут создавать клиентов"
        )
    
    repo = SqlAlchemyClientsRepository(db)
    return await repo.create(client_data.model_dump())


@router.put("/{client_id}", response_model=ClientSchema)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить клиента (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут обновлять клиентов"
        )
    
    repo = SqlAlchemyClientsRepository(db)
    client = await repo.get_by_id(client_id)
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    # Обновляем поля
    update_data = client_data.model_dump(exclude_unset=True)
    return await repo.update(client, update_data)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удалить клиента (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут удалять клиентов"
        )
    
    repo = SqlAlchemyClientsRepository(db)
    client = await repo.get_by_id(client_id)
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    await repo.delete(client)
    return None
