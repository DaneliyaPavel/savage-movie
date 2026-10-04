/**
 * API route подписки на рассылку.
 *
 * Адрес сохраняется в БД проекта (таблица newsletter_subscribers) — это и есть
 * список рассылки. Дополнительно уходит уведомление в Telegram и на почту,
 * чтобы новую подписку было видно сразу, без похода в базу.
 */
import { NextRequest, NextResponse } from 'next/server'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'
import { sendEmail } from '@/lib/integrations/resend/client'
import { isSmtpConfigured, sendSmtpMail } from '@/lib/integrations/smtp/client'
import {
  escapeTelegram,
  isTelegramConfigured,
  sendTelegramMessage,
} from '@/lib/integrations/telegram/client'
import { getClientIp, UNKNOWN_CLIENT_IP } from '@/lib/leads/client-ip'
import { mailtoHref } from '@/lib/leads/mailto'
import { readJsonBody } from '@/lib/leads/read-json-body'
import { logger } from '@/lib/utils/logger'

const API_URL = serverEnv.API_URL || publicEnv.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

/** Почта, на которую падают уведомления с сайта */
const CONTACT_EMAIL = process.env.ADMIN_EMAIL || 'hello@savagemovie.ru'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Потолок тела запроса. nginx уже режет /api/subscribe на 16 КБ; настоящая
 * подписка весит меньше килобайта (email до 200 знаков, источник и язык),
 * так что порог приложения ничего не меняет для корректных запросов.
 */
const MAX_BODY_BYTES = 32 * 1024

/** Бэкенд не должен держать запрос: человек ждёт ответ формы */
const BACKEND_TIMEOUT_MS = 5000

/** Результат сохранения в БД. failed — база недоступна, адрес спасаем уведомлением. */
type StoreResult = 'created' | 'duplicate' | 'failed'

interface SubscribeBody {
  email?: unknown
  source?: unknown
  language?: unknown
}

function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, maxLength).trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatSubmittedAt(): string {
  return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
}

async function storeSubscriber(
  email: string,
  source: string,
  language: string,
  clientIp: string
): Promise<StoreResult> {
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL

  // Лимит подписки в бэкенде считается по IP. Бэкенд видит только адрес контейнера Next,
  // поэтому настоящий адрес (его выставил nginx) передаём в X-Real-IP: бэкенд верит ему
  // только от пира во внутренней сети. Иначе все посетители делили бы один лимит 5/мин.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (clientIp !== UNKNOWN_CLIENT_IP) headers['X-Real-IP'] = clientIp

  try {
    const response = await fetch(`${baseUrl}/api/newsletter/subscribe`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, source, language }),
      cache: 'no-store',
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })

    if (!response.ok) {
      logger.error('Бэкенд отклонил подписку', null, {
        route: '/api/subscribe',
        status: response.status,
      })
      return 'failed'
    }

    const data: { already_subscribed?: boolean } = await response.json()
    return data.already_subscribed ? 'duplicate' : 'created'
  } catch (error: unknown) {
    logger.error('Не удалось сохранить подписчика', error, { route: '/api/subscribe' })
    return 'failed'
  }
}

/**
 * Уведомление о новой подписке. Возвращает true, если хотя бы один канал
 * доставил сообщение — тогда адрес не потерян даже при недоступной базе.
 */
async function notify(email: string, source: string, stored: StoreResult): Promise<boolean> {
  const subject = `Новая подписка на рассылку — ${email}`.replace(/[\r\n]/g, ' ')

  const warning =
    stored === 'failed'
      ? '<p style="color:#c00"><strong>Внимание:</strong> адрес не сохранён в базе, добавьте вручную.</p>'
      : ''

  // Ссылка только для безопасного адреса: «?bcc=…» в mailto подмешивает чужих получателей
  const emailHref = mailtoHref(email)
  const emailHtml = escapeHtml(email)

  const html = [
    '<h2>Новая подписка на рассылку</h2>',
    `<p><strong>Email:</strong> ${
      emailHref ? `<a href="${escapeHtml(emailHref)}">${emailHtml}</a>` : emailHtml
    }</p>`,
    `<p><strong>Источник:</strong> ${escapeHtml(source)}</p>`,
    warning,
    `<p style="color:#888"><small>Отправлено: ${escapeHtml(formatSubmittedAt())}</small></p>`,
  ].join('')

  const telegramLines = [
    '📬 <b>Новая подписка на рассылку</b>',
    '',
    `✉️ <b>Email:</b> ${escapeTelegram(email)}`,
    `📍 <b>Источник:</b> ${escapeTelegram(source)}`,
  ]

  if (stored === 'failed') {
    telegramLines.push('', '⚠️ <b>Адрес не сохранён в базе — добавьте вручную</b>')
  }

  telegramLines.push('', `🕐 ${escapeTelegram(formatSubmittedAt())}`)

  const deliveries: Array<{ channel: string; promise: Promise<unknown> }> = []

  if (isSmtpConfigured()) {
    deliveries.push({
      channel: 'smtp',
      promise: sendSmtpMail({ to: CONTACT_EMAIL, subject, html, replyTo: email }),
    })
  }

  if (process.env.RESEND_API_KEY) {
    deliveries.push({
      channel: 'email',
      promise: sendEmail({ to: CONTACT_EMAIL, subject, html, replyTo: email }),
    })
  }

  if (isTelegramConfigured()) {
    deliveries.push({
      channel: 'telegram',
      promise: sendTelegramMessage(telegramLines.join('\n')),
    })
  }

  if (deliveries.length === 0) return false

  const results = await Promise.allSettled(deliveries.map(delivery => delivery.promise))

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error('Не удалось доставить уведомление о подписке', result.reason, {
        route: '/api/subscribe',
        channel: deliveries[index]?.channel ?? 'unknown',
      })
    }
  })

  return results.some(result => result.status === 'fulfilled')
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await readJsonBody(request, MAX_BODY_BYTES)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    }
    const body = parsed.body as SubscribeBody

    const email = sanitizeString(body.email, 200).toLowerCase()
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
    }

    const source = sanitizeString(body.source, 64) || 'site'
    const language = sanitizeString(body.language, 8) || 'ru'

    const stored = await storeSubscriber(email, source, language, getClientIp(request.headers))

    // Повторную подписку не рассылаем уведомлениями — это шум.
    if (stored === 'duplicate') {
      return NextResponse.json({ success: true, alreadySubscribed: true })
    }

    const notified = await notify(email, source, stored)

    if (stored === 'failed' && !notified) {
      return NextResponse.json({ error: 'Сервис временно недоступен' }, { status: 500 })
    }

    return NextResponse.json({ success: true, alreadySubscribed: false })
  } catch (error: unknown) {
    logger.error('Ошибка обработки подписки', error, { route: '/api/subscribe', method: 'POST' })
    return NextResponse.json({ error: 'Не удалось оформить подписку' }, { status: 500 })
  }
}
