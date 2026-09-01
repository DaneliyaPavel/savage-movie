"""
Pydantic схемы подписки на рассылку
"""
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr
    source: Optional[str] = Field(default=None, max_length=64)
    language: Optional[str] = Field(default=None, max_length=8)


class NewsletterSubscribeResponse(BaseModel):
    success: bool
    # Адрес уже был в списке — фронту это нужно, чтобы не пугать человека ошибкой
    already_subscribed: bool = False
