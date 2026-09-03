/**
 * Атрибуция рекламного трафика для заявок с сайта.
 *
 * Задача: заявка, отправленная на пятой странице через двадцать минут после
 * клика по объявлению, должна принести те же yclid/utm_*, что были в URL при
 * первом заходе. Поэтому метки один раз снимаются с адресной строки и живут
 * в браузере до отправки формы, а не читаются из location в момент submit.
 *
 * Храним два среза:
 *   first — самый первый рекламный источник пользователя (localStorage,
 *           переживает закрытие вкладки: путь до сделки редко умещается в один визит);
 *   last  — источник текущего визита (sessionStorage: новый визит — новый last).
 *
 * Любое обращение к storage обёрнуто в try/catch: приватный режим и
 * запрет сторонних данных не должны ломать отправку заявки.
 */

/** Метки, которые Директ и рассылки дописывают в URL */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

type UtmKey = (typeof UTM_KEYS)[number]

export interface AttributionTouch {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  /** Идентификатор клика Яндекс.Директа */
  yclid: string | null
  /** Идентификатор клика Google Ads — приходит на том же лендинге из других кампаний */
  gclid: string | null
  /** Страница входа, на которой были сняты метки */
  landing_path: string
  /** Внешний реферер этого захода; пустая строка для прямых заходов */
  referrer: string
  /** ISO-время снятия меток */
  timestamp: string
}

export interface AttributionPayload {
  first: AttributionTouch | null
  last: AttributionTouch | null
}

const FIRST_TOUCH_KEY = 'sm_attr_first'
const LAST_TOUCH_KEY = 'sm_attr_last'

/** Значения меток длиннее этого обрезаем: в заявку не должен попадать мусор */
const MAX_VALUE_LENGTH = 300

function readStorage(storage: Storage | undefined, key: string): AttributionTouch | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as AttributionTouch
  } catch {
    return null
  }
}

function writeStorage(storage: Storage | undefined, key: string, touch: AttributionTouch): void {
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(touch))
  } catch {
    // Приватный режим или переполненное хранилище — атрибуция не критична
  }
}

function safeStorage(kind: 'local' | 'session'): Storage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return undefined
  }
}

function trim(value: string | null): string | null {
  if (!value) return null
  const cleaned = value.trim().slice(0, MAX_VALUE_LENGTH)
  return cleaned || null
}

/**
 * Снимает метки с текущего URL. Возвращает null, если рекламных меток нет —
 * органический переход не должен затирать ранее сохранённый источник.
 */
function readTouchFromLocation(): AttributionTouch | null {
  if (typeof window === 'undefined') return null

  const params = new URLSearchParams(window.location.search)
  const utm = {} as Record<UtmKey, string | null>
  let hasMarks = false

  for (const key of UTM_KEYS) {
    const value = trim(params.get(key))
    utm[key] = value
    if (value) hasMarks = true
  }

  const yclid = trim(params.get('yclid'))
  const gclid = trim(params.get('gclid'))
  if (yclid || gclid) hasMarks = true

  if (!hasMarks) return null

  return {
    ...utm,
    yclid,
    gclid,
    landing_path: window.location.pathname + window.location.search,
    referrer: typeof document !== 'undefined' ? document.referrer.slice(0, MAX_VALUE_LENGTH) : '',
    timestamp: new Date().toISOString(),
  }
}

/**
 * Фиксирует источник текущего захода.
 *
 * Вызывается на каждой странице лендинга при монтировании: если в URL есть
 * метки — обновляем last-touch и, если его ещё не было, first-touch.
 * Если меток нет — сохранённые значения остаются нетронутыми.
 */
export function captureAttribution(): AttributionPayload {
  const local = safeStorage('local')
  const session = safeStorage('session')

  const incoming = readTouchFromLocation()

  if (incoming) {
    writeStorage(session, LAST_TOUCH_KEY, incoming)
    if (!readStorage(local, FIRST_TOUCH_KEY)) {
      writeStorage(local, FIRST_TOUCH_KEY, incoming)
    }
  }

  return getAttribution()
}

/** Отдаёт сохранённую атрибуцию для приложения к заявке */
export function getAttribution(): AttributionPayload {
  return {
    first: readStorage(safeStorage('local'), FIRST_TOUCH_KEY),
    last: readStorage(safeStorage('session'), LAST_TOUCH_KEY),
  }
}

/**
 * Плоские поля для payload заявки.
 *
 * utm_* и yclid берём из last-touch — именно этот клик привёл к обращению
 * и именно по нему Директ сводит расход с заявкой. Первый источник уходит
 * отдельными полями first_utm_* и нужен для оценки длинных цепочек.
 */
export function buildAttributionFields(
  attribution: AttributionPayload = getAttribution()
): Record<string, string | null> {
  const { first, last } = attribution
  const current = last ?? first

  return {
    utm_source: current?.utm_source ?? null,
    utm_medium: current?.utm_medium ?? null,
    utm_campaign: current?.utm_campaign ?? null,
    utm_content: current?.utm_content ?? null,
    utm_term: current?.utm_term ?? null,
    yclid: current?.yclid ?? null,
    gclid: current?.gclid ?? null,
    first_utm_source: first?.utm_source ?? null,
    first_utm_medium: first?.utm_medium ?? null,
    first_utm_campaign: first?.utm_campaign ?? null,
    first_landing_path: first?.landing_path ?? null,
    first_referrer: first?.referrer ?? null,
    first_touch_at: first?.timestamp ?? null,
  }
}
