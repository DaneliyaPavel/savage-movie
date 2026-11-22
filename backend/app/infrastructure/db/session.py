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
    # Пул уже есть (QueuePool: 5 постоянных соединений + до 10 сверх, на процесс uvicorn).
    # pre_ping проверяет соединение перед выдачей: после рестарта Postgres или обрыва сети
    # первый запрос иначе получил бы 500 на «мёртвом» соединении из пула. recycle не даёт
    # держать соединение дольше получаса: так его не закроет сетевой экран или сам сервер.
    pool_pre_ping=True,
    pool_recycle=1800,
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
