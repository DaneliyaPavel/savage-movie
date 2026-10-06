/**
 * /about: тексты, разметка и данные. Страница публичная и коммерческая, поэтому
 * проверяем то, что молча ломается: выдуманные обещания, цены, форма JSON-LD,
 * ссылки на существующие маршруты и разбор данных из CMS.
 */
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { SERVICE_DIRECTIONS } from '@/lib/services/directions'

import * as content from '../content'
import { aboutJsonLd, aboutMetadata } from '../seo'
import { normalizeTeam } from '../team'
import { toAboutWorks } from '../load'
import { formatTimecode } from '@/components/sections/about/about-hud'

const ROOT = path.resolve(__dirname, '../../..')

const allText = JSON.stringify(content)

describe('Тексты /about', () => {
  it('нет агентских клише и неподтверждённых обещаний', () => {
    const forbidden = [
      'уникальный подход',
      'инновационные решения',
      'команда профессионалов',
      'воплощаем идеи',
      'wow-эффект',
      'премиальное качество',
      'награжд',
      '24 часа',
    ]
    const text = allText.toLowerCase()
    for (const phrase of forbidden) expect(text).not.toContain(phrase)
  })

  it('цены не публикуются (D-03)', () => {
    expect(allText).not.toMatch(/\d[\d\s]*(₽|руб|тыс\.)/i)
    expect(allText).not.toMatch(/от\s*\d/i)
  })

  it('title и description укладываются в сниппет', () => {
    expect(content.ABOUT_SEO.title.length).toBeLessThanOrEqual(70)
    expect(content.ABOUT_SEO.description.length).toBeGreaterThan(80)
    expect(content.ABOUT_SEO.description.length).toBeLessThanOrEqual(170)
  })

  it('этапов пять, вопросов шесть, ответы не пустые', () => {
    expect(content.ABOUT_STAGES).toHaveLength(5)
    expect(content.ABOUT_FAQ).toHaveLength(6)
    for (const item of content.ABOUT_FAQ) {
      expect(item.question.trim().length).toBeGreaterThan(5)
      expect(item.answer.trim().length).toBeGreaterThan(20)
    }
  })

  it('внутренние ссылки ведут на существующие страницы', () => {
    const hrefs = [
      ...content.ABOUT_PROCESS_NOTE.links.map(item => item.href),
      ...content.ABOUT_READING.map(item => item.href),
    ].filter(href => !href.startsWith('/blog/'))
    for (const href of hrefs) {
      const dir = path.join(ROOT, 'app/(marketing)', href)
      expect(existsSync(dir) || existsSync(path.join(ROOT, 'app', href))).toBe(true)
    }
  })

  it('все направления страницы существуют в конфигурации', () => {
    expect(SERVICE_DIRECTIONS.length).toBe(7)
  })
})

describe('SEO /about', () => {
  it('canonical задаётся на маршруте, а не в метаданных-сборке', () => {
    expect(aboutMetadata().alternates).toBeUndefined()
  })

  it('JSON-LD: валидный JSON, AboutPage ссылается на Organization, без рейтингов и адресов', () => {
    const scripts = aboutJsonLd().map(item => JSON.parse(item))
    const types = scripts.map(item => item['@type'])
    expect(types).toEqual(['AboutPage', 'BreadcrumbList', 'FAQPage'])
    expect(scripts[0].mainEntity['@id']).toMatch(/#organization$/)
    const raw = aboutJsonLd().join('')
    for (const key of ['aggregateRating', 'review', 'address', 'telephone', 'award', 'Person']) {
      expect(raw).not.toContain(key)
    }
  })

  it('FAQPage повторяет вопросы страницы один в один', () => {
    const faq = JSON.parse(aboutJsonLd()[2])
    const names = faq.mainEntity.map((item: { name: string }) => item.name)
    expect(names).toEqual(content.ABOUT_FAQ.map(item => item.question))
  })
})

describe('Команда из CMS', () => {
  it('пропускает записи без имени и фото, чинит кадрирование', () => {
    const team = normalizeTeam([
      { id: 'a', name: 'Мария', position: 'Продюсер', photo_url: '/uploads/a.jpg' },
      { id: 'b', name: '', position: 'x' },
      'мусор',
    ] as never)
    expect(team.map(member => member.name)).toEqual(['Мария'])
    expect(team[0].crop).toEqual({ x: 50, y: 50, zoom: 1 })
  })

  it('не падает на отсутствующих данных', () => {
    expect(normalizeTeam(undefined)).toEqual([])
    expect(normalizeTeam(null as never)).toEqual([])
  })
})

describe('Данные страницы', () => {
  it('цифры студии: 50+ брендов и 100+ проектов — слова владельца', () => {
    expect(content.ABOUT_NUMBERS.brands).toMatchObject({ value: 50, plus: true })
    expect(content.ABOUT_NUMBERS.projects).toMatchObject({ value: 100, plus: true })
  })

  it('toAboutWorks: берёт только известные проекты с кадром', () => {
    expect(toAboutWorks([])).toEqual([])
  })

  it('таймкод HUD: 24 к/с, три минуты экранного времени', () => {
    expect(formatTimecode(0)).toBe('00:00:00:00')
    expect(formatTimecode(1)).toBe('00:03:00:00')
    expect(formatTimecode(-3)).toBe('00:00:00:00')
    expect(formatTimecode(9)).toBe('00:03:00:00')
  })
})
