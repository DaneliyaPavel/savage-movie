"""
Конфигурация приложения
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "savage_movie"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    
    # JWT
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # OAuth Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/oauth/google/callback"
    
    # OAuth Yandex
    YANDEX_CLIENT_ID: str = ""
    YANDEX_CLIENT_SECRET: str = ""
    YANDEX_REDIRECT_URI: str = "http://localhost:8000/api/auth/oauth/yandex/callback"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    
    # Email
    RESEND_API_KEY: str = ""
    ADMIN_EMAIL: str = "savage.movie@yandex.ru"
    
    # Dev helpers (НЕ включать в production)
    # Если SEED_ADMIN=true, то при старте backend будет создан/обновлён админ-пользователь.
    SEED_ADMIN: bool = False
    SEED_ADMIN_EMAIL: str = ""
    SEED_ADMIN_PASSWORD: str = ""
    SEED_ADMIN_FORCE_PASSWORD: bool = False

    # Payments (YooKassa)
    YOOKASSA_SHOP_ID: str = ""
    YOOKASSA_SECRET_KEY: str = ""

    # App URL
    APP_URL: str = "http://localhost:3000"
    
    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def cors_origins_list(self) -> List[str]:
        origins = []
        for origin in self.CORS_ORIGINS.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned:
                origins.append(cleaned)
        return origins
    
    class Config:
        case_sensitive = True


settings = Settings()
