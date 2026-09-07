import { describe, it, expect } from 'vitest'
import { buildClientRoll, normalizeClientName } from '../mappers'
import type { Project } from '@/features/projects/api'
import type { Client } from '@/lib/api/clients'

function project(overrides: Partial<Project> & { slug: string }): Project {
  return {
    id: overrides.slug,
    title: 'Проект',
    description: null,
    client: null,
    category: 'commercial',
    video_url: null,
    images: null,
    duration: null,
    role: null,
    tools: null,
    behind_scenes: null,
    is_featured: false,
    mux_playback_id: null,
    carousel_gif_url: null,
    title_ru: null,
    title_en: null,
    description_ru: null,
    description_en: null,
    thumbnail_url: null,
    cover_image_url: null,
    year: null,
    display_order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as Project
}

function cmsClient(overrides: Partial<Client> & { name: string }): Client {
  return {
    id: overrides.name,
    name: overrides.name,
    description: null,
    logo_url: null,
    order: 0,
    slug: null,
    video_url: null,
    video_playback_id: null,
    portfolio_videos: null,
    bio: null,
    role: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('normalizeClientName', () => {
  it('приводит регистр и пробелы к одному ключу', () => {
    expect(normalizeClientName('  WELLERY ')).toBe('wellery')
    expect(normalizeClientName('Best   Western')).toBe('best western')
  })
})

describe('buildClientRoll', () => {
  it('собирает бренды из проектов и считает их', () => {
    const roll = buildClientRoll([
      project({ slug: 'wellery', client: 'WELLERY', display_order: 2 }),
      project({ slug: 'zarina', client: 'ZARINA', display_order: 1 }),
    ])

    expect(roll.brandCount).toBe(2)
    expect(roll.projectCount).toBe(2)
    expect(roll.entries.map(entry => entry.name)).toEqual(['ZARINA', 'WELLERY'])
  })

  it('склеивает несколько проектов одного бренда в одну строку', () => {
    const roll = buildClientRoll([
      project({ slug: 'sensual', client: 'Sensual', display_order: 7 }),
      project({ slug: 'sensual-car-service', client: 'sensual', display_order: 3 }),
    ])

    expect(roll.brandCount).toBe(1)
    expect(roll.projectCount).toBe(2)
    expect(roll.entries[0]?.projects.map(p => p.slug)).toEqual(['sensual-car-service', 'sensual'])
  })

  it('не пускает в ролл служебные подписи вместо заказчика', () => {
    const roll = buildClientRoll([
      project({ slug: 'viberi-zhizn', client: 'Социальный проект' }),
      project({ slug: 'otec', client: 'Социальный проект' }),
      project({ slug: 'mavin', client: 'MAVIN' }),
    ])

    expect(roll.entries.map(entry => entry.name)).toEqual(['MAVIN'])
  })

  it('пропускает проекты без клиента и без slug', () => {
    const roll = buildClientRoll([
      project({ slug: 'no-client', client: '   ' }),
      project({ slug: '', client: 'NAUMI' }),
      project({ slug: 'diesel', client: 'Diesel' }),
    ])

    expect(roll.entries.map(entry => entry.name)).toEqual(['Diesel'])
  })

  it('берёт логотип и описание из CMS-записи клиента', () => {
    const roll = buildClientRoll(
      [project({ slug: 'wellery', client: 'WELLERY' })],
      [cmsClient({ name: 'wellery', logo_url: '/uploads/logo.svg', description: 'HoReCa' })]
    )

    expect(roll.entries[0]?.logoUrl).toBe('/uploads/logo.svg')
    expect(roll.entries[0]?.note).toBe('HoReCa')
  })

  it('оставляет CMS-бренд без проекта строкой без ссылки', () => {
    const roll = buildClientRoll(
      [project({ slug: 'mavin', client: 'MAVIN' })],
      [cmsClient({ name: 'Новый бренд' })]
    )

    const proofOnly = roll.entries.find(entry => entry.name === 'Новый бренд')
    expect(proofOnly).toBeDefined()
    expect(proofOnly?.primary).toBeNull()
    expect(proofOnly?.projects).toHaveLength(0)
    // Бренд без проекта всё равно считается: он был клиентом
    expect(roll.brandCount).toBe(2)
    expect(roll.projectCount).toBe(1)
  })

  it('берёт кадр из галереи, а не превью плеера', () => {
    const roll = buildClientRoll([
      project({
        slug: 'diesel',
        client: 'Diesel',
        images: ['/uploads/images/frame.webp'],
        thumbnail_url: 'https://cdn.example/preview.webp',
      }),
    ])

    expect(roll.entries[0]?.primary?.still).toBe('/uploads/images/frame.webp')
  })

  it('представляет бренд проектом, у которого есть кадр', () => {
    const roll = buildClientRoll([
      project({ slug: 'a', client: 'Unna', display_order: 1, images: null }),
      project({ slug: 'b', client: 'Unna', display_order: 2, images: ['/uploads/images/b.webp'] }),
    ])

    expect(roll.entries[0]?.primary?.slug).toBe('b')
  })

  it('поднимает наверх бренды из редакторского списка приоритета', () => {
    const roll = buildClientRoll(
      [
        project({ slug: 'mavin', client: 'MAVIN', display_order: 1 }),
        project({ slug: 'wellery', client: 'WELLERY', display_order: 2 }),
        project({ slug: 'zarina', client: 'ZARINA', display_order: 17 }),
        project({ slug: 'diesel', client: 'Diesel', display_order: 15 }),
      ],
      [],
      ['zarina', 'DIESEL']
    )

    expect(roll.entries.map(entry => entry.name)).toEqual(['ZARINA', 'Diesel', 'MAVIN', 'WELLERY'])
  })

  it('считает диапазон лет по проектам и игнорирует пустой год', () => {
    const roll = buildClientRoll([
      project({ slug: 'a', client: 'Diesel', year: 2025 }),
      project({ slug: 'b', client: 'Dralo', year: 2023 }),
      project({ slug: 'c', client: 'ZARINA', year: null }),
    ])

    expect(roll.yearRange).toBe('2023 / 2025')
  })

  it('не падает на пустых данных', () => {
    const roll = buildClientRoll([], [])
    expect(roll).toEqual({ entries: [], yearRange: null, brandCount: 0, projectCount: 0 })
  })
})
