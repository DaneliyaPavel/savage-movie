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
        password_bytes = password_bytes[:72]
    
    # Используем прямой bcrypt вместо passlib для избежания проблем с версиями
    try:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')
    except Exception:
        # Fallback на passlib если прямой bcrypt не работает
        return pwd_context.hash(password_bytes.decode('utf-8'))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет пароль"""
    # Сначала пробуем прямой bcrypt (приоритет, так как hash_password теперь использует его)
    try:
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            password_bytes = password_bytes[:72]
        return bcrypt.checkpw(password_bytes, hashed_password.encode('utf-8'))
    except:
        # Fallback на passlib для старых хешей
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except:
            return False
