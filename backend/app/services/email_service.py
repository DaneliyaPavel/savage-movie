"""
Сервис для отправки email через Resend
"""
import httpx
from typing import Dict
from app.config import settings


async def send_contact_form_notification(admin_email: str, submission_data: Dict) -> bool:
    """Отправляет уведомление администратору о новой заявке"""
    if not settings.RESEND_API_KEY:
        print("RESEND_API_KEY не настроен, пропускаем отправку email")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.ADMIN_EMAIL,
                    "to": [admin_email],
                    "subject": f"Новая заявка с сайта: {submission_data.get('name')}",
                    "html": f"""
                    <h2>Новая заявка с контактной формы</h2>
                    <p><strong>Имя:</strong> {submission_data.get('name')}</p>
                    <p><strong>Email:</strong> {submission_data.get('email')}</p>
                    <p><strong>Телефон:</strong> {submission_data.get('phone', 'Не указан')}</p>
                    <p><strong>Бюджет:</strong> {submission_data.get('budget', 'Не указан')} ₽</p>
                    <p><strong>Сообщение:</strong></p>
                    <p>{submission_data.get('message')}</p>
                    """,
                }
            )
            return response.status_code == 200
    except Exception as e:
        print(f"Ошибка отправки email: {e}")
        return False


async def send_course_enrollment_confirmation(user_email: str, course_title: str) -> bool:
    """Отправляет подтверждение записи на курс"""
    if not settings.RESEND_API_KEY:
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": settings.ADMIN_EMAIL,
                    "to": [user_email],
                    "subject": f"Вы записаны на курс: {course_title}",
                    "html": f"""
                    <h2>Добро пожаловать на курс!</h2>
                    <p>Вы успешно записались на курс <strong>{course_title}</strong>.</p>
                    <p>Теперь вы можете начать обучение в личном кабинете.</p>
                    <p><a href="{settings.APP_URL}/dashboard">Перейти в личный кабинет</a></p>
                    """,
                }
            )
            return response.status_code == 200
    except Exception as e:
        print(f"Ошибка отправки email: {e}")
        return False
