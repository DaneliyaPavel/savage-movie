/**
 * Безопасная цель редиректа после входа.
 *
 * Браузер перед разбором URL выбрасывает из него табуляцию и переводы строк, поэтому
 * "/\t/evil.example" после этого превращается в "//evil.example" (чужой хост), хотя
 * простая проверка startsWith('/') && !startsWith('//') его пропускает.
 */

// Любые пробельные и управляющие символы (в т.ч. \t \n \r, U+0085, U+2028/2029, NBSP)
const FORBIDDEN_CHARS = /[\s\u0000-\u001f\u007f-\u009f]/

// Служебный origin: нужен только чтобы разобрать путь так же, как это сделает браузер
const PROBE_ORIGIN = 'http://x'

/**
 * Возвращает raw, только если это путь внутри текущего сайта, иначе fallback.
 * Строку отдаём как есть, без нормализации: браузер разберёт её тем же алгоритмом,
 * что и проверка ниже (нормализованный pathname вроде "//host" сам стал бы внешним).
 */
export function getSafeRedirect(raw: string | null | undefined, fallback: string): string {
  if (typeof raw !== 'string' || raw.length === 0) return fallback

  // Ровно один ведущий "/": "//host" и "/\host" браузер читает как чужой хост
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback
  // Обратный слэш в http(s)-URL равен "/", отсекаем целиком (как и раньше)
  if (raw.includes('\\')) return fallback
  if (FORBIDDEN_CHARS.test(raw)) return fallback

  try {
    const url = new URL(raw, PROBE_ORIGIN)
    return url.origin === PROBE_ORIGIN ? raw : fallback
  } catch {
    return fallback
  }
}
