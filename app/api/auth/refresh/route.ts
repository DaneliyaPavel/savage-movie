/**
 * Proxy для refresh token.
 * Refresh token хранится в HttpOnly cookie — клиент не может его прочитать.
 * Этот route читает cookie, отправляет запрос на backend и возвращает новые токены.
 */
import { NextRequest, NextResponse } from 'next/server'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.json(
      { detail: 'Refresh token не найден' },
      { status: 401 },
    )
  }

  const API_URL = serverEnv.API_URL || publicEnv.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

  const backendRes = await fetch(`${API_URL}/api/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!backendRes.ok) {
    return NextResponse.json(
      { detail: 'Не удалось обновить токен' },
      { status: backendRes.status },
    )
  }

  const tokens = await backendRes.json()

  // Обновляем HttpOnly cookies с новыми токенами
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const isHttps = appUrl.startsWith('https://')
  const cookieSecureEnv = process.env.COOKIE_SECURE
  const secureCookie =
    cookieSecureEnv === 'true'
      ? true
      : cookieSecureEnv === 'false'
        ? false
        : process.env.NODE_ENV === 'production' && isHttps

  const maxAge = 7 * 24 * 60 * 60
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: secureCookie,
    path: '/',
  }

  const response = NextResponse.json(tokens)
  response.cookies.set('access_token', tokens.access_token, { ...cookieOptions, maxAge })
  response.cookies.set('refresh_token', tokens.refresh_token, { ...cookieOptions, maxAge })
  return response
}
