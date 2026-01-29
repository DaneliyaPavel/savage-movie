/**
 * Базовый клиент для работы с API (client-side)
 */
import { baseApiRequest, type ApiRequestOptions } from './base'
import { publicEnv } from '@/lib/env'

const API_URL = publicEnv.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export type { ApiError } from './base'

/**
 * Базовая функция для запросов к API (client-side)
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token') 
    : null

  return baseApiRequest<T>(url, {
    ...options,
    token,
  })
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
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
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
    headers: data ? { 'Content-Type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE запрос
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE', allowNoContent: true })
}

/**
 * POST FormData (например, загрузка файлов)
 */
export async function apiPostForm<T>(endpoint: string, formData: FormData): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: formData,
  })
}
