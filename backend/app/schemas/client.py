"""
Pydantic схемы для клиентов
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ClientBase(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    order: int = 0


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    order: Optional[int] = None


class Client(ClientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
