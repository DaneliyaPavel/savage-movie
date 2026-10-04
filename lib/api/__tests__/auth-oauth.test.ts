import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getGoogleOAuthUrl, getYandexOAuthUrl } from '../auth'

describe('старт OAuth', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function okResponse(authUrl: string) {
    return new Response(JSON.stringify({ auth_url: authUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  it('Google: запрос уходит с credentials include, возвращается auth_url со state', async () => {
    fetchMock.mockResolvedValue(
      okResponse('https://accounts.google.com/o/oauth2/v2/auth?state=abc')
    )

    await expect(getGoogleOAuthUrl()).resolves.toBe(
      'https://accounts.google.com/o/oauth2/v2/auth?state=abc'
    )

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/auth\/oauth\/google$/)
    expect(init.method).toBe('GET')
    // Без include браузер не сохранит cookie со state при кросс-доменном API (dev)
    expect(init.credentials).toBe('include')
  })

  it('Yandex: то же для своего эндпоинта', async () => {
    fetchMock.mockResolvedValue(okResponse('https://oauth.yandex.ru/authorize?state=xyz'))

    await expect(getYandexOAuthUrl()).resolves.toBe('https://oauth.yandex.ru/authorize?state=xyz')

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/auth\/oauth\/yandex$/)
    expect(init.credentials).toBe('include')
  })

  it('ошибка backend пробрасывается как раньше', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Сервис недоступен' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    await expect(getGoogleOAuthUrl()).rejects.toThrow('Сервис недоступен')
  })
})
