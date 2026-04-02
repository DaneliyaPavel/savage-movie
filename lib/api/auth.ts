/**
 * API функции для аутентификации
 */
import { apiGet, apiPost } from './client'
import { setAccessToken } from './token-store'

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  provider: string
  role: string
  created_at: string
  updated_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name?: string
}

/**
 * Сохраняет токены: access_token в памяти (для API calls),
 * оба токена в HttpOnly cookies через /api/auth/session (для SSR).
 * localStorage больше НЕ используется — защита от XSS.
 */
async function saveTokens(tokens: TokenResponse): Promise<void> {
  setAccessToken(tokens.access_token)

  // Синхронизируем в HttpOnly cookies для SSR
  await syncAuthCookies(tokens)
}

/**
 * Синхронизирует токены с HttpOnly cookies для server-side доступа
 */
export async function syncAuthCookies(tokens: TokenResponse): Promise<void> {
  if (typeof window === 'undefined') return

  if (!tokens.access_token || !tokens.refresh_token) return

  try {
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      }),
    })
  } catch {
    // Если не удалось синхронизировать cookies — не критично для текущей сессии.
  }
}

/**
 * Очищает HttpOnly cookies для server-side доступа
 */
async function clearAuthCookies(): Promise<void> {
  if (typeof window === 'undefined') return

  try {
    await fetch('/api/auth/session', { method: 'DELETE' })
  } catch {
    // Не блокируем logout, даже если cookies не очистились.
  }
}

/**
 * Удаляет токены из памяти, cookies и localStorage (миграция)
 */
export function clearTokens() {
  setAccessToken(null)

  if (typeof window !== 'undefined') {
    // Очистка legacy localStorage (для пользователей, обновляющихся с прошлой версии)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

// Re-export для обратной совместимости
export { getAccessToken } from './token-store'

/**
 * Регистрация пользователя
 */
export async function register(data: RegisterData): Promise<TokenResponse> {
  const tokens = await apiPost<TokenResponse>('/api/auth/register', data)
  await saveTokens(tokens)
  return tokens
}

/**
 * Вход пользователя
 */
export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  const tokens = await apiPost<TokenResponse>('/api/auth/login', credentials)
  await saveTokens(tokens)
  return tokens
}

/**
 * Получение информации о текущем пользователе (client-side)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await apiGet<User>('/api/auth/me')
  } catch {
    return null
  }
}

/**
 * Получение информации о текущем пользователе (server-side)
 */
export async function getCurrentUserServer(cookies?: {
  get: (name: string) => { value: string } | undefined
}): Promise<User | null> {
  try {
    const { apiGet: apiGetServer } = await import('./server')
    return await apiGetServer<User>('/api/auth/me', cookies)
  } catch {
    return null
  }
}

/**
 * Обновление токена через серверный proxy (refresh_token хранится в HttpOnly cookie)
 */
export async function refreshToken(): Promise<TokenResponse> {
  // Refresh token хранится только в HttpOnly cookie — отправляем запрос через
  // Next.js API route, который имеет доступ к cookie.
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error('Не удалось обновить токен')
  }

  const tokens: TokenResponse = await res.json()
  await saveTokens(tokens)
  return tokens
}

/**
 * Выход пользователя
 */
export async function logout(): Promise<void> {
  try {
    await apiPost('/api/auth/logout')
    await clearAuthCookies()
  } finally {
    clearTokens()
  }
}

/**
 * Получение URL для OAuth Google
 */
export async function getGoogleOAuthUrl(): Promise<string> {
  const response = await apiGet<{ auth_url: string }>('/api/auth/oauth/google')
  return response.auth_url
}

/**
 * Получение URL для OAuth Yandex
 */
export async function getYandexOAuthUrl(): Promise<string> {
  const response = await apiGet<{ auth_url: string }>('/api/auth/oauth/yandex')
  return response.auth_url
}
