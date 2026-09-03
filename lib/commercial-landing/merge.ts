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

    // Nullable-поля (видео, постеры, ссылки) в CMS законно приходят как null
    if (value === null || typeof value === typeof defaultValue) {
      result[key] = value
    }
  }

  return result as T
}
