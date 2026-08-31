import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

const sendEmail = vi.fn()

vi.mock('@/lib/integrations/resend/client', () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

function makeRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest
}

/** Роут читает env на уровне модуля, поэтому импортируем его заново на каждый кейс */
async function loadRoute() {
  vi.resetModules()
  return import('../route')
}

const validSubmission = {
  name: 'Иван',
  phone: '+79990000000',
  message: 'Хочу снять ролик',
  budget: 500000,
  projectType: 'commercial',
}

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.RESEND_API_KEY
    delete process.env.ADMIN_EMAIL
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    sendEmail.mockResolvedValue({ id: 'email_1' })
  })

  it('отправляет заявку на hello@savagemovie.ru, когда ADMIN_EMAIL не задан', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    const { POST } = await loadRoute()

    const response = await POST(makeRequest(validSubmission))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: 'hello@savagemovie.ru' })
  })

  it('принимает заявку с email вместо телефона и ставит его в reply-to', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    const { POST } = await loadRoute()

    const response = await POST(
      makeRequest({ name: 'Иван', email: 'Client@Example.COM', message: 'Привет' })
    )

    expect(response.status).toBe(200)
    expect(sendEmail.mock.calls[0][0]).toMatchObject({ replyTo: 'client@example.com' })
  })

  it('отвечает 400, если нет ни телефона, ни email', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    const { POST } = await loadRoute()

    const response = await POST(makeRequest({ name: 'Иван', message: 'Привет' }))

    expect(response.status).toBe(400)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('успешен, если Telegram упал, но письмо ушло', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    process.env.TELEGRAM_BOT_TOKEN = 'token'
    process.env.TELEGRAM_CHAT_ID = '123'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, text: async () => 'nope' }))
    const { POST } = await loadRoute()

    const response = await POST(makeRequest(validSubmission))

    expect(response.status).toBe(200)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('доставляет только через Telegram, когда Resend не настроен', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.TELEGRAM_CHAT_ID = '123456'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' })
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await loadRoute()

    const response = await POST(makeRequest(validSubmission))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(sendEmail).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.telegram.org/botbot-token/sendMessage')
    const payload = JSON.parse(init.body)
    expect(payload.chat_id).toBe('123456')
    expect(payload.parse_mode).toBe('HTML')
    expect(payload.text).toContain('Иван')
    expect(payload.text).toContain('+79990000000')
    expect(payload.text).toContain('Коммерция')
    vi.unstubAllGlobals()
  })

  it('не ломает кавычки и угловые скобки в тексте для Telegram', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.TELEGRAM_CHAT_ID = '123456'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' })
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await loadRoute()

    await POST(
      makeRequest({
        name: 'Иван',
        phone: '+79990000000',
        message: 'Хочу "крутое" видео <про нас> & команду',
      })
    )

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body)
    // кавычки остаются как есть — Telegram их не декодирует
    expect(payload.text).toContain('"крутое"')
    // а вот угловые скобки и амперсанд обязаны быть экранированы
    expect(payload.text).toContain('&lt;про нас&gt;')
    expect(payload.text).toContain('&amp; команду')
    expect(payload.text).not.toContain('&quot;')
    vi.unstubAllGlobals()
  })

  it('отвечает 500, если ни один канал доставки не настроен', async () => {
    const { POST } = await loadRoute()

    const response = await POST(makeRequest(validSubmission))

    expect(response.status).toBe(500)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('отвечает 500, если все каналы упали', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    sendEmail.mockRejectedValue(new Error('resend down'))
    const { POST } = await loadRoute()

    const response = await POST(makeRequest(validSubmission))

    expect(response.status).toBe(500)
  })

  it('уважает ADMIN_EMAIL, если он задан', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    process.env.ADMIN_EMAIL = 'studio@savagemovie.ru'
    const { POST } = await loadRoute()

    await POST(makeRequest(validSubmission))

    expect(sendEmail.mock.calls[0][0]).toMatchObject({ to: 'studio@savagemovie.ru' })
  })
})
