/**
 * API route для создания платежа через ЮKassa
 */
import { NextRequest, NextResponse } from 'next/server'
import { createPayment } from '@/lib/payments/yookassa'
import { logger } from '@/lib/utils/logger'
import { apiGet } from '@/lib/api/server'
import type { User } from '@/lib/api/auth'
import { publicEnv } from '@/lib/env'
import { createPaymentRequestSchema } from '@/lib/payments/create-payment-schema'

export async function POST(request: NextRequest) {
  let courseId: string | undefined
  try {
    const body = await request.json().catch(() => null)
    const parsed = createPaymentRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Некорректные параметры запроса' },
        { status: 400 }
      )
    }

    courseId = parsed.data.courseId
    const courseTitle = parsed.data.courseTitle
    const amount = parsed.data.amount

    // Покупка курса доступна только авторизованным пользователям
    let user: User
    try {
      user = await apiGet<User>('/api/auth/me', request.cookies)
    } catch {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      )
    }

    if (!courseId || !amount) {
      return NextResponse.json(
        { error: 'Не указаны обязательные параметры' },
        { status: 400 }
      )
    }

    const appUrl = publicEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = new URL('/payment/success', appUrl)
    returnUrl.searchParams.set('courseId', courseId)
    
    const payment = await createPayment(
      amount,
      `Оплата курса: ${courseTitle || 'Курс'}`,
      returnUrl.toString(),
      {
        courseId,
        userId: user.id,
        userEmail: user.email,
        ...(courseTitle ? { courseTitle } : {}),
      }
    )

    return NextResponse.json({
      paymentId: payment.id,
      paymentUrl: payment.confirmation.confirmation_url,
    })
  } catch (error) {
    logger.error('Ошибка создания платежа', error, { route: '/api/payments/create', courseId })
    return NextResponse.json(
      { error: 'Ошибка создания платежа' },
      { status: 500 }
    )
  }
}
