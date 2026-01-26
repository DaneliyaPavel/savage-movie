"""
Pydantic схема для контактной формы
"""
from typing import Optional

from pydantic import BaseModel, EmailStr


class ContactFormData(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    budget: Optional[int] = None
