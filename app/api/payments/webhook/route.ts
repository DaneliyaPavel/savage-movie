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
    const API_URL = serverEnv.API_URL || publicEnv.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

    const backendResponse = await fetch(`${API_URL}/api/payments/yookassa/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

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
