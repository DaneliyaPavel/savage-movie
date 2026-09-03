/**
 * Заявка на предварительную смету с коммерческого лендинга /reklamny-rolik.
 *
 * Отдельный маршрут, а не /api/contact: у сметы своя структура (площадки,
 * сроки, диапазон бюджета, бриф) и обязательная рекламная атрибуция, которую
 * нельзя терять — по ней Директ сводит расход с заявками.
 *
 * Ответ success:true означает, что заявка реально доставлена хотя бы в один
 * канал. Только на этом ответе фронтенд засчитывает production_lead_success.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'

import { sendEmail } from '@/lib/integrations/resend/client'
import { isSmtpConfigured, sendSmtpMail } from '@/lib/integrations/smtp/client'
import {
  escapeTelegram,
  isTelegramConfigured,
  sendTelegramMessage,
} from '@/lib/integrations/telegram/client'
import { logger } from '@/lib/utils/logger'
import {
  DEFAULT_COMMERCIAL_LANDING,
  COMMERCIAL_LANDING_PATH,
} from '@/lib/commercial-landing/content'

const DEFAULT_CONTACT_EMAIL = 'hello@savagemovie.ru'
const CONTACT_EMAIL = process.env.ADMIN_EMAIL || DEFAULT_CONTACT_EMAIL

/** Внешний приёмник лидов (n8n). Не настроен — просто не используется */
const LEAD_WEBHOOK_URL = process.env.LEAD_WEBHOOK_URL || ''
const LEAD_WEBHOOK_TOKEN = process.env.LEAD_WEBHOOK_TOKEN || ''

/** Не больше пяти заявок с одного адреса в час */
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

/** Человек не заполняет два шага формы быстрее нескольких секунд */
const MIN_FILL_TIME_MS = 4000

/** Повтор той же заявки в этом окне считаем случайным дублем */
const DEDUPE_WINDOW_MS = 10 * 60 * 1000

/**
 * Счётчики живут в памяти процесса: приложение крутится одним контейнером,
 * а терять состояние при рестарте здесь не страшно — это защита от шума,
 * а не от целенаправленной атаки. Перед распределённым деплоем заменить на Redis.
 */
const rateLimitHits = new Map<string, number[]>()
const recentSubmissions = new Map<string, number>()

function pruneExpired(now: number): void {
  for (const [key, timestamps] of rateLimitHits) {
    const fresh = timestamps.filter(time => now - time < RATE_LIMIT_WINDOW_MS)
    if (fresh.length === 0) rateLimitHits.delete(key)
    else rateLimitHits.set(key, fresh)
  }
  for (const [key, time] of recentSubmissions) {
    if (now - time > DEDUPE_WINDOW_MS) recentSubmissions.delete(key)
  }
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

function isRateLimited(ip: string, now: number): boolean {
  const timestamps = rateLimitHits.get(ip) ?? []
  const fresh = timestamps.filter(time => now - time < RATE_LIMIT_WINDOW_MS)
  if (fresh.length >= RATE_LIMIT_MAX) {
    rateLimitHits.set(ip, fresh)
    return true
  }
  fresh.push(now)
  rateLimitHits.set(ip, fresh)
  return false
}

function sanitize(value: unknown, maxLength = 500): string {
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEGRAM_HANDLE_PATTERN = /^[a-zA-Z0-9_]{5,32}$/
/** Телефон: 5+ цифр, плюс, скобки, дефисы и пробелы */
const PHONE_PATTERN = /^[+()\-\s\d]{5,}$/

export type ContactKind = 'phone' | 'telegram' | 'email' | 'unknown'

/**
 * В форме одно поле «Телефон, Telegram или email»: заставлять человека
 * выбирать способ связи из списка — лишний шаг. Тип определяем сами.
 */
export function detectContactKind(raw: string): ContactKind {
  const value = raw.trim()
  if (!value) return 'unknown'
  if (EMAIL_PATTERN.test(value)) return 'email'

  const handle = value
    .replace(/^https?:\/\//i, '')
    .replace(/^t\.me\//i, '')
    .replace(/^@/, '')
  if (value.startsWith('@') || /^(https?:\/\/)?t\.me\//i.test(value)) {
    return TELEGRAM_HANDLE_PATTERN.test(handle) ? 'telegram' : 'unknown'
  }

  const digits = value.replace(/\D/g, '')
  if (PHONE_PATTERN.test(value) && digits.length >= 5) return 'phone'

  return TELEGRAM_HANDLE_PATTERN.test(handle) ? 'telegram' : 'unknown'
}

/** Ссылка на бриф принимается только по http(s) — javascript: в письмо не попадёт */
function sanitizeUrl(value: unknown): string {
  const raw = sanitize(value, 500)
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

const OPTION_LABELS = {
  projectType: new Map(
    DEFAULT_COMMERCIAL_LANDING.estimate.projectTypes.map(item => [item.value, item.label])
  ),
  usage: new Map(
    DEFAULT_COMMERCIAL_LANDING.estimate.usageOptions.map(item => [item.value, item.label])
  ),
  deadline: new Map(
    DEFAULT_COMMERCIAL_LANDING.estimate.deadlineOptions.map(item => [item.value, item.label])
  ),
  budget: new Map(
    DEFAULT_COMMERCIAL_LANDING.estimate.budgetOptions.map(item => [item.value, item.label])
  ),
}

function labelFor(map: Map<string, string>, value: string): string {
  return map.get(value) || value
}

interface EstimateLead {
  lead_id: string
  created_at: string
  name: string
  company: string | null
  contact: string
  contact_kind: ContactKind
  project_type: string | null
  usage: string[]
  deadline: string | null
  budget_range: string | null
  comment: string | null
  brief_url: string | null
  yclid: string | null
  gclid: string | null
  client_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  first_utm_source: string | null
  first_utm_medium: string | null
  first_utm_campaign: string | null
  first_landing_path: string | null
  first_referrer: string | null
  first_touch_at: string | null
  landing_path: string
  referrer: string | null
}

function attributionRows(lead: EstimateLead): Array<[string, string | null]> {
  return [
    ['Источник (utm_source)', lead.utm_source],
    ['Канал (utm_medium)', lead.utm_medium],
    ['Кампания (utm_campaign)', lead.utm_campaign],
    ['Объявление (utm_content)', lead.utm_content],
    ['Ключ (utm_term)', lead.utm_term],
    ['yclid', lead.yclid],
    ['gclid', lead.gclid],
    ['ClientID Метрики', lead.client_id],
    ['Первый источник', lead.first_utm_source],
    ['Первый заход', lead.first_landing_path],
    ['Реферер', lead.referrer],
  ]
}

function buildEmailHtml(lead: EstimateLead): string {
  const rows: string[] = [
    `<p><strong>Имя:</strong> ${escapeHtml(lead.name)}</p>`,
    `<p><strong>Контакт:</strong> ${escapeHtml(lead.contact)}</p>`,
  ]

  if (lead.company) rows.push(`<p><strong>Компания:</strong> ${escapeHtml(lead.company)}</p>`)
  if (lead.project_type) {
    rows.push(
      `<p><strong>Задача:</strong> ${escapeHtml(labelFor(OPTION_LABELS.projectType, lead.project_type))}</p>`
    )
  }
  if (lead.usage.length > 0) {
    const usage = lead.usage.map(value => labelFor(OPTION_LABELS.usage, value)).join(', ')
    rows.push(`<p><strong>Площадки:</strong> ${escapeHtml(usage)}</p>`)
  }
  if (lead.deadline) {
    rows.push(
      `<p><strong>Сроки:</strong> ${escapeHtml(labelFor(OPTION_LABELS.deadline, lead.deadline))}</p>`
    )
  }
  if (lead.budget_range) {
    rows.push(
      `<p><strong>Бюджет:</strong> ${escapeHtml(labelFor(OPTION_LABELS.budget, lead.budget_range))}</p>`
    )
  }
  if (lead.brief_url) {
    rows.push(
      `<p><strong>Бриф:</strong> <a href="${escapeHtml(lead.brief_url)}">${escapeHtml(lead.brief_url)}</a></p>`
    )
  }
  if (lead.comment) {
    rows.push(
      `<p><strong>Комментарий:</strong></p><p>${escapeHtml(lead.comment).replace(/\n/g, '<br />')}</p>`
    )
  }

  const attribution = attributionRows(lead)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, value]) => `<li>${escapeHtml(label)}: ${escapeHtml(value)}</li>`)
    .join('')

  const attributionBlock = attribution
    ? `<h3>Атрибуция</h3><ul style="color:#555">${attribution}</ul>`
    : '<p style="color:#888"><small>Рекламных меток нет — прямой или органический заход.</small></p>'

  return [
    '<h2>Заявка на предварительную смету</h2>',
    `<p style="color:#888"><small>Лендинг: ${escapeHtml(lead.landing_path)} · ID: ${escapeHtml(lead.lead_id)}</small></p>`,
    rows.join(''),
    attributionBlock,
  ].join('')
}

function buildTelegramMessage(lead: EstimateLead): string {
  const lines: string[] = [
    '🎬 <b>Заявка на смету — рекламный ролик</b>',
    '',
    `👤 <b>Имя:</b> ${escapeTelegram(lead.name)}`,
    `📞 <b>Контакт:</b> ${escapeTelegram(lead.contact)}`,
  ]

  if (lead.company) lines.push(`🏢 <b>Компания:</b> ${escapeTelegram(lead.company)}`)
  if (lead.project_type) {
    lines.push(
      `🎯 <b>Задача:</b> ${escapeTelegram(labelFor(OPTION_LABELS.projectType, lead.project_type))}`
    )
  }
  if (lead.usage.length > 0) {
    lines.push(
      `📺 <b>Площадки:</b> ${escapeTelegram(
        lead.usage.map(value => labelFor(OPTION_LABELS.usage, value)).join(', ')
      )}`
    )
  }
  if (lead.deadline) {
    lines.push(`🗓 <b>Сроки:</b> ${escapeTelegram(labelFor(OPTION_LABELS.deadline, lead.deadline))}`)
  }
  if (lead.budget_range) {
    lines.push(
      `💰 <b>Бюджет:</b> ${escapeTelegram(labelFor(OPTION_LABELS.budget, lead.budget_range))}`
    )
  }
  if (lead.brief_url) lines.push(`📎 <b>Бриф:</b> ${escapeTelegram(lead.brief_url)}`)
  if (lead.comment) lines.push('', `💬 ${escapeTelegram(lead.comment)}`)

  const attribution = attributionRows(lead).filter((entry): entry is [string, string] =>
    Boolean(entry[1])
  )
  if (attribution.length > 0) {
    lines.push('', '📊 <b>Атрибуция</b>')
    for (const [label, value] of attribution) {
      lines.push(`${escapeTelegram(label)}: ${escapeTelegram(value)}`)
    }
  }

  lines.push('', `🕐 ${escapeTelegram(new Date(lead.created_at).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }))}`)

  return lines.join('\n')
}

/**
 * Отправка в n8n. Ошибка вебхука не должна отменять заявку: письмо и Telegram
 * уже ушли, а клиенту важен факт приёма, а не состояние нашей автоматизации.
 */
async function forwardToWebhook(lead: EstimateLead): Promise<void> {
  if (!LEAD_WEBHOOK_URL) return

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    await fetch(LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(LEAD_WEBHOOK_TOKEN ? { Authorization: `Bearer ${LEAD_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify(lead),
      signal: controller.signal,
    })
  } catch (error) {
    logger.error('Не удалось передать лид во внешний приёмник', error, {
      route: '/api/estimate',
      lead_id: lead.lead_id,
    })
  } finally {
    clearTimeout(timeout)
  }
}

interface EstimateBody {
  name?: unknown
  company?: unknown
  contact?: unknown
  projectType?: unknown
  usage?: unknown
  deadline?: unknown
  budgetRange?: unknown
  comment?: unknown
  briefUrl?: unknown
  consent?: unknown
  /** Honeypot: поле скрыто от людей, боты его заполняют */
  website?: unknown
  /** Сколько миллисекунд человек провёл в форме */
  elapsedMs?: unknown
  clientId?: unknown
  attribution?: unknown
  landingPath?: unknown
  referrer?: unknown
}

function pickAttribution(value: unknown): Record<string, string | null> {
  if (typeof value !== 'object' || value === null) return {}
  const source = value as Record<string, unknown>
  const result: Record<string, string | null> = {}
  for (const [key, raw] of Object.entries(source)) {
    const clean = sanitize(raw, 300)
    result[key] = clean || null
  }
  return result
}

export async function POST(request: NextRequest) {
  const now = Date.now()
  pruneExpired(now)

  try {
    const body: EstimateBody = await request.json()

    // Honeypot: молча отвечаем успехом, чтобы бот не подбирал обход
    if (sanitize(body.website, 100)) {
      logger.warn('Заявка отсеяна honeypot', { route: '/api/estimate' })
      return NextResponse.json({ success: true })
    }

    const elapsedMs = typeof body.elapsedMs === 'number' ? body.elapsedMs : 0
    if (elapsedMs < MIN_FILL_TIME_MS) {
      logger.warn('Заявка отсеяна по времени заполнения', {
        route: '/api/estimate',
        elapsedMs,
      })
      return NextResponse.json({ success: true })
    }

    if (body.consent !== true) {
      return NextResponse.json(
        { error: 'Нужно согласие на обработку персональных данных' },
        { status: 400 }
      )
    }

    const ip = clientIp(request)
    if (isRateLimited(ip, now)) {
      return NextResponse.json(
        { error: 'Слишком много заявок. Напишите нам в Telegram или на почту.' },
        { status: 429 }
      )
    }

    const name = sanitize(body.name, 100)
    if (name.length < 2) {
      return NextResponse.json({ error: 'Укажите, как к вам обращаться' }, { status: 400 })
    }

    const contact = sanitize(body.contact, 200)
    const contactKind = detectContactKind(contact)
    if (contactKind === 'unknown') {
      return NextResponse.json(
        { error: 'Укажите телефон, Telegram или email — по нему и ответим' },
        { status: 400 }
      )
    }

    const usage = Array.isArray(body.usage)
      ? Array.from(
          new Set(
            body.usage
              .map(item => sanitize(item, 40))
              .filter(item => OPTION_LABELS.usage.has(item))
          )
        )
      : []

    const projectTypeRaw = sanitize(body.projectType, 40)
    const deadlineRaw = sanitize(body.deadline, 40)
    const budgetRaw = sanitize(body.budgetRange, 40)

    const attribution = pickAttribution(body.attribution)

    const lead: EstimateLead = {
      lead_id: randomUUID(),
      created_at: new Date(now).toISOString(),
      name,
      company: sanitize(body.company, 200) || null,
      contact,
      contact_kind: contactKind,
      project_type: OPTION_LABELS.projectType.has(projectTypeRaw) ? projectTypeRaw : null,
      usage,
      deadline: OPTION_LABELS.deadline.has(deadlineRaw) ? deadlineRaw : null,
      budget_range: OPTION_LABELS.budget.has(budgetRaw) ? budgetRaw : null,
      comment: sanitize(body.comment, 2000) || null,
      brief_url: sanitizeUrl(body.briefUrl) || null,
      client_id: sanitize(body.clientId, 100) || null,
      yclid: attribution.yclid ?? null,
      gclid: attribution.gclid ?? null,
      utm_source: attribution.utm_source ?? null,
      utm_medium: attribution.utm_medium ?? null,
      utm_campaign: attribution.utm_campaign ?? null,
      utm_content: attribution.utm_content ?? null,
      utm_term: attribution.utm_term ?? null,
      first_utm_source: attribution.first_utm_source ?? null,
      first_utm_medium: attribution.first_utm_medium ?? null,
      first_utm_campaign: attribution.first_utm_campaign ?? null,
      first_landing_path: attribution.first_landing_path ?? null,
      first_referrer: attribution.first_referrer ?? null,
      first_touch_at: attribution.first_touch_at ?? null,
      landing_path: sanitize(body.landingPath, 500) || COMMERCIAL_LANDING_PATH,
      referrer: sanitize(body.referrer, 500) || null,
    }

    // Дубль: тот же контакт с тем же содержанием в коротком окне.
    // Отвечаем успехом — для человека это та же принятая заявка.
    const fingerprint = createHash('sha256')
      .update([lead.contact, lead.project_type, lead.budget_range, lead.comment].join('|'))
      .digest('hex')

    const previous = recentSubmissions.get(fingerprint)
    if (previous && now - previous < DEDUPE_WINDOW_MS) {
      logger.warn('Повторная заявка в окне дедупликации', {
        route: '/api/estimate',
        lead_id: lead.lead_id,
      })
      return NextResponse.json({ success: true, duplicate: true })
    }

    const deliveries: Array<{ channel: string; promise: Promise<unknown> }> = []
    const subject = `Смета — ${lead.name}${lead.company ? ` (${lead.company})` : ''}`.replace(
      /[\r\n]/g,
      ' '
    )
    const html = buildEmailHtml(lead)
    const replyTo = contactKind === 'email' ? { replyTo: lead.contact } : {}

    if (isSmtpConfigured()) {
      deliveries.push({
        channel: 'smtp',
        promise: sendSmtpMail({ to: CONTACT_EMAIL, subject, html, ...replyTo }),
      })
    }

    if (process.env.RESEND_API_KEY) {
      deliveries.push({
        channel: 'email',
        promise: sendEmail({ to: CONTACT_EMAIL, subject, html, ...replyTo }),
      })
    }

    if (isTelegramConfigured()) {
      deliveries.push({
        channel: 'telegram',
        promise: sendTelegramMessage(buildTelegramMessage(lead)),
      })
    }

    if (deliveries.length === 0) {
      logger.error('Нет настроенных каналов доставки заявок', null, {
        route: '/api/estimate',
        hint: 'Задайте SMTP_HOST/SMTP_USER/SMTP_PASSWORD или TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID',
      })
      return NextResponse.json({ error: 'Сервис временно недоступен' }, { status: 500 })
    }

    const results = await Promise.allSettled(deliveries.map(delivery => delivery.promise))

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error('Не удалось доставить заявку', result.reason, {
          route: '/api/estimate',
          channel: deliveries[index]?.channel ?? 'unknown',
          lead_id: lead.lead_id,
        })
      }
    })

    if (!results.some(result => result.status === 'fulfilled')) {
      return NextResponse.json({ error: 'Ошибка отправки заявки' }, { status: 500 })
    }

    recentSubmissions.set(fingerprint, now)
    await forwardToWebhook(lead)

    return NextResponse.json({ success: true, leadId: lead.lead_id })
  } catch (error) {
    logger.error('Ошибка обработки заявки на смету', error, {
      route: '/api/estimate',
      method: 'POST',
    })
    return NextResponse.json({ error: 'Ошибка отправки заявки' }, { status: 500 })
  }
}
