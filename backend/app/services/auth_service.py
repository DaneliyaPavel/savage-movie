"""
Сервис аутентификации: JWT токены
"""
from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
from jose import JWTError, jwt
from app.config import settings
from app.schemas.user import TokenData


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Создает JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Создает JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[TokenData]:
    """Проверяет и декодирует JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        
        # Проверяем тип токена
        if payload.get("type") != token_type:
            return None
        
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        
        if user_id is None:
            return None
        
        return TokenData(user_id=UUID(user_id), email=email)
    except JWTError:
        return None
