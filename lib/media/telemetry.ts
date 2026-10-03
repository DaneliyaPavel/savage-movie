/**
 * Лёгкая RUM-телеметрия медиа-слоя.
 *
 * Загрузчик (lib/media/boot) складывает события в window.__sm.events и шлёт
 * CustomEvent 'savage:media'. Для каждой поверхности он выпускает один
 * итоговый report с таймлайном: когда пришёл постер, когда ушёл запрос,
 * когда кадр декодирован, когда запаса буфера стало достаточно и когда
 * пользователь впервые увидел движущийся кадр (ttfm — главная метрика).
 *
 * Отправка — в уже подключённую Яндекс Метрику (параметры визита), без
 * нового бэкенда и без новых целей: единственная конверсия сайта остаётся
 * production_lead_success.
 */

export interface MediaReport {
  kind: 'visible' | 'failed' | 'off' | 'stall-check'
  name: string
  src?: 'mp4' | 'stream' | 'none'
  cls?: 'd' | 'm'
  ttfm?: number
  hero?: boolean
  posterAt?: number
  requestAt?: number
  decodedAt?: number
  safeAt?: number
  stalls?: number
  degrades?: number
  kicked?: boolean
  et?: string
}

export type BrowserFamily =
  | 'yandex'
  | 'edge'
  | 'samsung'
  | 'firefox'
  | 'chrome'
  | 'safari'
  | 'other'

export function browserFamily(ua: string): BrowserFamily {
  if (/YaBrowser/.test(ua)) return 'yandex'
  if (/Edg\//.test(ua)) return 'edge'
  if (/SamsungBrowser/.test(ua)) return 'samsung'
  if (/(Firefox|FxiOS)\//.test(ua)) return 'firefox'
  if (/(Chrome|Chromium|CriOS)\//.test(ua)) return 'chrome'
  if (/Safari\//.test(ua)) return 'safari'
  return 'other'
}

/** Корзины TTFM: числа в Метрике не агрегируются по значениям, корзины читаются сразу */
export function ttfmBucket(ms: number | undefined): string {
  if (ms === undefined || !Number.isFinite(ms)) return 'none'
  if (ms < 500) return 'lt500'
  if (ms < 1000) return 'lt1000'
  if (ms < 2000) return 'lt2000'
  if (ms < 4000) return 'lt4000'
  if (ms < 8000) return 'lt8000'
  return 'gte8000'
}

/**
 * Параметры визита для Метрики: media → имя поверхности → браузер/класс → src → исход.
 * Только листья-строки и небольшие числа; имя поверхности — фиксированный набор из кода.
 */
export function buildMetrikaParams(
  report: MediaReport,
  ua: string
): Record<string, unknown> | null {
  if (report.kind === 'stall-check') {
    // сигнал нужен только когда остановки были
    if (!report.stalls && !report.degrades) return null
    return {
      media_stall: {
        [report.name]: { [browserFamily(ua)]: `s${report.stalls ?? 0}d${report.degrades ?? 0}` },
      },
    }
  }
  const outcome = report.kind === 'visible' ? `visible:${ttfmBucket(report.ttfm)}` : report.kind
  return {
    media: {
      [report.name]: {
        [`${browserFamily(ua)}-${report.cls ?? 'd'}`]: {
          [report.src ?? 'none']: outcome,
        },
      },
    },
    ...(report.kind === 'visible' && report.ttfm !== undefined
      ? { media_ttfm_ms: { [report.name]: Math.round(report.ttfm) } }
      : {}),
  }
}
