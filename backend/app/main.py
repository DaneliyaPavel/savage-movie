"""
Главный файл FastAPI приложения
"""
import os
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

logger = logging.getLogger(__name__)
from app.delivery.api import (
    auth,
    projects,
    project_videos,
    courses,
    enrollments,
    contact,
    sitemap,
    upload,
    clients,
    testimonials,
    settings as settings_api,
    payments,
    blog,
    course_materials,
    admin,
    platform,
)

from sqlalchemy import select
from app.infrastructure.db.session import AsyncSessionLocal
from app.infrastructure.db.models.user import User
from app.utils.security import hash_password

_is_production = os.getenv("ENV", "").lower() == "production"

app = FastAPI(
    title="SAVAGE MOVIE API",
    description="API для сайта видеографа и продюсера",
    version="1.0.0",
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(project_videos.router)
app.include_router(courses.router)
app.include_router(enrollments.router)
app.include_router(contact.router)
app.include_router(sitemap.router)
app.include_router(upload.router)
app.include_router(clients.router)
app.include_router(testimonials.router)
app.include_router(settings_api.router)
app.include_router(payments.router)
app.include_router(blog.router)
app.include_router(course_materials.router)
app.include_router(admin.router)
app.include_router(platform.router)


@app.on_event("startup")
async def validate_security_config() -> None:
    """Проверка критических настроек безопасности при старте."""
    if _is_production:
        if not settings.JWT_SECRET or settings.JWT_SECRET == "change_me_in_production":
            raise RuntimeError(
                "JWT_SECRET is not configured! "
                "Set a strong random secret (at least 32 characters) via environment variable."
            )
        if len(settings.JWT_SECRET) < 32:
            raise RuntimeError(
                f"JWT_SECRET is too short ({len(settings.JWT_SECRET)} chars). "
                "Use at least 32 characters for production."
            )
    elif not settings.JWT_SECRET:
        logger.warning(
            "JWT_SECRET is empty. This is acceptable for development, "
            "but MUST be set for production (ENV=production)."
        )


@app.on_event("startup")
async def seed_admin_user() -> None:
    """
    Dev-утилита: автосоздание администратора при старте.
    Важно: включать только через env (SEED_ADMIN=true).
    """
    if not settings.SEED_ADMIN:
        return

    email = (settings.SEED_ADMIN_EMAIL or "").strip().lower()
    password = settings.SEED_ADMIN_PASSWORD or ""

    if not email or not password:
        # Не падаем — просто не сидим админа, чтобы не блокировать запуск.
        print("⚠️ SEED_ADMIN включён, но не задан SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD. Пропускаем.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        password_hash = hash_password(password)

        if user is None:
            user = User(
                email=email,
                password_hash=password_hash,
                full_name="Administrator",
                provider="email",
                role="admin",
            )
            db.add(user)
            action = "created"
        else:
            # Гарантируем админскую роль, и при необходимости обновляем пароль.
            user.role = "admin"
            if settings.SEED_ADMIN_FORCE_PASSWORD or not user.password_hash:
                user.password_hash = password_hash

            # На всякий случай — если по каким-то причинам provider пустой
            if not user.provider:
                user.provider = "email"
            action = "updated"

        await db.commit()
        print(f"✅ SEED_ADMIN: {action} admin user: {email}")


@app.get("/")
async def root():
    """Корневой эндпоинт"""
    return {
        "message": "SAVAGE MOVIE API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Проверка здоровья API"""
    return {"status": "ok"}
