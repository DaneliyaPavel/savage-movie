/**
 * Мерж контента лендинга с дефолтами.
 *
 * Вынесен отдельно от server.ts, потому что нужен обеим сторонам: сервер
 * собирает им страницу, редактор в админке — начальное состояние формы.
 * Обе стороны обязаны одинаково понимать частичную запись в настройках,
 * иначе админ правит одно, а на странице видит другое.
 */

type Plain = Record<string, unknown>

function isPlainObject(value: unknown): value is Plain {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Мерж «по форме дефолта»: ключи, которых нет в дефолте, отбрасываются,
 * значение принимается только если его тип совпадает с эталонным.
 * Массивы заменяются целиком — списки блоков редактируются как единое целое.
 *
 * Такая строгость нужна, чтобы устаревшая или повреждённая запись в CMS
 * не могла уронить рендер коммерческой страницы.
 */
export function mergeCommercialLandingContent<T>(defaults: T, override: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(override)) return defaults

  const result: Plain = { ...(defaults as Plain) }

  for (const [key, defaultValue] of Object.entries(defaults as Plain)) {
    if (!(key in override)) continue
    const value = override[key]

    if (isPlainObject(defaultValue)) {
      result[key] = mergeCommercialLandingContent(defaultValue, value)
      continue
    }

    if (Array.isArray(defaultValue)) {
      if (Array.isArray(value)) result[key] = value
      continue
    }

    // Nullable-поля (Bunny ID видео, постеры, og:image) типизированы как
    // `string | null`, и в дефолтах это всегда null. typeof null === 'object',
    // поэтому старая проверка `typeof value === typeof defaultValue` не
    // пропускала обычную строку — сохранённый videoPlaybackId молча
    // откатывался на null при каждом чтении, хотя в базе лежал верно.
    // Раз default сам null, для override годится любой примитив или null —
    // объекты и массивы сюда не долетают, у них typeof value === 'object'.
    if (defaultValue === null) {
      if (value === null || typeof value !== 'object') {
        result[key] = value
      }
      continue
    }

    if (typeof value === typeof defaultValue) {
      result[key] = value
    }
  }

  return result as T
}
