"""
Главный файл FastAPI приложения
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, projects, courses, enrollments, contact, sitemap, upload, clients, testimonials, settings as settings_api

app = FastAPI(
    title="SAVAGE MOVIE API",
    description="API для сайта видеографа и продюсера",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(courses.router)
app.include_router(enrollments.router)
app.include_router(contact.router)
app.include_router(sitemap.router)
app.include_router(upload.router)
app.include_router(clients.router)
app.include_router(testimonials.router)
app.include_router(settings_api.router)


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
