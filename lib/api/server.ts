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

  return baseApiRequest<T>(url, {
    ...requestOptions,
    token,
  })
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
