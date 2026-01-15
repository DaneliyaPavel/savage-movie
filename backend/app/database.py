"""
Подключение к базе данных PostgreSQL
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Создаем async engine
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Установить True для отладки SQL запросов
    future=True,
)

# Создаем session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Базовый класс для моделей
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    Dependency для получения сессии БД
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
