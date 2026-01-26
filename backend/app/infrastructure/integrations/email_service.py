"""
Сервис для отправки email через Resend
"""
import httpx
import html
from typing import Dict
from app.config import settings


def escape_html(text: str) -> str:
    """Экранирует HTML символы для предотвращения XSS"""
    if not text:
        return ""
    return html.escape(str(text))


async def send_contact_form_notification(admin_email: str, submission_data: Dict) -> bool:
    """Отправляет уведомление администратору о новой заявке"""
    if not settings.RESEND_API_KEY:
        # В production используйте логирование вместо print
        return False
    
    try:
        # Экранируем все данные для предотвращения XSS
        name = escape_html(str(submission_data.get('name', '')))
        email = escape_html(str(submission_data.get('email', '')))
        phone = escape_html(str(submission_data.get('phone', 'Не указан')))
        budget = submission_data.get('budget')
        budget_str = f"{budget} ₽" if budget else "Не указан"
        message = escape_html(str(submission_data.get('message', '')))
        subject_name = escape_html(str(submission_data.get('name', '')))
        
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
                    "subject": f"Новая заявка с сайта: {subject_name}",
                    "html": f"""
                    <h2>Новая заявка с контактной формы</h2>
                    <p><strong>Имя:</strong> {name}</p>
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Телефон:</strong> {phone}</p>
                    <p><strong>Бюджет:</strong> {budget_str}</p>
                    <p><strong>Сообщение:</strong></p>
                    <p>{message}</p>
                    """,
                }
            )
            return response.status_code == 200
    except Exception as e:
        # В production используйте логирование вместо print
        return False


async def send_course_enrollment_confirmation(user_email: str, course_title: str) -> bool:
    """Отправляет подтверждение записи на курс"""
    if not settings.RESEND_API_KEY:
        return False
    
    try:
        # Экранируем данные для предотвращения XSS
        safe_course_title = escape_html(course_title)
        safe_app_url = escape_html(settings.APP_URL)
        
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
                    "subject": f"Вы записаны на курс: {safe_course_title}",
                    "html": f"""
                    <h2>Добро пожаловать на курс!</h2>
                    <p>Вы успешно записались на курс <strong>{safe_course_title}</strong>.</p>
                    <p>Теперь вы можете начать обучение в личном кабинете.</p>
                    <p><a href="{safe_app_url}/dashboard">Перейти в личный кабинет</a></p>
                    """,
                }
            )
            return response.status_code == 200
    except Exception:
        # В production используйте логирование вместо print
        return False
