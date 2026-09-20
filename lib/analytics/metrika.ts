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
 *
 * Группа commercial_* / estimate_* — воронка коммерческого лендинга
 *   /reklamny-rolik. Все шаги до отправки заявки НЕ являются конверсией:
 *   единственная конверсия воронки — production_lead_success.
 *
 * Группа service_* — воронка раздела направлений /services. Отдельного
 *   события отправки у неё нет сознательно: бриф направлений — та же форма,
 *   что на лендинге, и она уже шлёт estimate_form_start и единственную
 *   конверсию production_lead_success. Второе событие отправки удвоило бы
 *   лиды в отчётах.
 */
export type MetrikaGoal =
  | 'production_lead_success'
  | 'newsletter_subscription_success'
  // Просмотр коммерческого лендинга
  | 'commercial_landing_view'
  // Клик по CTA сметы; параметр location: hero | price | middle | final | sticky | project_detail
  | 'estimate_cta_click'
  // Открытие коммерческого кейса; параметр case_slug
  | 'commercial_case_open'
  // Воспроизведение видео на лендинге
  | 'commercial_video_start'
  | 'commercial_video_50'
  | 'commercial_video_complete'
  // Воронка формы предварительной сметы
  | 'estimate_form_start'
  | 'estimate_project_type'
  | 'estimate_budget_select'
  | 'estimate_step1_complete'
  | 'estimate_brief_attach'
  // Страница клиентов /clients. Ни одно из этих событий не конверсия:
  // конверсия по-прежнему только production_lead_success.
  // Параметр client — имя бренда, project_slug — открытый проект,
  // source — блок страницы: wall | collaboration | capability
  | 'clients_project_click'
  | 'clients_collaboration_click'
  // Просмотр раздела направлений
  | 'service_page_view'
  // Направление доскроллено до экрана; параметр service — ServiceDirectionId
  | 'service_direction_view'
  // Клик по CTA направления; параметры service и destination (landing | brief)
  | 'service_direction_click'
  // Открыта работа-доказательство из сцены; параметры service и case_slug
  | 'service_case_open'
  // Человек увидел ориентир бюджета направления; параметр service
  | 'service_price_view'
  // Бриф открыт с предвыбранным направлением; параметр service
  | 'service_brief_open'
  // Вторичные действия
  | 'booking_click'
  | 'telegram_click'
  | 'email_click'

/** Параметры визита, которые Метрика принимает третьим аргументом reachGoal */
export type MetrikaGoalParams = Record<string, string | number | boolean | null>

declare global {
  interface Window {
    ym?: (counterId: number, action: string, ...args: unknown[]) => void
  }
}

/**
 * Отправляет цель в Метрику. Молча выходит, если счётчик не загрузился.
 */
export function trackMetrikaGoal(goal: MetrikaGoal, params?: MetrikaGoalParams): void {
  if (typeof window === 'undefined' || typeof window.ym !== 'function') return

  try {
    if (params) {
      window.ym(METRIKA_ID, 'reachGoal', goal, params)
    } else {
      window.ym(METRIKA_ID, 'reachGoal', goal)
    }
  } catch (error) {
    logger.error('Не удалось отправить цель в Метрику', error, { goal })
  }
}

/**
 * ClientID Метрики — нужен, чтобы связать заявку с визитом в отчётах.
 * Метрика отдаёт его только через колбэк и только после инициализации счётчика,
 * поэтому результат может быть null (блокировщик, отказ mc.yandex.ru).
 */
export function getMetrikaClientId(timeoutMs = 1500): Promise<string | null> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || typeof window.ym !== 'function') {
      resolve(null)
      return
    }

    let settled = false
    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    const timer = setTimeout(() => finish(null), timeoutMs)

    try {
      window.ym(METRIKA_ID, 'getClientID', (clientId: unknown) => {
        clearTimeout(timer)
        finish(typeof clientId === 'string' && clientId ? clientId : null)
      })
    } catch (error) {
      clearTimeout(timer)
      logger.error('Не удалось получить ClientID Метрики', error)
      finish(null)
    }
  })
}
