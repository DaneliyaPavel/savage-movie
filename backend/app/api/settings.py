"""
API роуты для настроек сайта
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any

from app.database import get_db
from app.models.setting import Setting
from app.models.user import User
from app.schemas.setting import (
    Setting as SettingSchema,
    SettingsResponse,
    SettingsUpdateRequest,
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db)
):
    """Получить все настройки сайта"""
    result = await db.execute(select(Setting))
    settings_list = result.scalars().all()
    
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
    
    # Обновляем или создаем каждую настройку
    for key, value in settings_data.settings.items():
        result = await db.execute(select(Setting).where(Setting.key == key))
        setting = result.scalar_one_or_none()
        
        if setting:
            # Обновляем существующую настройку
            setting.value = value
        else:
            # Создаем новую настройку
            new_setting = Setting(key=key, value=value)
            db.add(new_setting)
    
    await db.commit()
    
    # Возвращаем все настройки
    result = await db.execute(select(Setting))
    settings_list = result.scalars().all()
    settings_dict = {setting.key: setting.value for setting in settings_list}
    
    return SettingsResponse(settings=settings_dict)


@router.get("/{key}")
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db)
):
    """Получить конкретную настройку по ключу"""
    result = await db.execute(select(Setting).where(Setting.key == key))
    setting = result.scalar_one_or_none()
    
    if not setting:
        return {"key": key, "value": None}
    
    return {"key": setting.key, "value": setting.value}
