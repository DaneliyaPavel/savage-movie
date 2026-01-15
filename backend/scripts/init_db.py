"""
Скрипт для инициализации базы данных
"""
import asyncio
import asyncpg
from pathlib import Path
from app.config import settings


async def init_database():
    """Создает таблицы в базе данных"""
    # Подключаемся к БД
    conn = await asyncpg.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        database=settings.DB_NAME
    )
    
    try:
        # Читаем SQL файл
        sql_file = Path(__file__).parent / "init_db.sql"
        with open(sql_file, "r", encoding="utf-8") as f:
            sql = f.read()
        
        # Выполняем SQL
        await conn.execute(sql)
        print("База данных успешно инициализирована!")
        
    except Exception as e:
        print(f"Ошибка инициализации БД: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(init_database())
