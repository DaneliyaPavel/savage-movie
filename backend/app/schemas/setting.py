"""
Pydantic схемы для настроек
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class SettingBase(BaseModel):
    key: str
    value: Optional[Any] = None


class SettingCreate(SettingBase):
    pass


class SettingUpdate(BaseModel):
    value: Optional[Any] = None


class Setting(SettingBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SettingsResponse(BaseModel):
    """Ответ со всеми настройками в виде словаря"""
    settings: Dict[str, Any]


class SettingsUpdateRequest(BaseModel):
    """Запрос на обновление нескольких настроек"""
    settings: Dict[str, Any]
