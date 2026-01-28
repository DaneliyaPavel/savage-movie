/**
 * Webhook для обработки уведомлений от ЮKassa
 */
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Тонкий прокси на backend: вся бизнес-логика (проверка статуса, идемпотентность, enrollment, email)
    // находится в FastAPI.
    let API_URL = serverEnv.API_URL || publicEnv.NEXT_PUBLIC_API_URL
    if (!API_URL) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('API_URL is not configured', null, { route: '/api/payments/webhook' })
        return NextResponse.json(
          { error: 'Ошибка конфигурации сервера' },
          { status: 500 }
        )
      }
      API_URL = 'http://localhost:8001'
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const headers = new Headers({ 'Content-Type': 'application/json' })
    const contentHmac = request.headers.get('content-hmac')
    if (contentHmac) {
      headers.set('Content-Hmac', contentHmac)
    }

    let backendResponse: Response
    try {
      backendResponse = await fetch(`${API_URL}/api/payments/yookassa/webhook`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    const responseBody = await backendResponse
      .json()
      .catch(() => ({ received: backendResponse.ok }))

    return NextResponse.json(responseBody, { status: backendResponse.status })
  } catch (error) {
    logger.error('Ошибка обработки webhook', error, { route: '/api/payments/webhook' })
    return NextResponse.json(
      { error: 'Ошибка обработки webhook' },
      { status: 500 }
    )
  }
}
