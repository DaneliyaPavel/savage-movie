/**
 * Ценовые якоря сайта обязаны говорить одно и то же.
 *
 * До этого спринта они расходились: первый экран обещал «300–700», блок
 * стоимости начинался со «100–300», а форма предлагала выбрать «до 200» —
 * человек за один экран получал три разные версии того, сколько стоит работа
 * со студией. Тест сторожит согласованность, потому что эти значения лежат
 * в разных блоках контента и правятся по отдельности.
 */
import { describe, expect, it } from 'vitest'

import { BUDGET_OPTIONS, DEFAULT_COMMERCIAL_LANDING, LEGACY_BUDGET_OPTIONS } from '../content'

const { pricing, hero, faq, estimate } = DEFAULT_COMMERCIAL_LANDING

/** Основной коммерческий сегмент — тот самый диапазон, который выделен визуально */
const core = pricing.tiers.find(tier => tier.highlight)

describe('Согласованность ценовых якорей', () => {
  it('основной сегмент выделен ровно один и совпадает с новой позицией студии', () => {
    expect(pricing.tiers.filter(tier => tier.highlight)).toHaveLength(1)
    expect(core!.range).toBe('350–700 тыс. ₽')
  })

  it('первый экран называет тот же диапазон, что и блок стоимости', () => {
    // Диапазон в qualifier набран без «₽»: сверяем числовую часть
    const numbers = core!.range.replace(' ₽', '')
    expect(hero.budgetQualifier).toContain(numbers)
  })

  it('ответ в FAQ не противоречит блоку стоимости', () => {
    const answer = faq.items.find(item => item.question.includes('Сколько стоит'))
    expect(answer, 'вопрос о стоимости должен остаться в FAQ').toBeDefined()

    for (const tier of pricing.tiers) {
      const numbers = tier.range.replace(' ₽', '').replace('до ', '').replace('от ', '')
      expect(answer!.answer, tier.id).toContain(numbers)
    }
  })
})

describe('Диапазоны бюджета в форме', () => {
  it('форма использует канонический список, а не свою копию', () => {
    expect(estimate.budgetOptions).toEqual([...BUDGET_OPTIONS])
  })

  it('значения уникальны — иначе выбор в форме неоднозначен', () => {
    const values = BUDGET_OPTIONS.map(option => option.value)
    expect(new Set(values).size).toBe(values.length)
  })

  it('есть вариант «бюджет не определён»: без него часть заявок просто не отправится', () => {
    expect(BUDGET_OPTIONS.some(option => option.value === 'undecided')).toBe(true)
  })

  /**
   * Старые значения обязаны остаться известными серверу: запись лендинга в
   * CMS обновляется отдельно от деплоя, и потерять бюджет заявки в этом окне
   * хуже, чем принять устаревший диапазон.
   */
  it('прежние значения не пересекаются с новыми и сохранены отдельно', () => {
    const current = new Set(BUDGET_OPTIONS.map(option => option.value))
    const legacy = LEGACY_BUDGET_OPTIONS.map(option => option.value)

    expect(legacy.length).toBeGreaterThan(0)
    expect(legacy.some(value => current.has(value))).toBe(false)
  })
})
