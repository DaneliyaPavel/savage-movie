"""
Pydantic схемы для пользователей
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    # Лимиты только на входе: UserBase общий с UserResponse, а ограничение в ответе
    # уронило бы /me и /admin/users на уже существующих длинных строках.
    # provider клиентом не задаётся: публичная регистрация всегда создаёт email-аккаунт
    # (лишнее поле в теле игнорируется), см. register в delivery/api/auth.py.
    email: EmailStr = Field(max_length=254)
    full_name: Optional[str] = Field(default=None, max_length=200)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)


class UserResponse(UserBase):
    id: UUID
    provider: str
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class User(UserResponse):
    pass


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None
    email: Optional[str] = None
