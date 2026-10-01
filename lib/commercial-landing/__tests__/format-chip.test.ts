/**
 * Линейка форматов стоит только под этапом, где в плашках есть форматы.
 */
import { describe, expect, it } from 'vitest'

import { hasFormatChip } from '../format-chip'

describe('hasFormatChip', () => {
  it('плашка с форматами из боевого контента находит этап', () => {
    expect(hasFormatChip(['16:9, 9:16, 1:1', 'сайт', 'digital', 'social'])).toBe(true)
    expect(hasFormatChip(['формат 16 : 9'])).toBe(true)
  })

  it('другие этапы линейку не получают', () => {
    expect(hasFormatChip(['монтаж', 'цвет', 'sound design'])).toBe(false)
    expect(hasFormatChip(['смета', 'команда', 'съёмочный план'])).toBe(false)
    expect(hasFormatChip([])).toBe(false)
  })

  it('число, в котором случайно есть 16:9, не считается форматом', () => {
    expect(hasFormatChip(['116:90'])).toBe(false)
  })
})
