/**
 * Счётчики антиспама в памяти процесса: лимит заявок по IP и окно дедупликации.
 *
 * Приложение работает одним контейнером, а потеря состояния при рестарте
 * здесь не страшна — это защита от шума. Но память под них должна быть
 * ограничена жёстко: ключ приходит от внешнего мира, и без потолка поток
 * запросов с разных адресов растил бы Map без предела, а чистка всей Map на
 * каждый запрос тормозила бы весь процесс.
 *
 * Политика при переполнении — вытеснять самую давнюю запись (Map помнит порядок
 * вставки, а запись при каждом обращении переставляется в конец). Отказывать
 * новым ключам нельзя: тогда заполнить Map мусорными адресами значило бы
 * закрыть форму для настоящих клиентов. Вытеснение же сбрасывает счётчик
 * только у самых давних адресов, а чтобы выбить конкретный адрес, нужно
 * прислать запросы со всех maxKeys других, то есть иметь столько же адресов,
 * сколько и так даёт обход лимита через ботнет.
 *
 * Перед распределённым деплоем заменить на Redis.
 */

/** Просроченные записи чистим не чаще раза в минуту, а не на каждый запрос */
export const PRUNE_INTERVAL_MS = 60 * 1000

/** Возвращает true, если с прошлой чистки прошёл интервал; момент чистки запоминает сама */
function createPruneGate(intervalMs: number): (now: number) => boolean {
  let lastPrunedAt = Number.NEGATIVE_INFINITY
  return now => {
    if (now - lastPrunedAt < intervalMs) return false
    lastPrunedAt = now
    return true
  }
}

/** Кладёт запись в конец порядка вытеснения и не даёт Map перерасти maxKeys */
function putMostRecent<V>(map: Map<string, V>, key: string, value: V, maxKeys: number): void {
  map.delete(key)
  while (map.size >= maxKeys) {
    const oldest = map.keys().next()
    if (oldest.done) break
    map.delete(oldest.value)
  }
  map.set(key, value)
}

interface MemoryLimitOptions {
  /** Сколько ключей держим в памяти не больше */
  maxKeys: number
  /** Как часто чистить просроченные записи; по умолчанию раз в минуту */
  pruneIntervalMs?: number
}

export interface RateLimiterOptions extends MemoryLimitOptions {
  /** Сколько обращений пускаем за окно */
  limit: number
  windowMs: number
}

export interface RateLimiter {
  /**
   * true — ключ исчерпал лимит, запрос надо отклонить. Если лимит ещё не
   * исчерпан, обращение записывается (проверка и учёт — одно действие).
   * Отклонённые запросы счётчик не растят, поэтому долбёжка не продлевает блок.
   */
  isLimited(key: string, now: number): boolean
  /** Сколько ключей сейчас в памяти (для тестов и мониторинга) */
  size(): number
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const { limit, windowMs } = options
  const maxKeys = Math.max(1, options.maxKeys)
  const shouldPrune = createPruneGate(options.pruneIntervalMs ?? PRUNE_INTERVAL_MS)
  const hits = new Map<string, number[]>()

  function pruneExpired(now: number): void {
    for (const [key, timestamps] of hits) {
      const fresh = timestamps.filter(time => now - time < windowMs)
      if (fresh.length === 0) hits.delete(key)
      else hits.set(key, fresh)
    }
  }

  return {
    isLimited(key, now) {
      if (shouldPrune(now)) pruneExpired(now)

      const fresh = (hits.get(key) ?? []).filter(time => now - time < windowMs)
      if (fresh.length >= limit) {
        putMostRecent(hits, key, fresh, maxKeys)
        return true
      }

      fresh.push(now)
      putMostRecent(hits, key, fresh, maxKeys)
      return false
    },
    size: () => hits.size,
  }
}

export interface RecentSetOptions extends MemoryLimitOptions {
  windowMs: number
}

export interface RecentSet {
  /** Видели ли ключ в последнее окно */
  has(key: string, now: number): boolean
  add(key: string, now: number): void
  size(): number
}

export function createRecentSet(options: RecentSetOptions): RecentSet {
  const { windowMs } = options
  const maxKeys = Math.max(1, options.maxKeys)
  const shouldPrune = createPruneGate(options.pruneIntervalMs ?? PRUNE_INTERVAL_MS)
  const seenAt = new Map<string, number>()

  function pruneExpired(now: number): void {
    for (const [key, time] of seenAt) {
      if (now - time >= windowMs) seenAt.delete(key)
    }
  }

  return {
    has(key, now) {
      const time = seenAt.get(key)
      return time !== undefined && now - time < windowMs
    },
    add(key, now) {
      if (shouldPrune(now)) pruneExpired(now)
      putMostRecent(seenAt, key, now, maxKeys)
    },
    size: () => seenAt.size,
  }
}
