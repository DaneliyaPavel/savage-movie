/**
 * Отправка почты через обычный SMTP (Яндекс 360).
 *
 * В отличие от Resend, не требует верификации домена у стороннего сервиса
 * и доступен с российского хостинга — поэтому это основной канал доставки
 * заявок с форм.
 */
import nodemailer, { type Transporter } from 'nodemailer'
import { logger } from '@/lib/utils/logger'

interface SmtpMailOptions {
  to: string | string[]
  subject: string
  html: string
  /** Текстовая версия письма: её читают почтовики без HTML и она удобна для копирования в CRM */
  text?: string
  from?: string
  replyTo?: string
}

/** SMTP настроен, только если заданы хост, логин и пароль */
export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

/**
 * Таймауты SMTP. По умолчанию у nodemailer соединение ждёт 2 минуты, приветствие
 * 30 секунд, а простой сокета 10 минут, DNS 30 секунд, и зависший SMTP держал
 * ответ формы дольше, чем nginx ждёт приложение (60 с): человек видел ошибку
 * для уже доставленной заявки и отправлял её повторно.
 *
 * Бюджет рассчитан так, чтобы типичный зависший случай укладывался в минуту:
 * - DNS 5 с + соединение 8 с (nodemailer пробует следующий адрес хоста, если
 *   первый не ответил, поэтому на два-три адреса выходит 16-24 с);
 * - приветствие после соединения 8 с;
 * - простой сокета посреди диалога 20 с.
 * Запас по сравнению с обычным временем (доли секунды на Яндекс 360) большой,
 * так что ложных отказов на живом SMTP быть не должно. Это только таймауты:
 * порядок отправки и ответ формы не менялись.
 */
export const SMTP_TIMEOUTS = {
  dnsTimeout: 5_000,
  connectionTimeout: 8_000,
  greetingTimeout: 8_000,
  socketTimeout: 20_000,
} as const

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    throw new Error('SMTP не настроен: нужны SMTP_HOST, SMTP_USER и SMTP_PASSWORD')
  }

  // 465 — неявный TLS, 587 — STARTTLS. По умолчанию берём 465, как у Яндекса.
  const port = Number(process.env.SMTP_PORT || 465)

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    ...SMTP_TIMEOUTS,
  })

  return transporter
}

function sanitizeSubject(value: string): string {
  return value.replace(/[\r\n]/g, ' ').trim()
}

/**
 * Отправляет письмо через SMTP.
 *
 * Яндекс требует, чтобы отправитель совпадал с аутентифицированным ящиком
 * или его алиасом, поэтому по умолчанию берём SMTP_USER.
 */
export async function sendSmtpMail(options: SmtpMailOptions) {
  const from = options.from || process.env.SMTP_FROM || process.env.SMTP_USER

  if (!from) {
    throw new Error('SMTP не настроен: не определён отправитель')
  }

  try {
    const info = await getTransporter().sendMail({
      from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: sanitizeSubject(options.subject),
      html: options.html,
      ...(options.text ? { text: options.text } : {}),
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    })

    return info
  } catch (error) {
    logger.error('Ошибка отправки письма через SMTP', error, {
      function: 'sendSmtpMail',
      host: process.env.SMTP_HOST,
      recipientCount: Array.isArray(options.to) ? options.to.length : 1,
    })
    throw error
  }
}
