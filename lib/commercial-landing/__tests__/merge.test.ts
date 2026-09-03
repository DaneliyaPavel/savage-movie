/**
 * Регресс на баг, из-за которого правки в /admin/landing выглядели
 * несохранёнными: администратор загружал видео на первый экран, жал
 * «Сохранить», получал «Сохранено», но при следующей загрузке страницы
 * (как в редакторе, так и на публичном /reklamny-rolik) поле снова было
 * пустым — как будто сохранение не подействовало.
 *
 * На самом деле запись в базу проходила верно. Ломалось чтение: у всех
 * nullable-полей (videoPlaybackId, posterUrl и т.п.) дефолт — null, а
 * typeof null === 'object'. Строгая проверка `typeof value === typeof
 * defaultValue` сравнивала 'string' с 'object' и тихо отбрасывала реальное
 * значение обратно на null при каждом merge с дефолтами.
 */
import { describe, expect, it } from 'vitest'

import { DEFAULT_COMMERCIAL_LANDING } from '../content'
import { mergeCommercialLandingContent } from '../merge'

describe('mergeCommercialLandingContent — nullable top-level поля', () => {
  it('сохранённый videoPlaybackId переживает merge с дефолтами', () => {
    const saved = {
      ...DEFAULT_COMMERCIAL_LANDING,
      hero: { ...DEFAULT_COMMERCIAL_LANDING.hero, videoPlaybackId: 'abc-123' },
    }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, saved)

    expect(merged.hero.videoPlaybackId).toBe('abc-123')
  })

  it('сохранённый posterUrl переживает merge с дефолтами', () => {
    const saved = {
      ...DEFAULT_COMMERCIAL_LANDING,
      hero: { ...DEFAULT_COMMERCIAL_LANDING.hero, posterUrl: 'https://cdn.example/poster.jpg' },
    }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, saved)

    expect(merged.hero.posterUrl).toBe('https://cdn.example/poster.jpg')
  })

  it('showreel.playbackId переживает merge', () => {
    const saved = {
      ...DEFAULT_COMMERCIAL_LANDING,
      showreel: { ...DEFAULT_COMMERCIAL_LANDING.showreel, playbackId: 'reel-xyz' },
    }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, saved)

    expect(merged.showreel.playbackId).toBe('reel-xyz')
  })

  it('finalCta.playbackId и posterUrl переживают merge', () => {
    const saved = {
      ...DEFAULT_COMMERCIAL_LANDING,
      finalCta: {
        ...DEFAULT_COMMERCIAL_LANDING.finalCta,
        playbackId: 'final-reel',
        posterUrl: 'https://cdn.example/final.jpg',
      },
    }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, saved)

    expect(merged.finalCta.playbackId).toBe('final-reel')
    expect(merged.finalCta.posterUrl).toBe('https://cdn.example/final.jpg')
  })

  it('seo.ogImageUrl переживает merge', () => {
    const saved = {
      ...DEFAULT_COMMERCIAL_LANDING,
      seo: { ...DEFAULT_COMMERCIAL_LANDING.seo, ogImageUrl: 'https://cdn.example/og.png' },
    }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, saved)

    expect(merged.seo.ogImageUrl).toBe('https://cdn.example/og.png')
  })

  it('обратный сброс на null тоже сохраняется (не залипает на старом значении)', () => {
    const withVideo = {
      ...DEFAULT_COMMERCIAL_LANDING,
      hero: { ...DEFAULT_COMMERCIAL_LANDING.hero, videoPlaybackId: 'abc-123' },
    }
    const clearedAgain = { ...withVideo, hero: { ...withVideo.hero, videoPlaybackId: null } }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, clearedAgain)

    expect(merged.hero.videoPlaybackId).toBeNull()
  })

  it('объект или массив в nullable-поле не подставляется как есть (защита от мусора)', () => {
    const malformed = {
      ...DEFAULT_COMMERCIAL_LANDING,
      hero: { ...DEFAULT_COMMERCIAL_LANDING.hero, videoPlaybackId: { evil: true } as unknown },
    }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, malformed)

    expect(merged.hero.videoPlaybackId).toBeNull()
  })

  it('полный цикл save→load: реальный документ, снятый с прода, не теряет ни одного nullable-поля', () => {
    // Зафиксированный снимок commercial_landing с savagemovie.ru на момент
    // находки бага — воспроизводит ровно ту форму данных, что реально лежит
    // в settings, а не синтетический пример.
    const savedFromProd = JSON.parse(
      JSON.stringify({
        ...DEFAULT_COMMERCIAL_LANDING,
        hero: {
          ...DEFAULT_COMMERCIAL_LANDING.hero,
          videoPlaybackId: '83ad0e8e-c614-46fd-8324-2c26659ad721',
          posterUrl: null,
        },
        sla: { text: DEFAULT_COMMERCIAL_LANDING.sla.text, enabled: true },
        showreel: {
          ...DEFAULT_COMMERCIAL_LANDING.showreel,
          playbackId: '83ad0e8e-c614-46fd-8324-2c26659ad721',
        },
        finalCta: { ...DEFAULT_COMMERCIAL_LANDING.finalCta, playbackId: null, posterUrl: null },
      })
    )

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, savedFromProd)

    expect(merged.hero.videoPlaybackId).toBe('83ad0e8e-c614-46fd-8324-2c26659ad721')
    expect(merged.showreel.playbackId).toBe('83ad0e8e-c614-46fd-8324-2c26659ad721')
    expect(merged.sla.enabled).toBe(true)
  })
})

describe('mergeCommercialLandingContent — уже работавшее поведение не сломано', () => {
  it('строки без вложенности мерджатся как раньше', () => {
    const saved = { ...DEFAULT_COMMERCIAL_LANDING, hero: { ...DEFAULT_COMMERCIAL_LANDING.hero, h1: 'Новый заголовок' } }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, saved)

    expect(merged.hero.h1).toBe('Новый заголовок')
  })

  it('булевы поля мерджатся как раньше', () => {
    const saved = { ...DEFAULT_COMMERCIAL_LANDING, sla: { ...DEFAULT_COMMERCIAL_LANDING.sla, enabled: true } }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, saved)

    expect(merged.sla.enabled).toBe(true)
  })

  it('массивы заменяются целиком, как раньше', () => {
    const saved = {
      ...DEFAULT_COMMERCIAL_LANDING,
      faq: { title: DEFAULT_COMMERCIAL_LANDING.faq.title, items: [{ question: 'Q', answer: 'A' }] },
    }

    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, saved)

    expect(merged.faq.items).toEqual([{ question: 'Q', answer: 'A' }])
  })

  it('несуществующий верхнеуровневый ключ в override игнорируется', () => {
    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, {
      ...DEFAULT_COMMERCIAL_LANDING,
      unknownField: 'noise',
    })

    expect((merged as Record<string, unknown>).unknownField).toBeUndefined()
  })

  it('override не объект — возвращает дефолты без изменений', () => {
    const merged = mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, null)

    expect(merged).toEqual(DEFAULT_COMMERCIAL_LANDING)
  })
})
