/**
 * Заявка на смету — единственная конверсия коммерческого лендинга, поэтому
 * проверяем ровно те свойства, на которых держится доверие к цифрам:
 * успех только при реальной доставке, антиспам не пропускает ботов и
 * не режет людей, атрибуция доезжает до письма и до внешнего приёмника.
 */
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const sendEmail = vi.fn()
const sendSmtpMail = vi.fn()
const sendTelegramMessage = vi.fn()

vi.mock('@/lib/integrations/resend/client', () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}))

vi.mock('@/lib/integrations/smtp/client', () => ({
  sendSmtpMail: (...args: unknown[]) => sendSmtpMail(...args),
  isSmtpConfigured: () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
}))

vi.mock('@/lib/integrations/telegram/client', () => ({
  sendTelegramMessage: (...args: unknown[]) => sendTelegramMessage(...args),
  isTelegramConfigured: () =>
    Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  escapeTelegram: (value: string) => value,
}))

const loggerError = vi.fn()

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: (...args: unknown[]) => loggerError(...args),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

/**
 * Настоящий запрос, а не заглушка с json(): маршрут сам читает поток тела с
 * потолком по размеру. Заявка приходит через nginx, а он выставляет x-real-ip.
 */
function makeRawRequest(
  body: string | ReadableStream<Uint8Array>,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest('http://localhost/api/estimate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
    ...(typeof body === 'string' ? {} : { duplex: 'half' }),
  } as RequestInit)
}

function makeRequest(
  body: unknown,
  ip = '10.0.0.1',
  extraHeaders: Record<string, string> = {}
): NextRequest {
  return makeRawRequest(JSON.stringify(body), { 'x-real-ip': ip, ...extraHeaders })
}

/** Счётчики антиспама живут в модуле — на каждый кейс берём свежий инстанс */
async function loadRoute() {
  vi.resetModules()
  return import('../route')
}

const validLead = {
  name: 'Иван Тестовый',
  company: 'ООО Ромашка',
  contact: '+79990000000',
  projectType: 'ad',
  usage: ['digital', 'social'],
  deadline: 'month',
  budgetRange: '400-700',
  comment: 'Нужен ролик к запуску продукта',
  consent: true,
  website: '',
  elapsedMs: 30_000,
  clientId: '1700000000000000',
  attribution: {
    utm_source: 'yandex',
    utm_medium: 'cpc',
    utm_campaign: 'reklamny-rolik-msk',
    yclid: '9876543210',
  },
  landingPath: '/reklamny-rolik',
  referrer: 'https://yandex.ru/',
}

describe('POST /api/estimate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'user'
    process.env.SMTP_PASSWORD = 'password'
    delete process.env.RESEND_API_KEY
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    delete process.env.LEAD_WEBHOOK_URL
    delete process.env.LEAD_WEBHOOK_TOKEN
    sendSmtpMail.mockResolvedValue({ messageId: 'smtp_1' })
    sendEmail.mockResolvedValue({ id: 'email_1' })
    sendTelegramMessage.mockResolvedValue({ ok: true })
  })

  it('принимает валидную заявку и отправляет письмо', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest(validLead))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ success: true })
    expect(sendSmtpMail).toHaveBeenCalledTimes(1)
  })

  it('доводит рекламную атрибуцию до письма', async () => {
    const { POST } = await loadRoute()
    await POST(makeRequest(validLead))

    const html = sendSmtpMail.mock.calls[0]![0].html as string
    expect(html).toContain('yandex')
    expect(html).toContain('reklamny-rolik-msk')
    expect(html).toContain('9876543210')
    expect(html).toContain('1700000000000000')
  })

  it('honeypot: заполненное скрытое поле не создаёт заявку, но отвечает нейтральным success', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({ ...validLead, website: 'http://spam.example' }))

    // Боту отвечаем success:true (чтобы он не подбирал обход), но с
    // filtered:true — фронтенд по этому флагу не шлёт production_lead_success
    await expect(response.json()).resolves.toMatchObject({ success: true, filtered: true })
    expect(sendSmtpMail).not.toHaveBeenCalled()
  })

  it('валидная заявка быстрее секунды всё равно доставляется (автозаполнение браузера)', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({ ...validLead, elapsedMs: 300 }))

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toMatchObject({ success: true })
    expect(data.filtered).not.toBe(true)
    expect(sendSmtpMail).toHaveBeenCalledTimes(1)
  })

  it('валидная заявка за ~2 секунды доставляется (ниже старого порога в 4с)', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({ ...validLead, elapsedMs: 2000 }))

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toMatchObject({ success: true })
    expect(data.filtered).not.toBe(true)
    expect(sendSmtpMail).toHaveBeenCalledTimes(1)
  })

  it('подозрительно быстрое заполнение логируется, но не блокирует доставку', async () => {
    const { logger } = await import('@/lib/utils/logger')
    const { POST } = await loadRoute()
    await POST(makeRequest({ ...validLead, elapsedMs: 300 }))

    expect(logger.warn).toHaveBeenCalledWith(
      'Заявка заполнена подозрительно быстро',
      expect.objectContaining({ elapsedMs: 300 })
    )
  })

  it('обычная заявка (elapsedMs не ниже порога) не логируется как подозрительная', async () => {
    const { logger } = await import('@/lib/utils/logger')
    const { POST } = await loadRoute()
    await POST(makeRequest(validLead))

    expect(logger.warn).not.toHaveBeenCalledWith(
      'Заявка заполнена подозрительно быстро',
      expect.anything()
    )
  })

  it('без согласия на обработку ПД заявка отклоняется', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({ ...validLead, consent: false }))

    expect(response.status).toBe(400)
    expect(sendSmtpMail).not.toHaveBeenCalled()
  })

  it('нечитаемый контакт отклоняется с понятной ошибкой', async () => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({ ...validLead, contact: 'напишите мне' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining('телефон'),
    })
  })

  it.each([
    ['телефон', '+7 (999) 000-00-00'],
    ['email', 'client@example.com'],
    ['telegram', '@client_handle'],
    ['ссылку t.me', 't.me/client_handle'],
  ])('принимает %s как контакт', async (_label, contact) => {
    const { POST } = await loadRoute()
    const response = await POST(makeRequest({ ...validLead, contact }))

    expect(response.status).toBe(200)
  })

  it('повтор той же заявки не создаёт второе письмо', async () => {
    const { POST } = await loadRoute()
    await POST(makeRequest(validLead))
    const second = await POST(makeRequest(validLead))

    expect(sendSmtpMail).toHaveBeenCalledTimes(1)
    await expect(second.json()).resolves.toMatchObject({ success: true, duplicate: true })
  })

  it('шестая заявка с одного адреса за час получает 429', async () => {
    const { POST } = await loadRoute()

    for (let index = 0; index < 5; index += 1) {
      const response = await POST(
        makeRequest({ ...validLead, comment: `Заявка ${index}` }, '10.0.0.99')
      )
      expect(response.status).toBe(200)
    }

    const blocked = await POST(
      makeRequest({ ...validLead, comment: 'Заявка 6' }, '10.0.0.99')
    )
    expect(blocked.status).toBe(429)
  })

  it('лимит считается по адресу, а не на всех сразу', async () => {
    const { POST } = await loadRoute()

    for (let index = 0; index < 5; index += 1) {
      await POST(makeRequest({ ...validLead, comment: `A${index}` }, '10.0.0.1'))
    }

    const other = await POST(makeRequest({ ...validLead, comment: 'B' }, '10.0.0.2'))
    expect(other.status).toBe(200)
  })

  it('не подтверждает заявку, если ни один канал не доставил', async () => {
    sendSmtpMail.mockRejectedValue(new Error('smtp down'))

    const { POST } = await loadRoute()
    const response = await POST(makeRequest(validLead))

    expect(response.status).toBe(500)
  })

  it('без настроенных каналов доставки отвечает ошибкой, а не молчаливым успехом', async () => {
    delete process.env.SMTP_HOST
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASSWORD

    const { POST } = await loadRoute()
    const response = await POST(makeRequest(validLead))

    expect(response.status).toBe(500)
  })

  it('ссылка на бриф принимается только по http(s)', async () => {
    const { POST } = await loadRoute()
    await POST(makeRequest({ ...validLead, briefUrl: 'javascript:alert(1)' }))

    const html = sendSmtpMail.mock.calls[0]![0].html as string
    expect(html).not.toContain('javascript:')
  })

  it('передаёт лид во внешний приёмник, когда он настроен', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/lead'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await loadRoute()
    await POST(makeRequest(validLead))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body as string)
    expect(payload).toMatchObject({
      utm_source: 'yandex',
      yclid: '9876543210',
      budget_range: '400-700',
      landing_path: '/reklamny-rolik',
    })
    expect(payload.lead_id).toBeTruthy()

    vi.unstubAllGlobals()
  })

  it('подписывает вызов приёмника токеном из окружения', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/lead'
    // В .env лежит сырой токен: префикс Bearer добавляет само приложение
    process.env.LEAD_WEBHOOK_TOKEN = 'raw-token-without-bearer'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await loadRoute()
    await POST(makeRequest(validLead))

    const headers = fetchMock.mock.calls[0]![1].headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer raw-token-without-bearer')

    vi.unstubAllGlobals()
  })

  it('без токена уходит только Content-Type', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/lead'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await loadRoute()
    await POST(makeRequest(validLead))

    const headers = fetchMock.mock.calls[0]![1].headers as Record<string, string>
    expect(headers).not.toHaveProperty('Authorization')

    vi.unstubAllGlobals()
  })

  it('успешный ответ приёмника не пишет ошибку в лог', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/lead'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))

    const { POST } = await loadRoute()
    const response = await POST(makeRequest(validLead))

    expect(response.status).toBe(200)
    expect(loggerError).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
  })

  it('отказ приёмника по HTTP логируется, но заявка остаётся принятой', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/lead'
    process.env.LEAD_WEBHOOK_TOKEN = 'raw-token-without-bearer'
    // Просроченный токен: n8n отвечает 401, а не ошибкой сети
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))

    const { POST } = await loadRoute()
    const response = await POST(makeRequest(validLead))

    // Основной канал сработал — для клиента заявка принята
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ success: true })
    expect(sendSmtpMail).toHaveBeenCalledTimes(1)

    expect(loggerError).toHaveBeenCalledTimes(1)
    expect(loggerError.mock.calls[0]![2]).toMatchObject({
      route: '/api/estimate',
      status: 401,
    })
    expect(loggerError.mock.calls[0]![2].lead_id).toBeTruthy()

    vi.unstubAllGlobals()
  })

  it('токен приёмника не попадает в логи при отказе', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/lead'
    process.env.LEAD_WEBHOOK_TOKEN = 'raw-token-without-bearer'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const { POST } = await loadRoute()
    await POST(makeRequest(validLead))

    const logged = JSON.stringify(loggerError.mock.calls)
    expect(logged).not.toContain('raw-token-without-bearer')
    expect(logged).not.toContain('Bearer')
    expect(logged).not.toContain('Authorization')

    vi.unstubAllGlobals()
  })

  it('падение внешнего приёмника не отменяет принятую заявку', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/lead'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('n8n down')))

    const { POST } = await loadRoute()
    const response = await POST(makeRequest(validLead))

    expect(response.status).toBe(200)
    vi.unstubAllGlobals()
  })
})

describe('POST /api/estimate — защита от злоупотреблений', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_USER = 'user'
    process.env.SMTP_PASSWORD = 'password'
    delete process.env.RESEND_API_KEY
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_CHAT_ID
    delete process.env.LEAD_WEBHOOK_URL
    delete process.env.LEAD_WEBHOOK_TOKEN
    sendSmtpMail.mockResolvedValue({ messageId: 'smtp_1' })
    sendEmail.mockResolvedValue({ id: 'email_1' })
    sendTelegramMessage.mockResolvedValue({ ok: true })
  })

  describe('адрес клиента для лимита', () => {
    it('подмена X-Forwarded-For не создаёт новую корзину лимита', async () => {
      const { POST } = await loadRoute()

      // nginx выставил настоящий x-real-ip, а клиент каждый раз присылает свой «адрес»
      for (let index = 0; index < 5; index += 1) {
        const response = await POST(
          makeRequest({ ...validLead, comment: `Заявка ${index}` }, '198.51.100.20', {
            'x-forwarded-for': `203.0.113.${index}`,
          })
        )
        expect(response.status).toBe(200)
      }

      const blocked = await POST(
        makeRequest({ ...validLead, comment: 'Шестая' }, '198.51.100.20', {
          'x-forwarded-for': '203.0.113.200',
        })
      )
      expect(blocked.status).toBe(429)
      expect(sendSmtpMail).toHaveBeenCalledTimes(5)
    })

    it('без x-real-ip берётся последний элемент X-Forwarded-For, а не первый', async () => {
      const { POST } = await loadRoute()

      // Первые элементы цепочки присылает клиент, последний дописывает nginx
      for (let index = 0; index < 5; index += 1) {
        const response = await POST(
          makeRawRequest(JSON.stringify({ ...validLead, comment: `Заявка ${index}` }), {
            'x-forwarded-for': `10.9.8.${index}, 198.51.100.21`,
          })
        )
        expect(response.status).toBe(200)
      }

      const blocked = await POST(
        makeRawRequest(JSON.stringify({ ...validLead, comment: 'Шестая' }), {
          'x-forwarded-for': '10.9.8.99, 198.51.100.21',
        })
      )
      expect(blocked.status).toBe(429)
    })

    it('разные клиенты за nginx не делят корзину из-за одинаковой подделки', async () => {
      const { POST } = await loadRoute()

      for (let index = 0; index < 5; index += 1) {
        await POST(
          makeRequest({ ...validLead, comment: `A${index}` }, '198.51.100.30', {
            'x-forwarded-for': '1.2.3.4',
          })
        )
      }

      const other = await POST(
        makeRequest({ ...validLead, comment: 'B' }, '198.51.100.31', {
          'x-forwarded-for': '1.2.3.4',
        })
      )
      expect(other.status).toBe(200)
    })

    it('отказ по лимиту приходит до чтения тела', async () => {
      const { POST } = await loadRoute()

      for (let index = 0; index < 5; index += 1) {
        await POST(makeRequest({ ...validLead, comment: `Заявка ${index}` }, '198.51.100.40'))
      }

      let pulled = 0
      const stream = new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            pulled += 1
            controller.enqueue(new TextEncoder().encode(JSON.stringify(validLead)))
            controller.close()
          },
        },
        { highWaterMark: 0 }
      )
      const blocked = await POST(makeRawRequest(stream, { 'x-real-ip': '198.51.100.40' }))

      expect(blocked.status).toBe(429)
      expect(pulled).toBe(0)
    })
  })

  describe('потолок размера тела', () => {
    it('большой Content-Length даёт 413 до разбора, заявка не уходит', async () => {
      const { POST } = await loadRoute()

      const response = await POST(
        makeRawRequest(JSON.stringify(validLead), {
          'x-real-ip': '198.51.100.50',
          'content-length': String(100 * 1024 * 1024),
        })
      )

      expect(response.status).toBe(413)
      await expect(response.json()).resolves.toEqual({ error: expect.any(String) })
      expect(sendSmtpMail).not.toHaveBeenCalled()
    })

    it('без Content-Length поток на 100 МБ обрывается у потолка', async () => {
      const { POST } = await loadRoute()

      const chunkSize = 16 * 1024
      const chunk = new Uint8Array(chunkSize).fill(0x20)
      let pulled = 0
      let cancelled = false
      const stream = new ReadableStream<Uint8Array>(
        {
          pull(controller) {
            // Тело «на 100 МБ»: целиком оно бы не прочиталось
            if (pulled >= 6400) {
              controller.close()
              return
            }
            pulled += 1
            controller.enqueue(chunk)
          },
          cancel() {
            cancelled = true
          },
        },
        { highWaterMark: 0 }
      )
      const request = makeRawRequest(stream, { 'x-real-ip': '198.51.100.51' })
      expect(request.headers.get('content-length')).toBeNull()

      const response = await POST(request)

      expect(response.status).toBe(413)
      // Потолок 64 КБ = 4 куска по 16 КБ; ещё один кусок переполняет счётчик
      expect(pulled).toBeLessThanOrEqual(5)
      expect(cancelled).toBe(true)
      expect(sendSmtpMail).not.toHaveBeenCalled()
    })

    it('битый JSON даёт 400, а не 500 и не засоряет лог ошибок', async () => {
      const { POST } = await loadRoute()

      const response = await POST(makeRawRequest('{"name": ', { 'x-real-ip': '198.51.100.52' }))

      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: expect.any(String) })
      expect(loggerError).not.toHaveBeenCalled()
      expect(sendSmtpMail).not.toHaveBeenCalled()
    })

    it('самая большая законная заявка (все поля на максимуме, кириллица) проходит', async () => {
      const { POST } = await loadRoute()

      const attribution = Object.fromEntries(
        [
          'utm_source',
          'utm_medium',
          'utm_campaign',
          'utm_content',
          'utm_term',
          'yclid',
          'gclid',
          'first_utm_source',
          'first_utm_medium',
          'first_utm_campaign',
          'first_landing_path',
          'first_referrer',
          'first_touch_at',
          'extra',
        ].map(key => [key, 'я'.repeat(300)])
      )
      const biggest = {
        ...validLead,
        name: 'я'.repeat(100),
        company: 'я'.repeat(200),
        contact: `${'я'.repeat(20)}@example.com`,
        comment: 'я'.repeat(2000),
        briefUrl: `https://disk.yandex.ru/d/${'a'.repeat(450)}`,
        clientId: '1'.repeat(100),
        attribution,
        landingPath: `/${'я'.repeat(499)}`,
        referrer: `https://yandex.ru/${'я'.repeat(480)}`,
      }
      const size = new TextEncoder().encode(JSON.stringify(biggest)).byteLength
      // Заявка заметно больше обычной, но с большим запасом под потолком в 64 КБ
      expect(size).toBeGreaterThan(10 * 1024)
      expect(size).toBeLessThan(32 * 1024)

      const response = await POST(makeRequest(biggest, '198.51.100.53'))

      expect(response.status).toBe(200)
      expect(sendSmtpMail).toHaveBeenCalledTimes(1)
    })

    it('длинное ТЗ, вставленное в комментарий, принимается и обрезается до 2000 знаков', async () => {
      const { POST } = await loadRoute()

      // ~40 КБ кириллицы: в поле на форме maxLength нет, человек может вставить документ
      const pasted = 'ж'.repeat(20_000)
      const response = await POST(makeRequest({ ...validLead, comment: pasted }, '198.51.100.54'))

      expect(response.status).toBe(200)
      const html = sendSmtpMail.mock.calls[0]![0].html as string
      expect(html).toContain('ж'.repeat(2000))
      expect(html).not.toContain('ж'.repeat(2001))
    })
  })

  describe('ссылка на бриф', () => {
    async function submitWithBriefUrl(briefUrl: string) {
      process.env.LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/lead'
      process.env.TELEGRAM_BOT_TOKEN = 'bot-token'
      process.env.TELEGRAM_CHAT_ID = 'chat-id'
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
      vi.stubGlobal('fetch', fetchMock)

      const { POST } = await loadRoute()
      const response = await POST(makeRequest({ ...validLead, briefUrl }, '198.51.100.60'))

      const payload = JSON.parse(fetchMock.mock.calls[0]![1].body as string)
      vi.unstubAllGlobals()
      return {
        response,
        html: sendSmtpMail.mock.calls[0]![0].html as string,
        telegram: sendTelegramMessage.mock.calls[0]![0] as string,
        briefUrlInPayload: payload.brief_url as string | null,
      }
    }

    it('ссылка с логином (подмена домена студии) отбрасывается везде, заявка принимается', async () => {
      const { response, html, telegram, briefUrlInPayload } = await submitWithBriefUrl(
        'https://savagemovie.ru@evil.example/brief.pdf'
      )

      expect(response.status).toBe(200)
      expect(html).not.toContain('evil.example')
      expect(html).not.toContain('Бриф:')
      expect(telegram).not.toContain('evil.example')
      expect(briefUrlInPayload).toBeNull()
    })

    it.each([
      ['Яндекс.Диск', 'https://disk.yandex.ru/d/AbCdEf123'],
      ['Google Drive', 'https://drive.google.com/drive/folders/1AbC_dEf?usp=sharing'],
      ['Dropbox', 'https://www.dropbox.com/scl/fo/xyz123/h?rlkey=abc&dl=0'],
      ['WeTransfer', 'https://we.tl/t-AbCdEf1234'],
      ['http без TLS', 'http://files.example.com/brief.pdf'],
    ])('обычная ссылка (%s) доходит до письма, Telegram и n8n', async (_label, url) => {
      const { response, html, telegram, briefUrlInPayload } = await submitWithBriefUrl(url)

      expect(response.status).toBe(200)
      // В HTML амперсанд экранируется, в Telegram и n8n уходит как есть
      expect(html).toContain(`href="${url.replace(/&/g, '&amp;')}"`)
      expect(telegram).toContain(url)
      expect(briefUrlInPayload).toBe(url)
    })
  })
})
