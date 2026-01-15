/**
 * Webhook для обработки уведомлений от ЮKassa
 * Обновлен для работы с Python API
 */
import { NextRequest, NextResponse } from 'next/server'
import { apiPost, apiGet } from '@/lib/api/server'
import { sendCourseEnrollmentConfirmation } from '@/lib/email/resend'
import { checkPaymentStatus } from '@/lib/payments/yookassa'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // ЮKassa отправляет уведомления о статусе платежа
    // Проверяем статус платежа
    if (body.event === 'payment.succeeded' && body.object?.id) {
      const paymentId = body.object.id
      const payment = await checkPaymentStatus(paymentId)

      if (payment.status === 'succeeded' && payment.metadata?.courseId) {
        const courseId = payment.metadata.courseId as string
        const userId = payment.metadata.userId as string | undefined
        const userEmail = payment.metadata.userEmail as string | undefined

        // Если есть userId, создаем enrollment через API
        if (userId) {
          try {
            // Получаем токен из cookies (если есть) для авторизованного запроса
            const cookies = request.cookies
            await apiPost(
              '/api/enrollments',
              { course_id: courseId },
              cookies
            )

            // Отправляем email подтверждения
            if (userEmail) {
              try {
                // Получаем информацию о курсе
                const course = await apiGet<{ title: string }>(
                  `/api/courses/${courseId}`,
                  cookies
                )
                
                if (course) {
                  await sendCourseEnrollmentConfirmation(
                    userEmail,
                    course.title
                  )
                }
              } catch (emailError) {
                console.error('Ошибка отправки email:', emailError)
                // Не критично, продолжаем
              }
            }
          } catch (enrollmentError) {
            console.error('Ошибка создания записи на курс:', enrollmentError)
            // Продолжаем выполнение, так как платеж уже прошел
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Ошибка обработки webhook:', error)
    return NextResponse.json(
      { error: 'Ошибка обработки webhook' },
      { status: 500 }
    )
  }
}
