import { beforeEach, describe, expect, it, vi } from 'vitest'
import { METRIKA_ID, trackMetrikaGoal } from '../metrika'

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

describe('trackMetrikaGoal', () => {
  beforeEach(() => {
    delete window.ym
  })

  it('отправляет цель в счётчик сайта', () => {
    const ym = vi.fn()
    window.ym = ym

    trackMetrikaGoal('production_lead_success')

    expect(ym).toHaveBeenCalledTimes(1)
    expect(ym).toHaveBeenCalledWith(108213944, 'reachGoal', 'production_lead_success')
    expect(METRIKA_ID).toBe(108213944)
  })

  it('не падает, если счётчик не загрузился', () => {
    expect(() => trackMetrikaGoal('production_lead_success')).not.toThrow()
  })

  it('не пробрасывает ошибку счётчика наружу', () => {
    window.ym = vi.fn(() => {
      throw new Error('metrika is down')
    })

    expect(() => trackMetrikaGoal('production_lead_success')).not.toThrow()
  })
})
