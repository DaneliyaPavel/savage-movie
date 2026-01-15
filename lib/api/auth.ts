/**
 * API функции для аутентификации
 */
import { apiGet, apiPost } from './client'

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
 * Сохраняет токены в localStorage и cookies
 */
function saveTokens(tokens: TokenResponse) {
  if (typeof window !== 'undefined') {
    // Сохраняем в localStorage для клиентской части
    localStorage.setItem('access_token', tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    
    // Сохраняем в cookies для server-side доступа
    // Устанавливаем cookie с максимальным сроком действия (7 дней)
    const maxAge = 7 * 24 * 60 * 60 // 7 дней в секундах
    document.cookie = `access_token=${tokens.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`
    document.cookie = `refresh_token=${tokens.refresh_token}; path=/; max-age=${maxAge}; SameSite=Lax`
  }
}

/**
 * Удаляет токены из localStorage и cookies
 */
export function clearTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    
    // Удаляем cookies
    document.cookie = 'access_token=; path=/; max-age=0'
    document.cookie = 'refresh_token=; path=/; max-age=0'
  }
}

/**
 * Получает access token
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token')
  }
  return null
}

/**
 * Регистрация пользователя
 */
export async function register(data: RegisterData): Promise<TokenResponse> {
  const tokens = await apiPost<TokenResponse>('/api/auth/register', data)
  saveTokens(tokens)
  return tokens
}

/**
 * Вход пользователя
 */
export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  const tokens = await apiPost<TokenResponse>('/api/auth/login', credentials)
  saveTokens(tokens)
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
export async function getCurrentUserServer(cookies?: any): Promise<User | null> {
  try {
    const { apiGet: apiGetServer } = await import('./server')
    return await apiGetServer<User>('/api/auth/me', cookies)
  } catch {
    return null
  }
}

/**
 * Обновление токена
 */
export async function refreshToken(): Promise<TokenResponse> {
  const refreshToken = typeof window !== 'undefined'
    ? localStorage.getItem('refresh_token')
    : null

  if (!refreshToken) {
    throw new Error('Refresh token не найден')
  }

  const tokens = await apiPost<TokenResponse>('/api/auth/refresh', {
    refresh_token: refreshToken,
  })
  saveTokens(tokens)
  return tokens
}

/**
 * Выход пользователя
 */
export async function logout(): Promise<void> {
  try {
    await apiPost('/api/auth/logout')
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
