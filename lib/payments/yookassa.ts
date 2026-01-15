/**
 * Интеграция с ЮKassa для обработки платежей
 */

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
  confirmation: {
    confirmation_url: string
  }
  metadata?: Record<string, string>
}

/**
 * Создает платеж в ЮKassa
 */
export async function createPayment(
  amount: number,
  description: string,
  returnUrl: string,
  metadata?: Record<string, string>
): Promise<PaymentResponse> {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error('ЮKassa credentials не настроены')
  }

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
      'Authorization': `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
      'Idempotence-Key': crypto.randomUUID(),
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
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY

  if (!shopId || !secretKey) {
    throw new Error('ЮKassa credentials не настроены')
  }

  const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString('base64')}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ошибка проверки платежа: ${error}`)
  }

  return response.json()
}
