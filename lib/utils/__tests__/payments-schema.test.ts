import { describe, it, expect } from 'vitest'
import { createPaymentRequestSchema } from '@/lib/payments/create-payment-schema'

const COURSE_ID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b'

describe('createPaymentRequestSchema', () => {
  it('accepts valid payload and coerces amount', () => {
    const parsed = createPaymentRequestSchema.safeParse({
      courseId: COURSE_ID,
      amount: '100',
      courseTitle: 'Test',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.amount).toBe(100)
    }
  })

  it('accepts payload without amount and title: сервер берёт их из курса', () => {
    const parsed = createPaymentRequestSchema.safeParse({ courseId: COURSE_ID })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.amount).toBeUndefined()
      expect(parsed.data.courseTitle).toBeUndefined()
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

  it.each(['abc', '', '../auth/me', `${COURSE_ID}/..`, `${COURSE_ID}?x=1`, 'my-course-slug'])(
    'rejects courseId that is not a UUID: %j',
    courseId => {
      const parsed = createPaymentRequestSchema.safeParse({ courseId, amount: 100 })
      expect(parsed.success).toBe(false)
      if (!parsed.success) {
        expect(parsed.error.issues.some(issue => issue.path.includes('courseId'))).toBe(true)
      }
    }
  )

  it('rejects non-numeric amount', () => {
    const parsed = createPaymentRequestSchema.safeParse({
      courseId: COURSE_ID,
      amount: 'nope',
      courseTitle: 'Test',
    })
    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(parsed.error.issues.some(issue => issue.path.includes('amount'))).toBe(true)
    }
  })
})
