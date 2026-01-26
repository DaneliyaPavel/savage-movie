"""
API роуты для настроек сайта
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.session import get_db
from app.infrastructure.db.models.user import User
from app.infrastructure.db.repositories.settings import SqlAlchemySettingsRepository
from app.interfaces.schemas.setting import (
    Setting as SettingSchema,
    SettingsResponse,
    SettingsUpdateRequest,
)
from app.delivery.api.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db)
):
    """Получить все настройки сайта"""
    repo = SqlAlchemySettingsRepository(db)
    settings_list = await repo.list_settings()
    
    # Преобразуем в словарь
    settings_dict = {setting.key: setting.value for setting in settings_list}
    
    return SettingsResponse(settings=settings_dict)


@router.put("", response_model=SettingsResponse)
async def update_settings(
    settings_data: SettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить настройки сайта (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только администраторы могут обновлять настройки"
        )
    
    repo = SqlAlchemySettingsRepository(db)
    await repo.upsert_many(settings_data.settings)

    settings_list = await repo.list_settings()
    settings_dict = {setting.key: setting.value for setting in settings_list}
    
    return SettingsResponse(settings=settings_dict)


@router.get("/{key}")
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db)
):
    """Получить конкретную настройку по ключу"""
    repo = SqlAlchemySettingsRepository(db)
    setting = await repo.get_by_key(key)
    
    if not setting:
        return {"key": key, "value": None}
    
    return {"key": setting.key, "value": setting.value}
