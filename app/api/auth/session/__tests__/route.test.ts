/**
 * POST /api/auth/session ставит httpOnly-куки с токенами. Чужая страница не должна уметь
 * подменить ими сессию в браузере жертвы (login CSRF), а вход с самого сайта и из админки
 * должен работать как раньше.
 */
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const TOKENS = { access_token: 'access-123', refresh_token: 'refresh-456' }

/** Маршрут читает NEXT_PUBLIC_APP_URL при загрузке модуля, поэтому грузим заново */
async function loadRoute(appUrl = 'https://savagemovie.ru') {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_APP_URL', appUrl)
  return import('../route')
}

function makeRequest(
  headers: Record<string, string>,
  body: string | null = JSON.stringify(TOKENS),
  method = 'POST'
): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/session', {
    method,
    headers,
    ...(body === null ? {} : { body }),
  })
}

/** Заголовки fetch() со страницы savagemovie.ru, как их отправляет браузер за nginx */
const sameOriginFetch = {
  host: 'savagemovie.ru',
  origin: 'https://savagemovie.ru',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'cors',
  'content-type': 'application/json',
}

function expectSessionCookies(response: Response) {
  const setCookie = response.headers.get('set-cookie') ?? ''
  expect(setCookie).toContain('access_token=access-123')
  expect(setCookie).toContain('refresh_token=refresh-456')
  expect(setCookie.toLowerCase()).toContain('httponly')
}

function expectNoCookies(response: Response) {
  expect(response.headers.get('set-cookie')).toBeNull()
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/auth/session: легитимный вход работает', () => {
  it('fetch со страницы сайта (как lib/api/auth.ts) ставит куки', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest(sameOriginFetch))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expectSessionCookies(response)
  })

  it.each(['application/json; charset=utf-8', 'Application/JSON', ' application/json ;x=y'])(
    'Content-Type %j принимается',
    async contentType => {
      const { POST } = await loadRoute()
      const response = await POST(makeRequest({ ...sameOriginFetch, 'content-type': contentType }))

      expect(response.status).toBe(200)
      expectSessionCookies(response)
    }
  )

  it('браузер без Sec-Fetch-Site: Origin совпадает с Host', async () => {
    const { POST } = await loadRoute()
    const headers: Record<string, string> = { ...sameOriginFetch }
    delete headers['sec-fetch-site']
    const response = await POST(makeRequest(headers))

    expect(response.status).toBe(200)
    expectSessionCookies(response)
  })

  it('Origin с портом, когда nginx передал Host без порта: хост берётся из NEXT_PUBLIC_APP_URL', async () => {
    const { POST } = await loadRoute('https://staging.example:8443')
    const response = await POST(
      makeRequest({
        host: 'staging.example',
        origin: 'https://staging.example:8443',
        'content-type': 'application/json',
      })
    )

    expect(response.status).toBe(200)
  })

  it('Host внутри сети, Origin совпадает с хостом из NEXT_PUBLIC_APP_URL', async () => {
    const { POST } = await loadRoute()
    const response = await POST(
      makeRequest({
        host: 'frontend:3000',
        origin: 'https://savagemovie.ru',
        'content-type': 'application/json',
      })
    )

    expect(response.status).toBe(200)
  })

  it('локальная разработка: localhost:3000', async () => {
    const { POST } = await loadRoute('http://localhost:3000')
    const response = await POST(
      makeRequest({
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json',
      })
    )

    expect(response.status).toBe(200)
  })

  it('не браузерный клиент (ни Origin, ни Sec-Fetch-Site) с application/json', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({ 'content-type': 'application/json' }))

    expect(response.status).toBe(200)
    expectSessionCookies(response)
  })

  it('прежняя валидация тела сохранилась', async () => {
    const { POST } = await loadRoute()

    const notJson = await POST(makeRequest(sameOriginFetch, 'не json'))
    expect(notJson.status).toBe(400)
    expectNoCookies(notJson)

    const noRefresh = await POST(
      makeRequest(sameOriginFetch, JSON.stringify({ access_token: 'a' }))
    )
    expect(noRefresh.status).toBe(400)
    expectNoCookies(noRefresh)
  })
})

describe('POST /api/auth/session: CSRF отклоняется', () => {
  // text/plain-форма: <input name='{"access_token":"..","refresh_token":"..","pad":"' value='"}'>
  const attackBody = '{"access_token":"evil","refresh_token":"evil","pad":"="}\r\n'

  it('кросс-сайт форма text/plain с JSON в теле: 403 и без кук', async () => {
    const { POST } = await loadRoute()
    const response = await POST(
      makeRequest(
        {
          host: 'savagemovie.ru',
          origin: 'https://evil.example',
          'sec-fetch-site': 'cross-site',
          'sec-fetch-mode': 'navigate',
          'content-type': 'text/plain',
        },
        attackBody
      )
    )

    expect(response.status).toBe(403)
    expectNoCookies(response)
  })

  it('text/plain с совпадающим origin: 415 и без кук', async () => {
    const { POST } = await loadRoute()
    const response = await POST(
      makeRequest({ ...sameOriginFetch, 'content-type': 'text/plain' }, attackBody)
    )

    expect(response.status).toBe(415)
    expectNoCookies(response)
  })

  it.each([
    'text/plain',
    'text/plain;charset=UTF-8',
    'application/x-www-form-urlencoded',
    'multipart/form-data; boundary=x',
    'application/jsonx',
    'text/json',
    '',
  ])('Content-Type %j без других признаков: 415', async contentType => {
    const { POST } = await loadRoute()
    const headers: Record<string, string> = {}
    if (contentType) headers['content-type'] = contentType
    const response = await POST(makeRequest(headers, attackBody))

    expect(response.status).toBe(415)
    expectNoCookies(response)
  })

  it('кросс-сайт fetch с application/json (если бы прошёл CORS): 403', async () => {
    const { POST } = await loadRoute()
    const response = await POST(
      makeRequest({
        host: 'savagemovie.ru',
        origin: 'https://evil.example',
        'sec-fetch-site': 'cross-site',
        'content-type': 'application/json',
      })
    )

    expect(response.status).toBe(403)
    expectNoCookies(response)
  })

  it('чужой Origin без Sec-Fetch-Site (старый браузер): 403', async () => {
    const { POST } = await loadRoute()
    const response = await POST(
      makeRequest({
        host: 'savagemovie.ru',
        origin: 'https://evil.example',
        'content-type': 'application/json',
      })
    )

    expect(response.status).toBe(403)
    expectNoCookies(response)
  })

  it.each([
    'https://evil.example',
    'https://savagemovie.ru.evil.example',
    'https://evilsavagemovie.ru',
    'https://savagemovie.ru:8443',
    'https://savagemovie.ru@evil.example',
    'null',
    'not a url',
  ])('Origin %j: 403', async origin => {
    const { POST } = await loadRoute()
    const response = await POST(
      makeRequest({ host: 'savagemovie.ru', origin, 'content-type': 'application/json' })
    )

    expect(response.status).toBe(403)
    expectNoCookies(response)
  })

  // nginx не перезаписывает X-Forwarded-Host, значит значение задаёт сам клиент
  it('X-Forwarded-Host от клиента не делает чужой Origin доверенным: 403', async () => {
    const { POST } = await loadRoute()
    const response = await POST(
      makeRequest({
        host: 'savagemovie.ru',
        'x-forwarded-host': 'evil.example',
        origin: 'https://evil.example',
        'content-type': 'application/json',
      })
    )

    expect(response.status).toBe(403)
    expectNoCookies(response)
  })

  it.each(['cross-site', 'same-site'])('Sec-Fetch-Site %s без Origin: 403', async site => {
    const { POST } = await loadRoute()
    const response = await POST(
      makeRequest({
        host: 'savagemovie.ru',
        'sec-fetch-site': site,
        'content-type': 'application/json',
      })
    )

    expect(response.status).toBe(403)
    expectNoCookies(response)
  })

  it('Sec-Fetch-Site cross-site отклоняет, даже если Origin совпал', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({ ...sameOriginFetch, 'sec-fetch-site': 'cross-site' }))

    expect(response.status).toBe(403)
    expectNoCookies(response)
  })
})

describe('GET и DELETE /api/auth/session не изменились', () => {
  it('GET отдаёт токен из куки', async () => {
    const { GET } = await loadRoute()
    const response = await GET(makeRequest({ cookie: 'access_token=abc' }, null, 'GET'))

    expect(await response.json()).toEqual({ access_token: 'abc' })
  })

  it('DELETE сбрасывает куки', async () => {
    const { DELETE } = await loadRoute()
    const response = await DELETE()
    const setCookie = response.headers.get('set-cookie') ?? ''

    expect(response.status).toBe(200)
    expect(setCookie).toContain('access_token=;')
    expect(setCookie).toContain('refresh_token=;')
  })
})
