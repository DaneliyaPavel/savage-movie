import { z } from 'zod'

const MAX_PAYMENT_AMOUNT = 1_000_000

// courseId уходит в путь запроса к backend: пропускаем только UUID, без "/" и "..".
// Регулярка, а не z.uuid(): не требуем версию и вариант, чтобы не отсечь настоящий id курса.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const guestSchema = z.object({
  name: z.string().min(1, 'Укажите имя'),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(1, 'Укажите телефон'),
})

export const createPaymentRequestSchema = z.object({
  courseId: z.string().regex(UUID_REGEX),
  // courseTitle и amount принимаются для совместимости со старыми клиентами, но сервер их
  // не использует: цена и название курса берутся с backend (см. app/api/payments/create)
  courseTitle: z.string().optional(),
  amount: z.preprocess(value => {
    if (typeof value === 'string') return Number(value)
    return value
  }, z.number().finite().positive().max(MAX_PAYMENT_AMOUNT).optional()),
  guest: guestSchema.optional(),
})

export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>
export type GuestPaymentData = z.infer<typeof guestSchema>
