/**
 * API функции для настроек сайта
 */
import { apiGet, apiPut } from './client'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export interface Settings {
  [key: string]: JsonValue | undefined
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
export async function getSetting(key: string): Promise<JsonValue | null> {
  const response = await apiGet<{ key: string; value: JsonValue | null }>(
    `/api/settings/${key}`
  )
  return response.value
}

/**
 * Обновить настройки
 */
export async function updateSettings(settings: Settings): Promise<Settings> {
  const response = await apiPut<SettingsResponse>('/api/settings', { settings })
  return response.settings
}
