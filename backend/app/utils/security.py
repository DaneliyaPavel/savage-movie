"""
Утилиты для безопасности: хеширование паролей
"""
from passlib.context import CryptContext
import bcrypt

# Создаем контекст с явной настройкой для совместимости
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__ident="2b", bcrypt__rounds=12)


def hash_password(password: str) -> str:
    """Хеширует пароль"""
    # Ограничиваем длину пароля для bcrypt (максимум 72 байта)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password = password[:72]
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет пароль"""
    # Поддерживаем как passlib формат, так и прямой bcrypt формат
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except:
        # Fallback на прямой bcrypt, если passlib не работает
        try:
            password_bytes = plain_password.encode('utf-8')
            if len(password_bytes) > 72:
                password_bytes = password_bytes[:72]
            return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
        except:
            return False
