/**
 * API функции для настроек сайта
 */
import { apiGet, apiPut } from './client'

export interface Settings {
  [key: string]: any
}

export interface SettingsResponse {
  settings: Settings
}

export interface SettingsUpdate {
  settings: Settings
}

/**
 * Получить все настройки
 */
export async function getSettings(): Promise<Settings> {
  const response = await apiGet<SettingsResponse>('/api/settings')
  return response.settings
}

/**
 * Получить конкретную настройку по ключу
 */
export async function getSetting(key: string): Promise<any> {
  const response = await apiGet<{ key: string; value: any }>(`/api/settings/${key}`)
  return response.value
}

/**
 * Обновить настройки
 */
export async function updateSettings(settings: Settings): Promise<Settings> {
  const response = await apiPut<SettingsResponse>('/api/settings', { settings })
  return response.settings
}
