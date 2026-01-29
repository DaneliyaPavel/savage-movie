import { describe, it, expect } from 'vitest'
import { createPaymentRequestSchema } from '@/lib/payments/create-payment-schema'

describe('createPaymentRequestSchema', () => {
  it('accepts valid payload and coerces amount', () => {
    const parsed = createPaymentRequestSchema.safeParse({
      courseId: 'abc',
      amount: '100',
      courseTitle: 'Test',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.amount).toBe(100)
    }
  })

  it('rejects missing courseId', () => {
    const parsed = createPaymentRequestSchema.safeParse({
      amount: 100,
      courseTitle: 'Test',
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.some(issue => issue.path.includes('courseId'))).toBe(true)
    }
  })

  it('rejects non-numeric amount', () => {
    const parsed = createPaymentRequestSchema.safeParse({
      courseId: 'abc',
      amount: 'nope',
      courseTitle: 'Test',
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.some(issue => issue.path.includes('amount'))).toBe(true)
    }
  })
})
