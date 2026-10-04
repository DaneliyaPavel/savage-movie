// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMail = vi.fn()
const createTransport = vi.fn(() => ({ sendMail }))

vi.mock('nodemailer', () => ({
  default: { createTransport: (...args: unknown[]) => (createTransport as never)(...args) },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

describe('smtp client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.SMTP_HOST = 'smtp.yandex.ru'
    process.env.SMTP_USER = 'hello@savagemovie.ru'
    process.env.SMTP_PASSWORD = 'app-password'
    delete process.env.SMTP_PORT
    delete process.env.SMTP_FROM
    sendMail.mockResolvedValue({ messageId: 'smtp_1' })
  })

  it('создаёт транспорт с таймаутами, чтобы зависший SMTP не держал ответ формы', async () => {
    const { sendSmtpMail } = await import('../client')

    await sendSmtpMail({ to: 'hello@savagemovie.ru', subject: 'Тема', html: '<p>x</p>' })

    expect(createTransport).toHaveBeenCalledTimes(1)
    const options = (createTransport.mock.calls[0] as unknown as [Record<string, unknown>])[0]
    expect(options).toMatchObject({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: { user: 'hello@savagemovie.ru', pass: 'app-password' },
      dnsTimeout: expect.any(Number),
      connectionTimeout: expect.any(Number),
      greetingTimeout: expect.any(Number),
      socketTimeout: expect.any(Number),
    })
  })

  it('типичный зависший случай укладывается в минуту, которую nginx ждёт приложение', async () => {
    const { SMTP_TIMEOUTS } = await import('../client')

    // DNS + до трёх адресов хоста по таймауту соединения + приветствие
    const hungConnect =
      SMTP_TIMEOUTS.dnsTimeout + 3 * SMTP_TIMEOUTS.connectionTimeout + SMTP_TIMEOUTS.greetingTimeout
    // DNS + соединение + приветствие + простой посреди диалога
    const hungDialogue =
      SMTP_TIMEOUTS.dnsTimeout +
      SMTP_TIMEOUTS.connectionTimeout +
      SMTP_TIMEOUTS.greetingTimeout +
      SMTP_TIMEOUTS.socketTimeout

    expect(hungConnect).toBeLessThan(60_000)
    expect(hungDialogue).toBeLessThan(60_000)
    // Но не настолько жёстко, чтобы ложно рвать живой SMTP при заминке в пару секунд
    expect(SMTP_TIMEOUTS.connectionTimeout).toBeGreaterThanOrEqual(5_000)
    expect(SMTP_TIMEOUTS.greetingTimeout).toBeGreaterThanOrEqual(5_000)
    expect(SMTP_TIMEOUTS.socketTimeout).toBeGreaterThanOrEqual(15_000)
  })

  it('отправка не изменилась: получатель, тема без переводов строк и Reply-To', async () => {
    const { sendSmtpMail } = await import('../client')

    await sendSmtpMail({
      to: 'hello@savagemovie.ru',
      subject: 'Заявка\r\nBcc: attacker@evil.example',
      html: '<p>x</p>',
      replyTo: 'client@example.com',
    })

    expect(sendMail).toHaveBeenCalledWith({
      from: 'hello@savagemovie.ru',
      to: 'hello@savagemovie.ru',
      subject: 'Заявка  Bcc: attacker@evil.example',
      html: '<p>x</p>',
      replyTo: 'client@example.com',
    })
  })

  it('не настроенный SMTP по-прежнему определяется до отправки', async () => {
    delete process.env.SMTP_PASSWORD
    const { isSmtpConfigured } = await import('../client')

    expect(isSmtpConfigured()).toBe(false)
  })
})
