"""
API роуты для аутентификации
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.users import SqlAlchemyUsersRepository
from app.interfaces.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.application.services.auth_service import create_access_token, create_refresh_token, verify_token
from app.infrastructure.integrations.oauth_service import (
    get_google_user_info,
    get_yandex_user_info,
    exchange_google_code,
    exchange_yandex_code,
)
from app.utils.security import hash_password, verify_password
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Получает текущего пользователя из JWT токена"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется аутентификация",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_data = verify_token(credentials.credentials)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    repo = SqlAlchemyUsersRepository(db)
    user = await repo.get_by_id(token_data.user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
        )
    
    return user


@router.post("/register", response_model=Token)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Регистрация нового пользователя"""
    # Проверяем, существует ли пользователь
    repo = SqlAlchemyUsersRepository(db)
    existing_user = await repo.get_by_email(user_data.email)
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует",
        )
    
    # Создаем нового пользователя
    hashed_password = hash_password(user_data.password)
    new_user = await repo.create(
        {
            "email": user_data.email,
            "password_hash": hashed_password,
            "full_name": user_data.full_name,
            "provider": user_data.provider,
        }
    )
    
    # Создаем токены
    access_token = create_access_token(
        data={"sub": str(new_user.id), "email": new_user.email}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(new_user.id), "email": new_user.email}
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Вход пользователя"""
    repo = SqlAlchemyUsersRepository(db)
    user = await repo.get_by_email(credentials.email)
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    
    # Создаем токены
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Получение информации о текущем пользователе"""
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Обновление access token"""
    token_data = verify_token(refresh_token, token_type="refresh")
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Недействительный refresh token",
        )
    
    repo = SqlAlchemyUsersRepository(db)
    user = await repo.get_by_id(token_data.user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
        )
    
    # Создаем новые токены
    new_access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    new_refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.get("/oauth/google")
async def google_oauth():
    """Редирект на Google OAuth"""
    from urllib.parse import urlencode
    
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/oauth/google/callback")
async def google_oauth_callback(
    code: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Callback от Google OAuth"""
    # Обмениваем код на access token
    access_token = await exchange_google_code(code)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось получить access token от Google",
        )
    
    # Получаем информацию о пользователе
    user_info = await get_google_user_info(access_token)
    if not user_info or not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось получить информацию о пользователе",
        )
    
    # Ищем или создаем пользователя
    repo = SqlAlchemyUsersRepository(db)
    user = await repo.get_by_email_or_provider(
        email=user_info["email"],
        provider="google",
        provider_id=user_info["provider_id"],
    )
    
    if not user:
        # Создаем нового пользователя
        user = await repo.create(
            {
                "email": user_info["email"],
                "full_name": user_info.get("full_name"),
                "avatar_url": user_info.get("avatar_url"),
                "provider": "google",
                "provider_id": user_info["provider_id"],
            }
        )
    else:
        # Обновляем информацию, если нужно
        update_data = {}
        if not user.avatar_url and user_info.get("avatar_url"):
            update_data["avatar_url"] = user_info["avatar_url"]
        if not user.full_name and user_info.get("full_name"):
            update_data["full_name"] = user_info["full_name"]
        if update_data:
            user = await repo.update(user, update_data)
    
    # Создаем токены
    jwt_access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    jwt_refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    # Редиректим на frontend с токенами
    redirect_url = f"{settings.APP_URL}/callback?access_token={jwt_access_token}&refresh_token={jwt_refresh_token}"
    return Response(
        status_code=status.HTTP_302_FOUND,
        headers={"Location": redirect_url}
    )


@router.get("/oauth/yandex")
async def yandex_oauth():
    """Редирект на Yandex OAuth"""
    from urllib.parse import urlencode
    
    params = {
        "response_type": "code",
        "client_id": settings.YANDEX_CLIENT_ID,
        "redirect_uri": settings.YANDEX_REDIRECT_URI,
    }
    
    auth_url = f"https://oauth.yandex.ru/authorize?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/oauth/yandex/callback")
async def yandex_oauth_callback(
    code: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Callback от Yandex OAuth"""
    # Обмениваем код на access token
    access_token = await exchange_yandex_code(code)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось получить access token от Yandex",
        )
    
    # Получаем информацию о пользователе
    user_info = await get_yandex_user_info(access_token)
    if not user_info or not user_info.get("email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось получить информацию о пользователе",
        )
    
    # Ищем или создаем пользователя
    repo = SqlAlchemyUsersRepository(db)
    user = await repo.get_by_email_or_provider(
        email=user_info["email"],
        provider="yandex",
        provider_id=user_info["provider_id"],
    )
    
    if not user:
        # Создаем нового пользователя
        user = await repo.create(
            {
                "email": user_info["email"],
                "full_name": user_info.get("full_name"),
                "avatar_url": user_info.get("avatar_url"),
                "provider": "yandex",
                "provider_id": user_info["provider_id"],
            }
        )
    else:
        # Обновляем информацию, если нужно
        update_data = {}
        if not user.full_name and user_info.get("full_name"):
            update_data["full_name"] = user_info["full_name"]
        if update_data:
            user = await repo.update(user, update_data)
    
    # Создаем токены
    jwt_access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    jwt_refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    # Редиректим на frontend с токенами
    redirect_url = f"{settings.APP_URL}/callback?access_token={jwt_access_token}&refresh_token={jwt_refresh_token}"
    return Response(
        status_code=status.HTTP_302_FOUND,
        headers={"Location": redirect_url}
    )


@router.post("/logout")
async def logout():
    """Выход пользователя (на клиенте удаляются токены)"""
    return {"message": "Успешный выход"}
