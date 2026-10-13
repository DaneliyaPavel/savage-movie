import { describe, expect, it } from 'vitest'

import { buildDescription, buildTitle, stripBrandTail, TITLE_MAX } from '../snippet'

describe('stripBrandTail', () => {
  it('снимает хвост «| Savage Movie» в любом регистре', () => {
    expect(stripBrandTail('Сколько стоит ролик | Savage Movie')).toBe('Сколько стоит ролик')
    expect(stripBrandTail('Ролик — SAVAGE MOVIE')).toBe('Ролик')
  })

  it('не трогает название без хвоста', () => {
    expect(stripBrandTail('Ух ты, парк')).toBe('Ух ты, парк')
  })
})

describe('buildTitle', () => {
  it('добавляет бренд, если помещается', () => {
    expect(buildTitle('Ух ты, парк')).toBe('Ух ты, парк | Savage Movie')
  })

  it('регрессия: название статьи про цену не превращается в «… | Sav…»', () => {
    const title = buildTitle('Сколько стоит рекламный ролик в 2026 — разбор бюджета | Savage Movie')
    expect(title).not.toContain('…')
    expect(title).not.toMatch(/Sav\b/)
    expect(title.startsWith('Сколько стоит рекламный ролик в 2026')).toBe(true)
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
  })

  it('длинное название режется по слову, без многоточия и без бренда', () => {
    const long = 'Очень длинное название проекта '.repeat(5)
    const title = buildTitle(long)
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
    expect(title).not.toContain('…')
    expect(title).not.toMatch(/\s$/)
    expect(long.startsWith(title)).toBe(true)
  })
})

describe('buildDescription', () => {
  it('короткий текст возвращает как есть', () => {
    expect(buildDescription('Имиджевый ролик для базы отдыха.')).toBe(
      'Имиджевый ролик для базы отдыха.'
    )
  })

  it('убирает markdown', () => {
    expect(buildDescription('**Задача** — [ролик](/x) для бренда')).toBe(
      'Задача — ролик для бренда'
    )
  })

  it('режет по границе предложения, если оно достаточно длинное', () => {
    const text = `${'Слово '.repeat(20)}конец первого. ${'Ещё '.repeat(40)}`
    const result = buildDescription(text)
    expect(result.length).toBeLessThanOrEqual(160)
    expect(result.endsWith('первого.')).toBe(true)
  })

  it('без границы предложения режет по слову и ставит многоточие', () => {
    const result = buildDescription('слово '.repeat(60))
    expect(result.length).toBeLessThanOrEqual(160)
    expect(result.endsWith('…')).toBe(true)
    expect(result).not.toMatch(/сло…$/)
  })
})
