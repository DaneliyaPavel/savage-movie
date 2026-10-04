import { NextRequest, NextResponse } from 'next/server'

const maxAge = 7 * 24 * 60 * 60

const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
const isHttps = appUrl.startsWith('https://')
const cookieSecureEnv = process.env.COOKIE_SECURE
const secureCookie =
  cookieSecureEnv === 'true'
    ? true
    : cookieSecureEnv === 'false'
      ? false
      : process.env.NODE_ENV === 'production' && isHttps

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: secureCookie,
  path: '/',
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value ?? null
  return NextResponse.json({ access_token: accessToken })
}

/**
 * CSRF: чужая страница не должна подменять сессию в браузере жертвы
 * (text/plain-форма с телом-JSON иначе ставила бы httpOnly-куки злоумышленника).
 *
 * За nginx Next видит Host без порта ($host), а nextUrl за прокси может отдавать внутренний
 * адрес контейнера, поэтому сверяем с заголовком Host и с хостом из NEXT_PUBLIC_APP_URL.
 * Эти значения кросс-сайт страница в браузере подделать не может. X-Forwarded-Host не
 * учитываем: nginx его не перезаписывает, и клиент подставил бы любое значение.
 */
function isSameOriginRequest(request: NextRequest): boolean {
  // Sec-Fetch-Site выставляет браузер, и страница не может его изменить
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false

  const origin = request.headers.get('origin')
  if (!origin) {
    // Ни Origin, ни кросс-сайт Sec-Fetch-Site: не браузерная кросс-сайт форма (curl, сервер)
    return true
  }

  const trustedHosts = new Set<string>()
  const host = request.headers.get('host')
  if (host) trustedHosts.add(host.toLowerCase())
  try {
    if (appUrl) trustedHosts.add(new URL(appUrl).host.toLowerCase())
  } catch {
    // Некорректный NEXT_PUBLIC_APP_URL не должен ломать вход
  }

  try {
    return trustedHosts.has(new URL(origin).host.toLowerCase())
  } catch {
    return false // в том числе "Origin: null"
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Кросс-сайт форма не может отправить application/json без CORS-preflight
  const mediaType = (request.headers.get('content-type') ?? '').split(';')[0]?.trim().toLowerCase()
  if (mediaType !== 'application/json') {
    return NextResponse.json({ error: 'Unsupported Media Type' }, { status: 415 })
  }

  const body = await request.json().catch(() => null)

  if (!body || typeof body.access_token !== 'string' || typeof body.refresh_token !== 'string') {
    return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('access_token', body.access_token, {
    ...cookieOptions,
    maxAge,
  })
  response.cookies.set('refresh_token', body.refresh_token, {
    ...cookieOptions,
    maxAge,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('access_token', '', { ...cookieOptions, maxAge: 0 })
  response.cookies.set('refresh_token', '', { ...cookieOptions, maxAge: 0 })
  return response
}
