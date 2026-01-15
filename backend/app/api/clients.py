"""
API роуты для клиентов
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.client import Client
from app.models.user import User
from app.schemas.client import Client as ClientSchema, ClientCreate, ClientUpdate
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("", response_model=List[ClientSchema])
async def get_clients(
    db: AsyncSession = Depends(get_db)
):
    """Получить список клиентов"""
    result = await db.execute(
        select(Client).order_by(Client.order.asc(), Client.created_at.desc())
    )
    clients = result.scalars().all()
    return clients


@router.get("/by-slug/{slug}", response_model=ClientSchema)
async def get_client_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Получить клиента/режиссера по slug"""
    result = await db.execute(
        select(Client).where(Client.slug == slug)
    )
    client = result.scalar_one_or_none()
    
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
    
    new_client = Client(**client_data.model_dump())
    db.add(new_client)
    await db.commit()
    await db.refresh(new_client)
    
    return new_client


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
    
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    # Обновляем поля
    update_data = client_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
    
    await db.commit()
    await db.refresh(client)
    
    return client


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
    
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Клиент не найден"
        )
    
    await db.delete(client)
    await db.commit()
    
    return None
