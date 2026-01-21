import { z } from 'zod'

export const createPaymentRequestSchema = z.object({
  courseId: z.string().min(1),
  courseTitle: z.string().optional(),
  amount: z.preprocess((value) => {
    if (typeof value === 'string') return Number(value)
    return value
  }, z.number().finite().positive()),
})

export type CreatePaymentRequest = z.infer<typeof createPaymentRequestSchema>

