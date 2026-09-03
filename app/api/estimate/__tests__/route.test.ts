/**
 * Заявка на смету — единственная конверсия коммерческого лендинга, поэтому
 * проверяем ровно те свойства, на которых держится доверие к цифрам:
 * успех только при реальной доставке, антиспам не пропускает ботов и
 * не режет людей, атрибуция доезжает до письма и до внешнего приёмника.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

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

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

/** Заявка приходит через nginx, поэтому адрес читается из x-forwarded-for */
function makeRequest(body: unknown, ip = '10.0.0.1'): NextRequest {
  return {
    json: async () => body,
    headers: new Headers({ 'x-forwarded-for': ip }),
  } as unknown as NextRequest
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

  it('падение внешнего приёмника не отменяет принятую заявку', async () => {
    process.env.LEAD_WEBHOOK_URL = 'https://n8n.example/webhook/lead'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('n8n down')))

    const { POST } = await loadRoute()
    const response = await POST(makeRequest(validLead))

    expect(response.status).toBe(200)
    vi.unstubAllGlobals()
  })
})
