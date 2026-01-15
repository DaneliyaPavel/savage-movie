/**
 * Базовый клиент для работы с API
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiError {
  detail: string
}

/**
 * Базовая функция для запросов к API
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token') 
    : null

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
 * GET запрос
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' })
}

/**
 * POST запрос
 */
export async function apiPost<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT запрос
 */
export async function apiPut<T>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE запрос
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' })
}
