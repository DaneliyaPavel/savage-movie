/**
 * Счётчики для меню («Проекты 19», «Блог 12»).
 *
 * Меню открывается на каждой странице, а счётчики нужны только как подпись. Раньше
 * каждое открытие меню заново скачивало оба списка целиком (проекты ≈ 11 КБ, блог ≈ 62 КБ
 * по сети вместе с текстами статей). Теперь:
 *  - блог идёт без текстов (`include_content=false`);
 *  - ответ запоминается на несколько минут на уровне модуля, поэтому повторное открытие
 *    меню и переходы между страницами (клиентская навигация не перезагружает модуль)
 *    не шлют запросов;
 *  - два одновременных открытия делят один запрос.
 */
import { getBlogSummaries } from '@/lib/api/blog'
import { getProjects } from '@/features/projects/api'

export interface SiteCounts {
  projects: number | null
  blog: number | null
}

/** Счётчик — подпись, а не данные для решений: несколько минут устаревания не страшны */
export const SITE_COUNTS_TTL_MS = 5 * 60_000

let cached: { at: number; value: Promise<SiteCounts> } | null = null

async function loadSiteCounts(): Promise<SiteCounts> {
  const [projects, blog] = await Promise.allSettled([getProjects(), getBlogSummaries(true)])
  return {
    projects: projects.status === 'fulfilled' ? projects.value.length : null,
    blog: blog.status === 'fulfilled' ? blog.value.length : null,
  }
}

export function getSiteCounts(now: number = Date.now()): Promise<SiteCounts> {
  if (cached && now - cached.at < SITE_COUNTS_TTL_MS) return cached.value

  const value = loadSiteCounts()
  cached = { at: now, value }
  // Частичный сбой (одна из двух ручек) не запоминаем: следующее открытие повторит запрос
  void value.then(result => {
    if (cached?.value === value && (result.projects === null || result.blog === null)) {
      cached = null
    }
  })
  return value
}

/** Только для тестов */
export function resetSiteCountsCache(): void {
  cached = null
}
