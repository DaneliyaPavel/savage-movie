/**
 * API route для обработки контактной формы
 * Перенаправляет запрос на Python API
 */
import { NextRequest, NextResponse } from 'next/server'
import { apiPost } from '@/lib/api/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, message, budget } = body

    // Валидация
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Заполните все обязательные поля' },
        { status: 400 }
      )
    }

    // Отправляем на Python API
    try {
      await apiPost(
        '/api/contact',
        {
          name: String(name),
          email: String(email),
          phone: phone ? String(phone) : null,
          message: String(message),
          budget: budget ? Number(budget) : null,
        },
        request.cookies
      )

      return NextResponse.json({ success: true })
    } catch (apiError: any) {
      console.error('Ошибка отправки на API:', apiError)
      return NextResponse.json(
        { error: apiError.message || 'Ошибка обработки заявки' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Ошибка обработки заявки:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
