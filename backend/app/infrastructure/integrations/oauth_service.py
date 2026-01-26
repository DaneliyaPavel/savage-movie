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
                return {
                    "email": data.get("email"),
                    "full_name": data.get("name"),
                    "avatar_url": data.get("picture"),
                    "provider_id": data.get("id"),
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
                return {
                    "email": data.get("default_email") or data.get("emails", [None])[0],
                    "full_name": f"{data.get('first_name', '')} {data.get('last_name', '')}".strip(),
                    "avatar_url": None,  # Yandex не предоставляет аватар в этом API
                    "provider_id": data.get("id"),
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
