"""
API роуты для аутентификации
"""
import hmac
import os
import secrets
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool
from typing import Awaitable, Callable, Dict, Optional

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
from app.rate_limit import limiter, login_throttle

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

_is_production = os.getenv("ENV", "").lower() == "production"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Устанавливает JWT токены как HttpOnly cookies в redirect response."""
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        secure=_is_production,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=_is_production,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/",
    )


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
@limiter.limit("3/minute")
async def register(request: Request, user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Регистрация нового пользователя"""
    # Проверяем, существует ли пользователь
    repo = SqlAlchemyUsersRepository(db)
    existing_user = await repo.get_by_email(user_data.email)
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует",
        )
    
    # Создаем нового пользователя. bcrypt (cost 12) считается ~0.3 с: уносим в поток,
    # иначе он блокирует event loop единственного воркера.
    hashed_password = await run_in_threadpool(hash_password, user_data.password)
    new_user = await repo.create(
        {
            "email": user_data.email,
            "password_hash": hashed_password,
            "full_name": user_data.full_name,
            # Публичная регистрация всегда email-аккаунт; provider от клиента не принимаем.
            "provider": "email",
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
@limiter.limit("5/minute")
async def login(request: Request, credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Вход пользователя"""
    # Лимит по email поверх лимита по IP: иначе распределённый перебор пароля одного аккаунта
    # ничем не ограничен. Работает одинаково для существующих и несуществующих email.
    retry_after = login_throttle.hit(credentials.email)
    if retry_after:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много неудачных попыток входа. Попробуйте позже.",
            headers={"Retry-After": str(retry_after)},
        )

    repo = SqlAlchemyUsersRepository(db)
    user = await repo.get_by_email(credentials.email)
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    
    # bcrypt в потоке: синхронный вызов блокировал бы event loop на ~0.3 с на каждый вход
    if not await run_in_threadpool(verify_password, credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )

    login_throttle.reset(credentials.email)
    
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
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    refresh_token: str,
    db: AsyncSession = Depends(get_db),
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


# --- OAuth ---------------------------------------------------------------------------------
# Защита от login CSRF: start-эндпоинт выдаёт случайный state, кладёт его в HttpOnly-cookie
# браузера и в URL провайдера; callback принимает вход только если state из URL совпал с
# cookie того же браузера. Чужую ссылку с кодом атакующего жертва в свой браузер не принесёт.
_OAUTH_STATE_TTL_SECONDS = 600
_OAUTH_PROVIDER_LABELS = {"google": "Google", "yandex": "Яндекс"}


class _OAuthAccountConflict(Exception):
    """Email уже занят аккаунтом, который нельзя молча привязать к этому провайдеру."""


def _cookie_secure() -> bool:
    # ENV на проде в контейнер не передаётся, поэтому ориентируемся ещё и на https в APP_URL
    return _is_production or settings.APP_URL.startswith("https://")


def _oauth_state_cookie(provider: str) -> str:
    return f"oauth_state_{provider}"


def _oauth_state_path(provider: str) -> str:
    # Cookie уходит только на эндпоинты этого провайдера, остальной /api её не видит
    return f"/api/auth/oauth/{provider}"


def _start_oauth(response: Response, provider: str) -> str:
    """Выдаёт state: cookie браузеру + значение для URL провайдера."""
    state = secrets.token_urlsafe(32)
    response.set_cookie(
        _oauth_state_cookie(provider),
        state,
        max_age=_OAUTH_STATE_TTL_SECONDS,
        httponly=True,
        secure=_cookie_secure(),
        samesite="lax",  # callback — переход верхнего уровня с домена провайдера, Lax его пропускает
        path=_oauth_state_path(provider),
    )
    # В ответе Set-Cookie с одноразовым значением: кэшировать нельзя
    response.headers["Cache-Control"] = "no-store"
    return state


def _clear_oauth_state(response: Response, provider: str) -> None:
    response.delete_cookie(
        _oauth_state_cookie(provider),
        path=_oauth_state_path(provider),
        secure=_cookie_secure(),
        httponly=True,
        samesite="lax",
    )


def _oauth_state_valid(request: Request, provider: str, state: Optional[str]) -> bool:
    cookie = request.cookies.get(_oauth_state_cookie(provider))
    if not cookie or not state:
        return False
    # compare_digest со str падает на не-ASCII, сравниваем байты
    return hmac.compare_digest(cookie.encode("utf-8"), state.encode("utf-8"))


def _oauth_failure(provider: str, status_code: int, detail: str) -> JSONResponse:
    """Ответ об ошибке callback. state одноразовый — cookie гасим при любом исходе."""
    response = JSONResponse(status_code=status_code, content={"detail": detail})
    response.headers["Cache-Control"] = "no-store"
    _clear_oauth_state(response, provider)
    return response


async def _resolve_oauth_user(repo: SqlAlchemyUsersRepository, provider: str, info: Dict) -> User:
    """
    Находит или создаёт пользователя по данным провайдера (email уже подтверждён провайдером).

    Сначала ищем по (provider, provider_id). Аккаунт с тем же email привязываем ТОЛЬКО если он
    ничей: без пароля и без привязки к другому провайдеру. Иначе тот, кто заранее зарегистрировал
    чужой email с паролем, после первого OAuth-входа жертвы остался бы владельцем аккаунта.
    Роль здесь никогда не меняется.
    """
    provider_id = info["provider_id"]
    user = await repo.get_by_provider(provider, provider_id)

    if user is None:
        existing = await repo.get_by_email(info["email"])
        if existing is None:
            return await repo.create(
                {
                    "email": info["email"],
                    "full_name": info.get("full_name"),
                    "avatar_url": info.get("avatar_url"),
                    "provider": provider,
                    "provider_id": provider_id,
                }
            )
        if existing.password_hash or existing.provider_id:
            raise _OAuthAccountConflict()
        user = await repo.update(existing, {"provider": provider, "provider_id": provider_id})

    # Дозаполняем профиль, только если поля пустые
    update_data = {}
    if not user.avatar_url and info.get("avatar_url"):
        update_data["avatar_url"] = info["avatar_url"]
    if not user.full_name and info.get("full_name"):
        update_data["full_name"] = info["full_name"]
    if update_data:
        user = await repo.update(user, update_data)
    return user


async def _oauth_callback(
    *,
    provider: str,
    request: Request,
    db: AsyncSession,
    code: Optional[str],
    state: Optional[str],
    error: Optional[str],
    exchange_code: Callable[[str], Awaitable[Optional[str]]],
    get_user_info: Callable[[str], Awaitable[Optional[Dict]]],
):
    """Общая часть callback для Google и Яндекса, чтобы проверки не разъезжались."""
    label = _OAUTH_PROVIDER_LABELS[provider]

    # state проверяем раньше всего: до обмена кода и любых запросов к провайдеру
    if not _oauth_state_valid(request, provider, state):
        return _oauth_failure(
            provider,
            status.HTTP_400_BAD_REQUEST,
            "Сессия входа недействительна или истекла. Начните вход заново.",
        )

    if error or not code:
        return _oauth_failure(
            provider,
            status.HTTP_400_BAD_REQUEST,
            f"Вход через {label} не завершён. Попробуйте ещё раз.",
        )

    # Обмениваем код на access token
    access_token = await exchange_code(code)
    if not access_token:
        return _oauth_failure(
            provider,
            status.HTTP_400_BAD_REQUEST,
            f"Не удалось получить access token от {label}",
        )

    # Получаем информацию о пользователе
    user_info = await get_user_info(access_token)
    if not user_info or not user_info.get("email") or not user_info.get("provider_id"):
        return _oauth_failure(
            provider,
            status.HTTP_400_BAD_REQUEST,
            "Не удалось получить информацию о пользователе",
        )

    # Неподтверждённый email нельзя ни привязывать к чужому аккаунту, ни занимать новым
    if not user_info.get("email_verified"):
        return _oauth_failure(
            provider,
            status.HTTP_400_BAD_REQUEST,
            f"{label} не подтвердил email этого аккаунта. Подтвердите email и повторите вход.",
        )

    repo = SqlAlchemyUsersRepository(db)
    try:
        user = await _resolve_oauth_user(repo, provider, user_info)
    except _OAuthAccountConflict:
        return _oauth_failure(
            provider,
            status.HTTP_409_CONFLICT,
            "Аккаунт с этим email уже существует. Войдите по email и паролю.",
        )

    # Создаем токены
    jwt_access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    jwt_refresh_token = create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )

    # Устанавливаем токены как HttpOnly cookies (не в URL)
    response = RedirectResponse(
        url=f"{settings.APP_URL}/callback?provider={provider}",
        status_code=status.HTTP_302_FOUND,
    )
    response.headers["Cache-Control"] = "no-store"
    _clear_oauth_state(response, provider)
    _set_auth_cookies(response, jwt_access_token, jwt_refresh_token)
    return response


@router.get("/oauth/google")
async def google_oauth(response: Response):
    """Редирект на Google OAuth"""
    state = _start_oauth(response, "google")
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/oauth/google/callback")
async def google_oauth_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Callback от Google OAuth"""
    return await _oauth_callback(
        provider="google",
        request=request,
        db=db,
        code=code,
        state=state,
        error=error,
        exchange_code=exchange_google_code,
        get_user_info=get_google_user_info,
    )


@router.get("/oauth/yandex")
async def yandex_oauth(response: Response):
    """Редирект на Yandex OAuth"""
    state = _start_oauth(response, "yandex")
    params = {
        "response_type": "code",
        "client_id": settings.YANDEX_CLIENT_ID,
        "redirect_uri": settings.YANDEX_REDIRECT_URI,
        "state": state,
    }
    
    auth_url = f"https://oauth.yandex.ru/authorize?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/oauth/yandex/callback")
async def yandex_oauth_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Callback от Yandex OAuth"""
    return await _oauth_callback(
        provider="yandex",
        request=request,
        db=db,
        code=code,
        state=state,
        error=error,
        exchange_code=exchange_yandex_code,
        get_user_info=get_yandex_user_info,
    )


@router.post("/logout")
async def logout():
    """Выход пользователя (на клиенте удаляются токены)"""
    return {"message": "Успешный выход"}
