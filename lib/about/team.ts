/**
 * Команда из CMS (настройка about_team). Фото и подписи — только те, что
 * владелец загрузил в админке: страница ничего не добавляет от себя.
 */
import type { JsonValue } from '@/lib/api/settings'

export interface PhotoCrop {
  x: number
  y: number
  zoom: number
}

export interface TeamMember {
  id: string
  name: string
  position: string
  photoUrl: string | null
  crop: PhotoCrop
}

export const DEFAULT_CROP: PhotoCrop = { x: 50, y: 50, zoom: 1 }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

function normalizeCrop(raw: unknown): PhotoCrop {
  if (!isRecord(raw)) return DEFAULT_CROP
  const { x, y, zoom } = raw
  if (typeof x !== 'number' || typeof y !== 'number' || typeof zoom !== 'number') {
    return DEFAULT_CROP
  }
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100), zoom: clamp(zoom, 1, 2) }
}

/** Адрес фото: абсолютный и корневой отдаём как есть, голый путь привязываем к корню */
export function normalizePhotoUrl(url: string | null | undefined): string | null {
  const value = url?.trim()
  if (!value) return null
  return value.startsWith('http') || value.startsWith('/') ? value : `/${value}`
}

export function normalizeTeam(raw: JsonValue | undefined): TeamMember[] {
  if (!Array.isArray(raw)) return []
  const members: TeamMember[] = []

  raw.forEach((item, index) => {
    if (!isRecord(item)) return
    const name = typeof item.name === 'string' ? item.name.trim() : ''
    const position = typeof item.position === 'string' ? item.position.trim() : ''
    const photoUrl = normalizePhotoUrl(typeof item.photo_url === 'string' ? item.photo_url : null)
    // Без имени и фото карточка не имеет смысла: должность одна не человек
    if (!name && !photoUrl) return
    const id = typeof item.id === 'string' && item.id.trim() ? item.id : `member-${index}`
    members.push({ id, name, position, photoUrl, crop: normalizeCrop(item.photo_crop) })
  })

  return members
}
