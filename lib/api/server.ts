/**
 * Server-side API клиент для Next.js
 * Используется в Server Components и API routes
 *
 * В Docker используем имя сервиса 'backend', на хосте - localhost
 */
import { baseApiRequest, type ApiRequestOptions } from './base'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'

const API_URL = serverEnv.API_URL || publicEnv.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export type { ApiError } from './base'

/**
 * Сборка превью на Vercel идёт без живого backend: API_URL там не задан, и
 * предрендер /clients падал на ECONNREFUSED, из-за чего превью не выкатывалось.
 *
 * Условие намеренно узкое: только фаза сборки и только окружение preview
 * (VERCEL_ENV выставляет сам Vercel). Docker-сборка образа на VDS и
 * production-окружение Vercel его не выполняют, поэтому там отказ backend
 * по-прежнему роняет сборку громко, а не запекает пустые страницы в деплой.
 */
function isPreviewBuildWithoutBackend(): boolean {
  return process.env.VERCEL_ENV === 'preview' && process.env.NEXT_PHASE === 'phase-production-build'
}

/**
 * Получает токен из cookies (для server-side)
 */
function getTokenFromCookies(cookies: {
  get: (name: string) => { value: string } | undefined
}): string | null {
  return cookies.get('access_token')?.value || null
}

/**
 * Базовая функция для запросов к API (server-side)
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<T> {
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${baseUrl}${normalizedEndpoint}`

  const token = cookies ? getTokenFromCookies(cookies) : null
  const requestOptions: RequestInit = { ...options }

  if (token && !requestOptions.cache) {
    // Отключаем кеш для запросов с авторизацией, чтобы не ловить устаревшие ответы.
    requestOptions.cache = 'no-store'
  }

  try {
    return await baseApiRequest<T>(url, {
      ...requestOptions,
      token,
    })
  } catch (error) {
    if (!isPreviewBuildWithoutBackend()) throw error
    // Страницы собираются с пустыми данными; ISR подтянет настоящие, когда backend доступен
    console.warn(`[preview build] backend недоступен, ${normalizedEndpoint} собран пустым`)
    return [] as T
  }
}

/**
 * GET запрос (server-side)
 */
export async function apiGet<T>(
  endpoint: string,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' }, cookies)
}

/**
 * POST запрос (server-side)
 */
export async function apiPost<T>(
  endpoint: string,
  data?: unknown,
  cookies?: { get: (name: string) => { value: string } | undefined }
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'POST',
      headers: data ? { 'Content-Type': 'application/json' } : undefined,
      body: data ? JSON.stringify(data) : undefined,
    },
    cookies
  )
}
