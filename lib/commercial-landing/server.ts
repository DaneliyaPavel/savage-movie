/**
 * Загрузка контента коммерческого лендинга на сервере.
 *
 * Источник — ключ commercial_landing в настройках сайта. Запись частичная:
 * редактор в админке сохраняет только то, что реально менял, а всё остальное
 * добирается из дефолтов (см. merge.ts).
 */
import {
  COMMERCIAL_LANDING_SETTINGS_KEY,
  DEFAULT_COMMERCIAL_LANDING,
  type CommercialLandingContent,
} from './content'
import { mergeCommercialLandingContent } from './merge'
import { logger } from '@/lib/utils/logger'

/**
 * Отдаёт контент лендинга. Любая ошибка API — не повод отдавать 500:
 * страница коммерческая, дефолты полностью самодостаточны.
 */
export async function getCommercialLandingContent(): Promise<CommercialLandingContent> {
  try {
    const { apiGet } = await import('@/lib/api/server')
    const response = await apiGet<{ settings?: Record<string, unknown> }>('/api/settings')
    const stored = response?.settings?.[COMMERCIAL_LANDING_SETTINGS_KEY]

    if (!stored) return DEFAULT_COMMERCIAL_LANDING

    // Настройки хранят произвольный JSON, но иногда значение кладут строкой
    const parsed: unknown = typeof stored === 'string' ? JSON.parse(stored) : stored

    return mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, parsed)
  } catch (error) {
    logger.error('Не удалось загрузить контент коммерческого лендинга', error, {
      key: COMMERCIAL_LANDING_SETTINGS_KEY,
    })
    return DEFAULT_COMMERCIAL_LANDING
  }
}
