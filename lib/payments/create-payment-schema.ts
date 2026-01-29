import { z } from 'zod'

const MAX_PAYMENT_AMOUNT = 1_000_000

export const createPaymentRequestSchema = z.object({
  courseId: z.string().min(1),
  courseTitle: z.string().optional(),
  amount: z.preprocess((value) => {
    if (typeof value === 'string') return Number(value)
    return value
  }, z.number().finite().positive().max(MAX_PAYMENT_AMOUNT)),
})

export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>
