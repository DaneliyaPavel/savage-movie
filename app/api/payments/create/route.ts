/**
 * API route для создания платежа через ЮKassa
 * Поддерживает авторизованных пользователей и гостей (guest: name, email, phone).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createPayment } from '@/lib/payments/yookassa'
import { logger } from '@/lib/utils/logger'
import { apiGet } from '@/lib/api/server'
import type { User } from '@/lib/api/auth'
import { publicEnv } from '@/lib/env'
import { createPaymentRequestSchema } from '@/lib/payments/create-payment-schema'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  let courseId: string | undefined
  try {
    const body = await request.json().catch(() => null)
    const parsed = createPaymentRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные параметры запроса' }, { status: 400 })
    }

    courseId = parsed.data.courseId
    const courseTitle = parsed.data.courseTitle
    const amount = parsed.data.amount
    const guest = parsed.data.guest

    if (!courseId || !amount) {
      return NextResponse.json({ error: 'Не указаны обязательные параметры' }, { status: 400 })
    }

    let metadata: Record<string, string> = {
      courseId,
      ...(courseTitle ? { courseTitle } : {}),
    }

    let user: User | null = null
    try {
      user = await apiGet<User>('/api/auth/me', request.cookies)
    } catch (authError) {
      // При наличии guest считаем пользователя незалогиненным и идём в оплату гостем
      if (guest) {
        user = null
      } else {
        const message = authError instanceof Error ? authError.message : String(authError)
        const isUnauthorized =
          message.toLowerCase().includes('авторизац') ||
          message.toLowerCase().includes('аутентификац') ||
          message.includes('401') ||
          message.toLowerCase().includes('unauthorized')
        if (isUnauthorized) {
          return NextResponse.json(
            { error: 'Требуется авторизация или заполнение формы' },
            { status: 401 }
          )
        }
        logger.error('Ошибка проверки авторизации', authError, { route: '/api/payments/create' })
        return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
      }
    }

    const requestId = randomUUID()
    if (user) {
      metadata.userId = user.id
      metadata.userEmail = user.email
      metadata.requestId = requestId
    } else if (guest) {
      metadata.userEmail = guest.email
      metadata.userName = guest.name
      metadata.userPhone = guest.phone
      metadata.requestId = requestId
    }

    let appUrl = publicEnv.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('NEXT_PUBLIC_APP_URL is not configured', null, {
          route: '/api/payments/create',
        })
        return NextResponse.json({ error: 'Ошибка конфигурации сервера' }, { status: 500 })
      }
      appUrl = 'http://localhost:3000'
    }
    const returnUrl = new URL('/payment/success', appUrl)
    returnUrl.searchParams.set('courseId', courseId)

    const payment = await createPayment(
      amount,
      `Оплата курса: ${courseTitle || 'Курс'}`,
      returnUrl.toString(),
      metadata
    )

    const paymentUrl = payment.confirmation?.confirmation_url
    if (!paymentUrl) {
      logger.error('Payment confirmation URL отсутствует', null, {
        route: '/api/payments/create',
        paymentId: payment.id,
        status: payment.status,
      })
      return NextResponse.json({ error: 'Не удалось получить ссылку на оплату' }, { status: 502 })
    }

    return NextResponse.json({
      paymentId: payment.id,
      paymentUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('Ошибка создания платежа', error, { route: '/api/payments/create', courseId })
    if (message.includes('credentials') || message.includes('не настроены') || message.includes('ЮKassa')) {
      return NextResponse.json(
        { error: 'Платёжная система временно недоступна. Обратитесь к администратору.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 })
  }
}
