/**
 * Доказательства направлений собираются из портфолио, а не из конфигурации:
 * слаг, которого нет среди опубликованных проектов, обязан исчезнуть, а не
 * превратиться в ссылку на /projects/<несуществующий-слаг>.
 */
import { describe, expect, it } from 'vitest'

import type { Project } from '@/features/projects/api'
import { heroMontage, resolveDirections } from '../proof'
import { SERVICE_DIRECTIONS } from '../directions'

function project(slug: string, overrides: Partial<Project> = {}): Project {
  return {
    id: slug,
    title: `Работа ${slug}`,
    slug,
    description: null,
    client: slug.toUpperCase(),
    category: 'commercial',
    video_url: null,
    images: ['/uploads/images/frame.png'],
    duration: null,
    role: null,
    tools: null,
    behind_scenes: null,
    is_featured: true,
    mux_playback_id: `pb-${slug}`,
    carousel_gif_url: null,
    title_ru: null,
    title_en: null,
    description_ru: null,
    description_en: null,
    thumbnail_url: null,
    cover_image_url: null,
    year: 2025,
    display_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('resolveDirections', () => {
  it('не найденный в портфолио слаг выпадает, а не становится битой ссылкой', () => {
    const commercial = SERVICE_DIRECTIONS[0]!
    const existing = commercial.proofSlugs[0]!

    const [resolved] = resolveDirections([project(existing)])

    expect(resolved!.works.map(work => work.slug)).toEqual([existing])
  })

  it('без портфолио направления остаются, но без работ: текст сцены — не выдумка', () => {
    const resolved = resolveDirections([])

    expect(resolved).toHaveLength(SERVICE_DIRECTIONS.length)
    expect(resolved.every(direction => direction.works.length === 0)).toBe(true)
  })

  it('порядок работ повторяет порядок proofSlugs, а не порядок портфолио', () => {
    const commercial = SERVICE_DIRECTIONS[0]!
    const [first, second] = commercial.proofSlugs

    // В портфолио проекты лежат в обратном порядке
    const [resolved] = resolveDirections([project(second!), project(first!)])

    expect(resolved!.works.map(work => work.slug)).toEqual([first, second])
  })

  it('бренд подставляется из client, а не из названия ролика', () => {
    const slug = SERVICE_DIRECTIONS[0]!.proofSlugs[0]!
    const [resolved] = resolveDirections([project(slug, { client: 'WELLERY' })])

    expect(resolved!.works[0]!.client).toBe('WELLERY')
  })
})

describe('heroMontage', () => {
  /**
   * WELLERY законно доказывает и рекламу, и регулярный контент. В монтаже
   * первого экрана тот же план дважды читается как сбой склейки, а в React
   * ещё и даёт дублирующийся key.
   */
  it('одна работа не попадает в монтаж дважды', () => {
    const shared = 'wellery'
    const directions = resolveDirections([project(shared)])
    const frames = heroMontage(directions)

    expect(frames.filter(frame => frame.slug === shared)).toHaveLength(1)
  })

  it('работа без кадра в монтаж не попадает: чёрной дыры в склейке быть не должно', () => {
    const slug = SERVICE_DIRECTIONS[0]!.proofSlugs[0]!
    const directions = resolveDirections([
      project(slug, { images: null, mux_playback_id: null, thumbnail_url: null }),
    ])

    expect(heroMontage(directions)).toEqual([])
  })
})

/**
 * Результат resolveDirections уезжает в браузер целиком — это пропсы
 * клиентского компонента. Путь ненаписанной страницы туда попадать не должен:
 * ссылки на него всё равно нет, но строка «/fashion-video» в отданном
 * документе анонсирует маршрут, которого не существует.
 */
describe('Что уезжает в браузер', () => {
  it('путь неопубликованного направления обнулён', () => {
    const pending = resolveDirections([]).filter(direction => !direction.route.published)

    expect(pending.length).toBeGreaterThan(0)
    expect(pending.every(direction => direction.route.path === '')).toBe(true)
  })

  it('путь опубликованного направления сохраняется', () => {
    const published = resolveDirections([]).filter(direction => direction.route.published)

    expect(published.map(direction => direction.route.path)).toEqual(['/reklamny-rolik'])
  })
})
