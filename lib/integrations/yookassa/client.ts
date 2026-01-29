/**
 * Интеграция с ЮKassa для обработки платежей
 */
import crypto from 'crypto'
import { serverEnv } from '@/lib/env.server'

interface PaymentRequest {
  amount: {
    value: string
    currency: string
  }
  confirmation: {
    type: string
    return_url: string
  }
  description: string
  metadata?: Record<string, string>
}

interface PaymentResponse {
  id: string
  status: string
  confirmation?: {
    confirmation_url?: string
  }
  metadata?: Record<string, string>
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Создает платеж в ЮKassa
 */
export async function createPayment(
  amount: number,
  description: string,
  returnUrl: string,
  metadata?: Record<string, string>,
  idempotencyKey?: string
): Promise<PaymentResponse> {
  const shopId = serverEnv.YOOKASSA_SHOP_ID
  const secretKey = serverEnv.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error('ЮKassa credentials не настроены')
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Некорректная сумма платежа')
  }

  const discriminator = metadata?.orderId || metadata?.nonce || metadata?.requestId

  if (!idempotencyKey && !discriminator) {
    throw new Error(
      'idempotencyKey или стабильный идентификатор в metadata (orderId/nonce/requestId) обязателен'
    )
  }

  const idempotencyKeyValue =
    idempotencyKey ||
    crypto
      .createHash('sha256')
      .update(JSON.stringify({ amount, description, returnUrl, metadata, discriminator }))
      .digest('hex')

  const paymentData: PaymentRequest = {
    amount: {
      value: amount.toFixed(2),
      currency: 'RUB',
    },
    confirmation: {
      type: 'redirect',
      return_url: returnUrl,
    },
    description,
    metadata,
  }

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
      'Idempotence-Key': idempotencyKeyValue,
    },
    body: JSON.stringify(paymentData),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ошибка создания платежа: ${error}`)
  }

  return response.json()
}

/**
 * Проверяет статус платежа
 */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentResponse> {
  if (!paymentId || !UUID_REGEX.test(paymentId)) {
    throw new Error('Некорректный формат paymentId')
  }

  const shopId = serverEnv.YOOKASSA_SHOP_ID
  const secretKey = serverEnv.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error('ЮKassa credentials не настроены')
  }

  const response = await fetch(
    `https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ошибка проверки платежа: ${error}`)
  }

  return response.json()
}
