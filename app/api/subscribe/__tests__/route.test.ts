// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const sendEmail = vi.fn()
const sendSmtpMail = vi.fn()

vi.mock('@/lib/integrations/resend/client', () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}))

vi.mock('@/lib/integrations/smtp/client', () => ({
  sendSmtpMail: (...args: unknown[]) => sendSmtpMail(...args),
  isSmtpConfigured: () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

/** Настоящий запрос: маршрут сам читает поток тела с потолком по размеру */
function makeRawRequest(
  body: string | ReadableStream<Uint8Array>,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest('http://localhost/api/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
    ...(typeof body === 'string' ? {} : { duplex: 'half' }),
  } as RequestInit)
}

function makeRequest(body: unknown): NextRequest {
  return makeRawRequest(JSON.stringify(body))
}

async function loadRoute() {
  vi.resetModules()
  return import('../route')
}

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.RESEND_API_KEY
    delete process.env.ADMIN_EMAIL
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    process.env.SMTP_HOST = 'smtp.yandex.ru'
    process.env.SMTP_USER = 'hello@savagemovie.ru'
    process.env.SMTP_PASSWORD = 'app-password'
    sendSmtpMail.mockResolvedValue({ messageId: 'smtp_1' })
    // Бэкенд подписок: новая подписка
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ already_subscribed: false }) })
    )
  })

  it('принимает подписку и шлёт уведомление с ссылкой на обычный email', async () => {
    const { POST } = await loadRoute()

    const response = await POST(makeRequest({ email: 'Client@Example.com', source: 'footer' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true, alreadySubscribed: false })
    const mail = sendSmtpMail.mock.calls[0][0]
    expect(mail.html).toContain('<a href="mailto:client@example.com">client@example.com</a>')
    expect(mail.replyTo).toBe('client@example.com')
  })

  it('передаёт бэкенду настоящий IP клиента, а не подставленный в X-Forwarded-For', async () => {
    const { POST } = await loadRoute()

    const response = await POST(
      makeRawRequest(JSON.stringify({ email: 'client@example.com' }), {
        'x-real-ip': '203.0.113.7',
        'x-forwarded-for': '9.9.9.9, 203.0.113.7',
      })
    )

    expect(response.status).toBe(200)
    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['X-Real-IP']).toBe('203.0.113.7')
  })

  it('email с параметрами mailto (bcc, subject, body) не превращается в ссылку', async () => {
    const { POST } = await loadRoute()
    const injected = 'x@y.zz?bcc=attacker%40evil.example&subject=hi&body=call%20me'

    const response = await POST(makeRequest({ email: injected }))

    // Подписка принимается как раньше; уведомление не содержит кликабельного mailto с чужим bcc
    expect(response.status).toBe(200)
    const mail = sendSmtpMail.mock.calls[0][0]
    expect(mail.html).not.toContain('mailto:')
    expect(mail.html).toContain('x@y.zz?bcc=attacker%40evil.example&amp;subject=hi')
  })

  it('отклоняет некорректный email', async () => {
    const { POST } = await loadRoute()

    const response = await POST(makeRequest({ email: 'not-an-email' }))

    expect(response.status).toBe(400)
    expect(sendSmtpMail).not.toHaveBeenCalled()
  })

  it('большой Content-Length даёт 413, ничего не отправляется', async () => {
    const { POST } = await loadRoute()

    const response = await POST(
      makeRawRequest(JSON.stringify({ email: 'client@example.com' }), {
        'content-length': String(100 * 1024 * 1024),
      })
    )

    expect(response.status).toBe(413)
    expect(sendSmtpMail).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('без Content-Length поток обрывается у потолка и даёт 413', async () => {
    const { POST } = await loadRoute()

    const chunk = new Uint8Array(16 * 1024).fill(0x20)
    let pulled = 0
    const stream = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          if (pulled >= 6400) {
            controller.close()
            return
          }
          pulled += 1
          controller.enqueue(chunk)
        },
      },
      { highWaterMark: 0 }
    )

    const response = await POST(makeRawRequest(stream))

    expect(response.status).toBe(413)
    expect(pulled).toBeLessThanOrEqual(3)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('битый JSON даёт 400', async () => {
    const { POST } = await loadRoute()

    const response = await POST(makeRawRequest('{"email":'))

    expect(response.status).toBe(400)
  })
})
