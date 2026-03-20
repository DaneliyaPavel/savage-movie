/**
 * API route для обработки контактной формы
 * Отправляет заявку в Telegram бота
 */
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

interface ContactFormBody {
  name?: unknown
  phone?: unknown
  company?: unknown
  message?: unknown
  budget?: unknown
  projectType?: unknown
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

function sanitizeString(value: unknown, maxLength: number = 1000): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, maxLength).trim()
}

function formatBudgetRu(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}М ₽`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}К ₽`
  return `${value} ₽`
}

function buildTelegramMessage(data: {
  name: string
  phone: string
  company: string | null
  message: string
  budget: number | null
  projectType: string | null
}): string {
  const lines: string[] = [
    '📩 *Новая заявка с сайта*',
    '',
    `👤 *Имя:* ${escapeMarkdown(data.name)}`,
    `📱 *Телефон:* ${escapeMarkdown(data.phone)}`,
  ]

  if (data.company) {
    lines.push(`🏢 *Компания:* ${escapeMarkdown(data.company)}`)
  }

  if (data.projectType) {
    const label = PROJECT_TYPE_LABELS[data.projectType] || data.projectType
    lines.push(`🎬 *Тип проекта:* ${escapeMarkdown(label)}`)
  }

  if (data.budget !== null) {
    lines.push(`💰 *Бюджет:* ${escapeMarkdown(formatBudgetRu(data.budget))}`)
  }

  if (data.message) {
    lines.push('', `💬 *Сообщение:*`, escapeMarkdown(data.message))
  }

  lines.push('', `🕐 ${escapeMarkdown(new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }))}`)

  return lines.join('\n')
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
}

async function sendTelegramMessage(text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'MarkdownV2',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${response.status} ${error}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      logger.error('Telegram credentials not configured', null, { route: '/api/contact' })
      return NextResponse.json({ error: 'Сервис временно недоступен' }, { status: 500 })
    }

    const body: ContactFormBody = await request.json()
    const { name, phone, company, message, budget, projectType } = body

    // Валидация обязательных полей
    if (!name || !phone) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
    }

    const sanitizedName = sanitizeString(name, 100)
    const sanitizedPhone = sanitizeString(phone, 20)
    const sanitizedCompany = company ? sanitizeString(company, 200) : null
    const sanitizedMessage = sanitizeString(message, 2000)

    if (!sanitizedName || sanitizedName.length < 2) {
      return NextResponse.json({ error: 'Имя должно содержать минимум 2 символа' }, { status: 400 })
    }

    if (!sanitizedPhone || sanitizedPhone.length < 5) {
      return NextResponse.json({ error: 'Введите корректный номер телефона' }, { status: 400 })
    }

    // Валидация бюджета
    let sanitizedBudget: number | null = null
    if (budget !== undefined && budget !== null) {
      const budgetNum = typeof budget === 'number' ? budget : Number(budget)
      if (!isNaN(budgetNum) && budgetNum >= 0 && budgetNum <= 100000000) {
        sanitizedBudget = Math.floor(budgetNum)
      }
    }

    const sanitizedProjectType = projectType && typeof projectType === 'string'
      ? sanitizeString(projectType, 50)
      : null

    const telegramMessage = buildTelegramMessage({
      name: sanitizedName,
      phone: sanitizedPhone,
      company: sanitizedCompany,
      message: sanitizedMessage,
      budget: sanitizedBudget,
      projectType: sanitizedProjectType,
    })

    await sendTelegramMessage(telegramMessage)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    logger.error('Ошибка отправки заявки в Telegram', error, { route: '/api/contact', method: 'POST' })
    return NextResponse.json({ error: 'Ошибка отправки заявки' }, { status: 500 })
  }
}
