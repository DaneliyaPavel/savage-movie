/**
 * Цели Яндекс Метрики.
 *
 * Счётчик подключается один раз в components/analytics/yandex-metrika.tsx.
 * Скрипт может не загрузиться (блокировщик рекламы, оффлайн, отказ mc.yandex.ru),
 * поэтому вызов цели всегда защищён проверкой: аналитика не должна ломать
 * отправку заявки.
 */
import { logger } from '@/lib/utils/logger'

/** Тот же счётчик, что в components/analytics/yandex-metrika.tsx */
export const METRIKA_ID = 108213944

/**
 * Цели сайта.
 *
 * production_lead_success — подтверждённая коммерческая заявка Savage Movie:
 *   сервер принял её и доставил хотя бы в один канал получения лидов.
 *   Ставится только в формах обращения по услугам продакшна.
 *
 * newsletter_subscription_success — подписка на рассылку. Это не лид,
 *   пересекаться с production_lead_success не должна.
 */
export type MetrikaGoal = 'production_lead_success' | 'newsletter_subscription_success'

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void
  }
}

/**
 * Отправляет цель в Метрику. Молча выходит, если счётчик не загрузился.
 */
export function trackMetrikaGoal(goal: MetrikaGoal): void {
  if (typeof window === 'undefined' || typeof window.ym !== 'function') return

  try {
    window.ym(METRIKA_ID, 'reachGoal', goal)
  } catch (error) {
    logger.error('Не удалось отправить цель в Метрику', error, { goal })
  }
}
