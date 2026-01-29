/**
 * API route для обработки контактной формы
 * Перенаправляет запрос на Python API
 */
import { NextRequest, NextResponse } from 'next/server'
import { apiPost } from '@/lib/api/server'
import { logger } from '@/lib/utils/logger'

interface ContactFormBody {
  name?: unknown
  email?: unknown
  phone?: unknown
  message?: unknown
  budget?: unknown
}

// Валидация email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Валидация строки: ограничение длины и очистка пробелов
function sanitizeString(value: unknown, maxLength: number = 1000): string {
  if (typeof value !== 'string') {
    return ''
  }
  // Ограничиваем длину и удаляем лишние пробелы
  return value.slice(0, maxLength).trim()
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormBody = await request.json()
    const { name, email, phone, message, budget } = body

    // Валидация обязательных полей
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
    }

    // Валидация и санитизация данных
    const sanitizedName = sanitizeString(name, 100)
    const sanitizedEmail = sanitizeString(email, 255)
    const sanitizedMessage = sanitizeString(message, 2000)
    const sanitizedPhone = phone ? sanitizeString(phone, 20) : null

    if (!sanitizedName || sanitizedName.length < 2) {
      return NextResponse.json({ error: 'Имя должно содержать минимум 2 символа' }, { status: 400 })
    }

    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json({ error: 'Некорректный email адрес' }, { status: 400 })
    }

    if (!sanitizedMessage || sanitizedMessage.length < 10) {
      return NextResponse.json(
        { error: 'Сообщение должно содержать минимум 10 символов' },
        { status: 400 }
      )
    }

    // Валидация бюджета
    let sanitizedBudget: number | null = null
    if (budget !== undefined && budget !== null) {
      const budgetNum = typeof budget === 'number' ? budget : Number(budget)
      if (!isNaN(budgetNum) && budgetNum >= 0 && budgetNum <= 100000000) {
        sanitizedBudget = Math.floor(budgetNum)
      }
    }

    // Отправляем на Python API
    try {
      await apiPost(
        '/api/contact',
        {
          name: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          message: sanitizedMessage,
          budget: sanitizedBudget,
        },
        request.cookies
      )

      return NextResponse.json({ success: true })
    } catch (apiError: unknown) {
      logger.error('Ошибка отправки на API', apiError, { route: '/api/contact', method: 'POST' })
      return NextResponse.json({ error: 'Ошибка обработки заявки' }, { status: 500 })
    }
  } catch (error: unknown) {
    logger.error('Ошибка обработки заявки', error, { route: '/api/contact', method: 'POST' })
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
