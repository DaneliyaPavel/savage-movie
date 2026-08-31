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
  from?: string
  replyTo?: string
}

/** SMTP настроен, только если заданы хост, логин и пароль */
export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

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
