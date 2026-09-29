/**
 * Шоурил студии для /services: тот же поток, что играет в hero главной.
 *
 * Приоритет у настройки из админки (`hero_video_playback_id`), фолбэк — env.
 * Логика совпадает с главной намеренно, но главная не трогается: это боевая
 * страница, а общий хелпер потребовал бы менять и её.
 */
import { publicEnv } from '@/lib/env'

export const SHOWREEL_POSTER = '/showreel-poster.jpg'

export async function getShowreelPlaybackId(): Promise<string> {
  const fallback = publicEnv.NEXT_PUBLIC_SHOWREEL_VIDEO_ID || ''
  try {
    const { apiGet } = await import('@/lib/api/server')
    const response = await apiGet<{ settings: Record<string, unknown> }>('/api/settings')
    const fromAdmin = response.settings?.hero_video_playback_id
    if (typeof fromAdmin === 'string' && fromAdmin.trim() !== '') return fromAdmin.trim()
  } catch {
    // Настройки недоступны — остаётся env; страница без шоурила падает на кадры работ
  }
  return fallback
}
