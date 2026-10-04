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
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
    ...(typeof body === 'string' ? {} : { duplex: 'half' }),
  } as RequestInit)
}

function makeRequest(body: unknown): NextRequest {
  return makeRawRequest(JSON.stringify(body))
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
    delete process.env.TELEGRAM_API_BASE
    delete process.env.SMTP_HOST
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASSWORD
    sendEmail.mockResolvedValue({ id: 'email_1' })
    sendSmtpMail.mockResolvedValue({ messageId: 'smtp_1' })
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

  it('принимает заявку только с ником в Telegram', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    const { POST } = await loadRoute()

    const response = await POST(
      makeRequest({ name: 'Иван', telegram: 'ivan_petrov', message: 'Заявка на созвон' })
    )

    expect(response.status).toBe(200)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.mock.calls[0][0].html).toContain('https://t.me/ivan_petrov')
  })

  it('нормализует ссылку t.me и голый ник до вида @name', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.TELEGRAM_CHAT_ID = 'chat-id'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await loadRoute()

    const response = await POST(
      makeRequest({ name: 'Иван', telegram: 'https://t.me/ivan_petrov' })
    )

    expect(response.status).toBe(200)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.text).toContain('@ivan_petrov')
    vi.unstubAllGlobals()
  })

  it('отклоняет мусор в поле Telegram, если других контактов нет', async () => {
    process.env.RESEND_API_KEY = 'test-key'
    const { POST } = await loadRoute()

    const response = await POST(makeRequest({ name: 'Иван', telegram: '???' }))

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

describe('POST /api/contact — SMTP и реле Telegram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.RESEND_API_KEY
    delete process.env.ADMIN_EMAIL
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    delete process.env.TELEGRAM_API_BASE
    delete process.env.SMTP_HOST
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASSWORD
    sendEmail.mockResolvedValue({ id: 'email_1' })
    sendSmtpMail.mockResolvedValue({ messageId: 'smtp_1' })
  })

  function configureSmtp() {
    process.env.SMTP_HOST = 'smtp.yandex.ru'
    process.env.SMTP_USER = 'hello@savagemovie.ru'
    process.env.SMTP_PASSWORD = 'app-password'
  }

  it('доставляет заявку через SMTP на hello@savagemovie.ru', async () => {
    configureSmtp()
    const { POST } = await loadRoute()

    const response = await POST(makeRequest(validSubmission))

    expect(response.status).toBe(200)
    expect(sendSmtpMail).toHaveBeenCalledTimes(1)
    expect(sendSmtpMail.mock.calls[0][0]).toMatchObject({ to: 'hello@savagemovie.ru' })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('ставит email клиента в reply-to письма SMTP', async () => {
    configureSmtp()
    const { POST } = await loadRoute()

    await POST(makeRequest({ name: 'Иван', email: 'client@example.com', message: 'Привет' }))

    expect(sendSmtpMail.mock.calls[0][0]).toMatchObject({ replyTo: 'client@example.com' })
  })

  it('заявка доходит письмом, даже если Telegram недоступен', async () => {
    configureSmtp()
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.TELEGRAM_CHAT_ID = '123'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ETIMEDOUT')))
    const { POST } = await loadRoute()

    const response = await POST(makeRequest(validSubmission))

    expect(response.status).toBe(200)
    expect(sendSmtpMail).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('шлёт Telegram через реле, когда задан TELEGRAM_API_BASE', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.TELEGRAM_CHAT_ID = '123'
    process.env.TELEGRAM_API_BASE = 'https://tg-relay.example.com'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' })
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await loadRoute()

    await POST(makeRequest(validSubmission))

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://tg-relay.example.com/botbot-token/sendMessage'
    )
    vi.unstubAllGlobals()
  })

  it('срезает хвостовой слеш у адреса реле', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.TELEGRAM_CHAT_ID = '123'
    process.env.TELEGRAM_API_BASE = 'https://tg-relay.example.com/'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' })
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await loadRoute()

    await POST(makeRequest(validSubmission))

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://tg-relay.example.com/botbot-token/sendMessage'
    )
    vi.unstubAllGlobals()
  })

  it('без реле идёт напрямую в api.telegram.org', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
    process.env.TELEGRAM_CHAT_ID = '123'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' })
    vi.stubGlobal('fetch', fetchMock)
    const { POST } = await loadRoute()

    await POST(makeRequest(validSubmission))

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.telegram.org/botbot-token/sendMessage')
    vi.unstubAllGlobals()
  })

  it('500, если SMTP упал и других каналов нет', async () => {
    configureSmtp()
    sendSmtpMail.mockRejectedValue(new Error('SMTP auth failed'))
    const { POST } = await loadRoute()

    const response = await POST(makeRequest(validSubmission))

    expect(response.status).toBe(500)
  })
  describe('предзапись на AI-курс (source: ai-course)', () => {
    const aiSubmission = {
      name: 'Анна Тестова',
      email: 'Anna@Mail.RU',
      projectType: 'course',
      message: 'резервный текст',
      source: 'ai-course',
      lead: {
        tier: 'advanced',
        channel: 'email',
        button: 'hero',
        consent: { personalData: true, announcements: false, rev: '2026-10-01' },
      },
    }

    it('отправляет письмо по шаблону предзаписи с текстовой версией', async () => {
      configureSmtp()
      const { POST } = await loadRoute()

      const response = await POST(makeRequest(aiSubmission))

      expect(response.status).toBe(200)
      const mail = sendSmtpMail.mock.calls[0][0]
      expect(mail.subject).toBe('ПРЕДЗАПИСЬ НА КУРС - Анна Тестова')
      expect(mail.html).toContain('Для CRM')
      expect(mail.text).toContain('Email: anna@mail.ru · удобнее всего')
      expect(mail.replyTo).toBe('anna@mail.ru')
      expect(mail.to).toBe('hello@savagemovie.ru')
    })

    it('отклоняет заявку без согласия на обработку данных и ничего не отправляет', async () => {
      configureSmtp()
      const { POST } = await loadRoute()

      const response = await POST(
        makeRequest({ ...aiSubmission, lead: { ...aiSubmission.lead, consent: {} } })
      )

      expect(response.status).toBe(400)
      expect(sendSmtpMail).not.toHaveBeenCalled()
    })

    it('обычные заявки идут по прежнему шаблону без текстовой версии', async () => {
      configureSmtp()
      const { POST } = await loadRoute()

      await POST(makeRequest(validSubmission))

      const mail = sendSmtpMail.mock.calls[0][0]
      expect(mail.subject).toBe('Новая заявка с сайта — Иван — Коммерция')
      expect(mail).not.toHaveProperty('text')
    })
  })
})

describe('POST /api/contact — безопасность письма и тела запроса', () => {
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
  })

  describe('ссылка mailto: в письме', () => {
    it('обычный email остаётся ссылкой, Reply-To на месте', async () => {
      const { POST } = await loadRoute()

      await POST(makeRequest({ name: 'Иван', email: 'client@example.com', message: 'Привет' }))

      const mail = sendSmtpMail.mock.calls[0][0]
      expect(mail.html).toContain('<a href="mailto:client@example.com">client@example.com</a>')
      expect(mail.replyTo).toBe('client@example.com')
    })

    it('email с параметрами mailto (bcc, subject, body) не превращается в ссылку', async () => {
      const { POST } = await loadRoute()
      const injected = 'x@y.zz?bcc=attacker%40evil.example&subject=hi&body=call%20me'

      const response = await POST(makeRequest({ name: 'Иван', email: injected, message: 'Привет' }))

      // Заявка принимается — отказывать настоящим людям из-за экзотического адреса нельзя
      expect(response.status).toBe(200)
      const mail = sendSmtpMail.mock.calls[0][0]
      expect(mail.html).not.toContain('mailto:')
      expect(mail.html).not.toContain('<a href="mailto')
      // Адрес виден владельцу обычным текстом (с экранированным амперсандом)
      expect(mail.html).toContain('x@y.zz?bcc=attacker%40evil.example&amp;subject=hi')
    })

    it('экзотический, но настоящий адрес (апостроф) показывается текстом и не теряется', async () => {
      const { POST } = await loadRoute()

      const response = await POST(
        makeRequest({ name: 'Иван', email: "o'brien@example.com", message: 'Привет' })
      )

      expect(response.status).toBe(200)
      const mail = sendSmtpMail.mock.calls[0][0]
      expect(mail.html).not.toContain('mailto:')
      expect(mail.html).toContain('o&#039;brien@example.com')
      expect(mail.replyTo).toBe("o'brien@example.com")
    })
  })

  describe('потолок размера тела', () => {
    it('большой Content-Length даёт 413, заявка не уходит', async () => {
      const { POST } = await loadRoute()

      const response = await POST(
        makeRawRequest(JSON.stringify({ name: 'Иван', phone: '+79990000000' }), {
          'content-length': String(100 * 1024 * 1024),
        })
      )

      expect(response.status).toBe(413)
      await expect(response.json()).resolves.toEqual({ error: expect.any(String) })
      expect(sendSmtpMail).not.toHaveBeenCalled()
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
      // Потолок 32 КБ = 2 куска по 16 КБ; третий переполняет счётчик
      expect(pulled).toBeLessThanOrEqual(3)
      expect(sendSmtpMail).not.toHaveBeenCalled()
    })

    it('битый JSON даёт 400', async () => {
      const { POST } = await loadRoute()

      const response = await POST(makeRawRequest('{"name":'))

      expect(response.status).toBe(400)
      expect(sendSmtpMail).not.toHaveBeenCalled()
    })

    it('заявка со всеми полями на максимуме проходит', async () => {
      const { POST } = await loadRoute()
      const biggest = {
        name: 'я'.repeat(100),
        phone: '1'.repeat(20),
        telegram: 'a'.repeat(32),
        email: `${'я'.repeat(50)}@example.com`,
        company: 'я'.repeat(200),
        message: 'я'.repeat(2000),
        budget: 5_000_000,
        projectType: 'commercial',
      }
      expect(new TextEncoder().encode(JSON.stringify(biggest)).byteLength).toBeLessThan(16 * 1024)

      const response = await POST(makeRequest(biggest))

      expect(response.status).toBe(200)
    })
  })
})
