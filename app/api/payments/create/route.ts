/**
 * API route для создания платежа через ЮKassa
 */
import { NextRequest, NextResponse } from 'next/server'
import { createPayment } from '@/lib/payments/yookassa'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, courseTitle, amount } = body

    if (!courseId || !amount) {
      return NextResponse.json(
        { error: 'Не указаны обязательные параметры' },
        { status: 400 }
      )
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?courseId=${courseId}`
    
    const payment = await createPayment(
      amount,
      `Оплата курса: ${courseTitle}`,
      returnUrl,
      {
        courseId,
        courseTitle,
      }
    )

    return NextResponse.json({
      paymentId: payment.id,
      paymentUrl: payment.confirmation.confirmation_url,
    })
  } catch (error) {
    console.error('Ошибка создания платежа:', error)
    return NextResponse.json(
      { error: 'Ошибка создания платежа' },
      { status: 500 }
    )
  }
}
