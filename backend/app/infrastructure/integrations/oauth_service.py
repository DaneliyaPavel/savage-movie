"""
Сервис OAuth: Google и Yandex
"""
import httpx
from typing import Dict, Optional
from app.config import settings


async def get_google_user_info(access_token: str) -> Optional[Dict]:
    """Получает информацию о пользователе из Google"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code == 200:
                data = response.json()
                provider_id = data.get("id")
                return {
                    "email": data.get("email"),
                    # Google отдаёт verified_email (userinfo v2) или email_verified (OIDC);
                    # строго bool True: строки и прочее считаем неподтверждённым.
                    "email_verified": (
                        data.get("verified_email") is True or data.get("email_verified") is True
                    ),
                    "full_name": data.get("name"),
                    "avatar_url": data.get("picture"),
                    "provider_id": str(provider_id) if provider_id else None,
                }
    except Exception as e:
        print(f"Ошибка получения данных Google: {e}")
    return None


async def get_yandex_user_info(access_token: str) -> Optional[Dict]:
    """Получает информацию о пользователе из Yandex"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://login.yandex.ru/info",
                headers={"Authorization": f"OAuth {access_token}"}
            )
            if response.status_code == 200:
                data = response.json()
                default_email = data.get("default_email")
                emails = data.get("emails") or []
                provider_id = data.get("id")
                return {
                    "email": default_email or (emails[0] if emails else None),
                    # default_email Яндекс подтверждает сам; адрес из общего списка emails — нет
                    "email_verified": bool(default_email),
                    "full_name": f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(),
                    "avatar_url": None,  # Yandex не предоставляет аватар в этом API
                    "provider_id": str(provider_id) if provider_id else None,
                }
    except Exception as e:
        print(f"Ошибка получения данных Yandex: {e}")
    return None


async def exchange_google_code(code: str) -> Optional[str]:
    """Обменивает код авторизации Google на access token"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
    except Exception as e:
        print(f"Ошибка обмена кода Google: {e}")
    return None


async def exchange_yandex_code(code: str) -> Optional[str]:
    """Обменивает код авторизации Yandex на access token"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth.yandex.ru/token",
                data={
                    "code": code,
                    "client_id": settings.YANDEX_CLIENT_ID,
                    "client_secret": settings.YANDEX_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
    except Exception as e:
        print(f"Ошибка обмена кода Yandex: {e}")
    return None
