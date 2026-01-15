"""
API роуты для контактной формы
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.database import get_db
from app.models.contact import ContactSubmission
from app.services.email_service import send_contact_form_notification
from app.config import settings

router = APIRouter(prefix="/api/contact", tags=["contact"])


class ContactFormData(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    budget: Optional[int] = None


@router.post("")
async def submit_contact_form(
    form_data: ContactFormData,
    db: AsyncSession = Depends(get_db)
):
    """Отправить заявку с контактной формы"""
    # Сохраняем в БД
    new_submission = ContactSubmission(
        name=form_data.name,
        email=form_data.email,
        phone=form_data.phone,
        message=form_data.message,
        budget=form_data.budget
    )
    db.add(new_submission)
    await db.commit()
    await db.refresh(new_submission)
    
    # Отправляем email администратору
    await send_contact_form_notification(
        settings.ADMIN_EMAIL,
        form_data.model_dump()
    )
    
    return {"success": True, "message": "Заявка успешно отправлена"}
