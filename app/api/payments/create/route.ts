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
import { serverEnv } from '@/lib/env.server'
import { createPaymentRequestSchema } from '@/lib/payments/create-payment-schema'
import { randomUUID } from 'crypto'
import { z } from 'zod'

/** Курс из публичного API backend: оттуда берём единственно верные цену и название */
const backendCourseSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  price: z.union([z.number(), z.string()]).nullish(),
})

const COURSE_LOOKUP_TIMEOUT_MS = 10_000

/**
 * Загружает курс с backend без кук и без кеша: цена должна быть актуальной на момент оплаты.
 * null, если курса нет (404). Любой другой сбой бросает исключение.
 */
async function fetchCourse(courseId: string) {
  const baseUrl = (
    serverEnv.API_URL ||
    publicEnv.NEXT_PUBLIC_API_URL ||
    'http://localhost:8001'
  ).replace(/\/+$/, '')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), COURSE_LOOKUP_TIMEOUT_MS)
  try {
    const response = await fetch(`${baseUrl}/api/courses/${encodeURIComponent(courseId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    })
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Backend вернул HTTP ${response.status} при загрузке курса`)
    }
    return backendCourseSchema.parse(await response.json())
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(request: NextRequest) {
  let courseId: string | undefined
  try {
    const body = await request.json().catch(() => null)
    const parsed = createPaymentRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Некорректные параметры запроса' }, { status: 400 })
    }

    const guest = parsed.data.guest
    courseId = parsed.data.courseId

    // Цену и название определяет только сервер. Присланные клиентом amount и courseTitle
    // игнорируем, иначе любой оплатит курс за 1 рубль.
    let course: Awaited<ReturnType<typeof fetchCourse>>
    try {
      course = await fetchCourse(courseId)
    } catch (lookupError) {
      logger.error('Не удалось загрузить курс для оплаты', lookupError, {
        route: '/api/payments/create',
        courseId,
      })
      return NextResponse.json(
        { error: 'Не удалось проверить курс. Попробуйте позже.' },
        { status: 502 }
      )
    }
    if (!course) {
      return NextResponse.json({ error: 'Курс не найден' }, { status: 404 })
    }

    const rawPrice = course.price == null ? 0 : Number(course.price)
    if (!Number.isFinite(rawPrice)) {
      logger.error('Backend вернул некорректную цену курса', null, {
        route: '/api/payments/create',
        courseId,
      })
      return NextResponse.json(
        { error: 'Не удалось проверить курс. Попробуйте позже.' },
        { status: 502 }
      )
    }
    const amount = Math.round(rawPrice * 100) / 100
    if (amount <= 0) {
      // Бесплатные курсы оплаты не требуют
      return NextResponse.json({ error: 'Этот курс бесплатный: оплата не нужна' }, { status: 400 })
    }

    const courseTitle = course.title || 'Курс'
    // id берём из ответа backend: в metadata и в ссылку возврата попадает только настоящий UUID курса
    courseId = course.id

    if (parsed.data.amount !== undefined && Math.abs(parsed.data.amount - amount) > 0.005) {
      logger.warn('Цена от клиента не совпала с ценой курса, использована цена курса', {
        route: '/api/payments/create',
        courseId,
        clientAmount: parsed.data.amount,
        amount,
      })
    }

    const metadata: Record<string, string> = {
      courseId,
      courseTitle,
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
      `Оплата курса: ${courseTitle}`,
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
    if (
      message.includes('credentials') ||
      message.includes('не настроены') ||
      message.includes('ЮKassa')
    ) {
      return NextResponse.json(
        { error: 'Платёжная система временно недоступна. Обратитесь к администратору.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 })
  }
}
