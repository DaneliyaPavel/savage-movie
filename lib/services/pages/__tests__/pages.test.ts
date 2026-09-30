/**
 * Страницы направлений: содержимое, метаданные и разметка.
 *
 * Тесты страхуют то, что в рантайме не падает, а тихо портит выдачу: два
 * одинаковых title, FAQ без ответов, цена в чужом направлении, запрещённая
 * агентская формула, «24 часа» вместо решения D-04.
 */
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { SERVICE_DIRECTIONS } from '../../directions'
import { DIRECTION_PAGES, directionPath } from '../index'
import { directionJsonLd, directionMetadata } from '../seo'
import { firstSentence, interleaveFrames, type DirectionPageWork } from '../resolve'

const pages = Object.values(DIRECTION_PAGES).filter(Boolean) as NonNullable<
  (typeof DIRECTION_PAGES)[keyof typeof DIRECTION_PAGES]
>[]

const ROOT = path.resolve(__dirname, '../../../..')
const FORBIDDEN = [
  'уникальный подход',
  'инновационные решения',
  'команда профессионалов',
  'воплощаем идеи',
  'wow-эффект',
  'премиальное качество',
]

describe('реестр страниц', () => {
  it('покрывает все направления, кроме коммерческого (у него свой лендинг)', () => {
    const expected = SERVICE_DIRECTIONS.filter(d => d.id !== 'commercial').map(d => d.id)
    expect(pages.map(page => page.id).sort()).toEqual([...expected].sort())
  })

  it('title и description уникальны и укладываются в выдачу', () => {
    const titles = pages.map(page => page.seo.title)
    const descriptions = pages.map(page => page.seo.description)
    expect(new Set(titles).size).toBe(titles.length)
    expect(new Set(descriptions).size).toBe(descriptions.length)
    for (const page of pages) {
      expect(page.seo.title.length, page.id).toBeLessThanOrEqual(80)
      expect(page.seo.description.length, page.id).toBeGreaterThanOrEqual(100)
      expect(page.seo.description.length, page.id).toBeLessThanOrEqual(200)
    }
  })

  it('у каждой страницы есть вопросы и непустые ответы', () => {
    for (const page of pages) {
      expect(page.faq.length, page.id).toBeGreaterThanOrEqual(5)
      for (const item of page.faq) {
        expect(item.question.trim().endsWith('?'), `${page.id}: ${item.question}`).toBe(true)
        expect(item.answer.length, `${page.id}: ${item.question}`).toBeGreaterThan(40)
      }
    }
  })
})

describe('честность текста', () => {
  it('в содержимом нет запрещённых агентских формул и SLA в 24 часа', () => {
    for (const file of readdirSync(path.join(ROOT, 'lib/services/pages/content'))) {
      const text = readFileSync(path.join(ROOT, 'lib/services/pages/content', file), 'utf-8')
      for (const phrase of FORBIDDEN) {
        expect(text.toLowerCase(), `${file}: «${phrase}»`).not.toContain(phrase)
      }
      expect(text, `${file}: срок ответа`).not.toMatch(/24\s*час/i)
    }
  })

  it('на страницах направлений нет цен: ориентир утверждён только для рекламы (D-03)', () => {
    for (const file of readdirSync(path.join(ROOT, 'lib/services/pages/content'))) {
      const text = readFileSync(path.join(ROOT, 'lib/services/pages/content', file), 'utf-8')
      expect(text, file).not.toMatch(/₽|тыс\.|руб/i)
    }
  })
})

describe('метаданные и JSON-LD', () => {
  it.each(pages.map(page => [page.id, page] as const))('%s: метаданные', (_id, page) => {
    const meta = directionMetadata(page)
    expect(meta.title).toBe(page.seo.title)
    expect(String(meta.openGraph?.url)).toContain(directionPath(page.id))
    // Картинка есть и относится к маршруту страницы, а не к корню сайта
    expect(JSON.stringify(meta.openGraph?.images)).toContain(
      `${directionPath(page.id)}/opengraph-image`
    )
  })

  it.each(pages.map(page => [page.id, page] as const))('%s: JSON-LD валиден', (_id, page) => {
    const scripts = directionJsonLd(page, 'Тест')
    expect(scripts).toHaveLength(3)
    const [service, breadcrumbs, faq] = scripts.map(script => JSON.parse(script))

    expect(service['@type']).toBe('Service')
    expect(service.url).toContain(directionPath(page.id))
    expect(service.provider).toEqual({ '@id': expect.stringContaining('/#organization') })
    expect(service.offers, 'цену в разметке не выдумываем').toBeUndefined()
    expect(breadcrumbs.itemListElement).toHaveLength(3)
    expect(faq.mainEntity).toHaveLength(page.faq.length)
  })
})

describe('кадры', () => {
  const work = (slug: string, stills: string[]): DirectionPageWork => ({
    slug,
    title: slug,
    client: slug.toUpperCase(),
    year: null,
    playbackId: null,
    posterUrl: stills[0] ?? null,
    stills,
    description: null,
  })

  it('кадры чередуются между работами: соседние — из разных съёмок', () => {
    const frames = interleaveFrames([work('a', ['a1', 'a2']), work('b', ['b1', 'b2'])])
    expect(frames.map(frame => frame.src)).toEqual(['a1', 'b1', 'a2', 'b2'])
  })

  it('без работ кадров нет, и сцена не падает', () => {
    expect(interleaveFrames([])).toEqual([])
  })

  it('первое предложение описания обрезается по границе слова', () => {
    expect(firstSentence('Первое. Второе.')).toBe('Первое.')
    expect(firstSentence(null)).toBeNull()
    expect(firstSentence('слово '.repeat(60), 40)?.endsWith('…')).toBe(true)
  })
})
