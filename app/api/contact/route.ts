/**
 * API route для обработки контактной формы
 * Основной канал — email на hello@savagemovie.ru (Resend).
 * Telegram — дополнительный канал, работает только если настроен.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/integrations/resend/client'
import { logger } from '@/lib/utils/logger'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

/** Почта, на которую падают все заявки с сайта */
const DEFAULT_CONTACT_EMAIL = 'hello@savagemovie.ru'
const CONTACT_EMAIL = process.env.ADMIN_EMAIL || DEFAULT_CONTACT_EMAIL

interface ContactFormBody {
  name?: unknown
  email?: unknown
  phone?: unknown
  company?: unknown
  message?: unknown
  budget?: unknown
  projectType?: unknown
}

interface ContactSubmission {
  name: string
  email: string | null
  phone: string | null
  company: string | null
  message: string
  budget: number | null
  projectType: string | null
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  commercial: 'Коммерция',
  musicVideo: 'Клип',
  documentary: 'Документалка',
  brandFilm: 'Бренд-фильм',
  ai: 'AI-проект',
  course: 'Обучение',
  other: 'Другое',
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitizeString(value: unknown, maxLength: number = 1000): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, maxLength).trim()
}

function formatBudgetRu(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}М ₽`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}К ₽`
  return `${value} ₽`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function projectTypeLabel(projectType: string): string {
  return PROJECT_TYPE_LABELS[projectType] || projectType
}

function formatSubmittedAt(): string {
  return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
}

function buildEmailHtml(data: ContactSubmission): string {
  const rows: string[] = [`<p><strong>Имя:</strong> ${escapeHtml(data.name)}</p>`]

  if (data.phone) {
    rows.push(`<p><strong>Телефон:</strong> ${escapeHtml(data.phone)}</p>`)
  }

  if (data.email) {
    rows.push(
      `<p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(
        data.email
      )}</a></p>`
    )
  }

  if (data.company) {
    rows.push(`<p><strong>Компания:</strong> ${escapeHtml(data.company)}</p>`)
  }

  if (data.projectType) {
    rows.push(`<p><strong>Тип проекта:</strong> ${escapeHtml(projectTypeLabel(data.projectType))}</p>`)
  }

  if (data.budget !== null) {
    rows.push(`<p><strong>Бюджет:</strong> ${escapeHtml(formatBudgetRu(data.budget))}</p>`)
  }

  if (data.message) {
    rows.push(
      `<p><strong>Сообщение:</strong></p><p>${escapeHtml(data.message).replace(/\n/g, '<br />')}</p>`
    )
  }

  rows.push(`<p style="color:#888"><small>Отправлено: ${escapeHtml(formatSubmittedAt())}</small></p>`)

  return `<h2>Новая заявка с сайта</h2>${rows.join('')}`
}

function buildTelegramMessage(data: ContactSubmission): string {
  const lines: string[] = [
    '📩 <b>Новая заявка с сайта</b>',
    '',
    `👤 <b>Имя:</b> ${escapeHtml(data.name)}`,
  ]

  if (data.phone) {
    lines.push(`📱 <b>Телефон:</b> ${escapeHtml(data.phone)}`)
  }

  if (data.email) {
    lines.push(`✉️ <b>Email:</b> ${escapeHtml(data.email)}`)
  }

  if (data.company) {
    lines.push(`🏢 <b>Компания:</b> ${escapeHtml(data.company)}`)
  }

  if (data.projectType) {
    lines.push(`🎬 <b>Тип проекта:</b> ${escapeHtml(projectTypeLabel(data.projectType))}`)
  }

  if (data.budget !== null) {
    lines.push(`💰 <b>Бюджет:</b> ${escapeHtml(formatBudgetRu(data.budget))}`)
  }

  if (data.message) {
    lines.push('', `💬 <b>Сообщение:</b>`, escapeHtml(data.message))
  }

  lines.push('', `🕐 ${escapeHtml(formatSubmittedAt())}`)

  return lines.join('\n')
}

async function sendTelegramMessage(text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${response.status} ${error}`)
  }
}

/** Заголовок письма: сразу видно, от кого заявка */
function buildSubject(data: ContactSubmission): string {
  const parts = ['Новая заявка с сайта', data.name]
  if (data.projectType) parts.push(projectTypeLabel(data.projectType))
  return parts.join(' — ').replace(/[\r\n]/g, ' ')
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormBody = await request.json()
    const { name, email, phone, company, message, budget, projectType } = body

    const sanitizedName = sanitizeString(name, 100)
    const sanitizedPhone = sanitizeString(phone, 20)
    const rawEmail = sanitizeString(email, 200).toLowerCase()
    const sanitizedEmail = EMAIL_PATTERN.test(rawEmail) ? rawEmail : ''
    const sanitizedCompany = sanitizeString(company, 200)
    const sanitizedMessage = sanitizeString(message, 2000)

    if (!sanitizedName || sanitizedName.length < 2) {
      return NextResponse.json({ error: 'Имя должно содержать минимум 2 символа' }, { status: 400 })
    }

    // Формы на сайте различаются: где-то обязателен телефон, где-то email.
    // Достаточно любого рабочего контакта.
    const hasPhone = sanitizedPhone.length >= 5
    if (!hasPhone && !sanitizedEmail) {
      return NextResponse.json(
        { error: 'Укажите телефон или email для связи' },
        { status: 400 }
      )
    }

    let sanitizedBudget: number | null = null
    if (budget !== undefined && budget !== null) {
      const budgetNum = typeof budget === 'number' ? budget : Number(budget)
      if (!isNaN(budgetNum) && budgetNum >= 0 && budgetNum <= 100000000) {
        sanitizedBudget = Math.floor(budgetNum)
      }
    }

    const submission: ContactSubmission = {
      name: sanitizedName,
      email: sanitizedEmail || null,
      phone: hasPhone ? sanitizedPhone : null,
      company: sanitizedCompany || null,
      message: sanitizedMessage,
      budget: sanitizedBudget,
      projectType:
        projectType && typeof projectType === 'string' ? sanitizeString(projectType, 50) : null,
    }

    const deliveries: Array<{ channel: string; promise: Promise<unknown> }> = []

    if (process.env.RESEND_API_KEY) {
      deliveries.push({
        channel: 'email',
        promise: sendEmail({
          to: CONTACT_EMAIL,
          subject: buildSubject(submission),
          html: buildEmailHtml(submission),
          ...(submission.email ? { replyTo: submission.email } : {}),
        }),
      })
    }

    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      deliveries.push({
        channel: 'telegram',
        promise: sendTelegramMessage(buildTelegramMessage(submission)),
      })
    }

    if (deliveries.length === 0) {
      logger.error('Нет настроенных каналов доставки заявок', null, {
        route: '/api/contact',
        hint: 'Задайте RESEND_API_KEY (и опционально TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID)',
      })
      return NextResponse.json({ error: 'Сервис временно недоступен' }, { status: 500 })
    }

    const results = await Promise.allSettled(deliveries.map(delivery => delivery.promise))

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error('Не удалось доставить заявку', result.reason, {
          route: '/api/contact',
          channel: deliveries[index]?.channel ?? 'unknown',
        })
      }
    })

    const delivered = results.some(result => result.status === 'fulfilled')

    if (!delivered) {
      return NextResponse.json({ error: 'Ошибка отправки заявки' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Ошибка обработки заявки', error, { route: '/api/contact', method: 'POST' })
    return NextResponse.json({ error: 'Ошибка отправки заявки' }, { status: 500 })
  }
}
