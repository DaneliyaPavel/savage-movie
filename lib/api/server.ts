/**
 * Server-side API клиент для Next.js
 * Используется в Server Components и API routes
 * 
 * В Docker используем имя сервиса 'backend', на хосте - localhost
 */
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiError {
  detail: string
}

/**
 * Получает токен из cookies (для server-side)
 */
function getTokenFromCookies(cookies: any): string | null {
  return cookies.get('access_token')?.value || null
}

/**
 * Базовая функция для запросов к API (server-side)
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  cookies?: any
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const token = cookies ? getTokenFromCookies(cookies) : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`,
    }))
    throw new Error(error.detail || 'Ошибка запроса к API')
  }

  return response.json()
}

/**
 * GET запрос (server-side)
 */
export async function apiGet<T>(endpoint: string, cookies?: any): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' }, cookies)
}

/**
 * POST запрос (server-side)
 */
export async function apiPost<T>(
  endpoint: string,
  data?: unknown,
  cookies?: any
): Promise<T> {
  return apiRequest<T>(
    endpoint,
    {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    },
    cookies
  )
}
