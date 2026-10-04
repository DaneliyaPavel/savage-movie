/**
 * Плитка ленты 180 px берёт мобильный набор записи на любом экране: постеры 480/960 px и
 * превью 960×540 вместо 1280/1920 px и MP4 до 2,6 МБ.
 */
import { describe, expect, it } from 'vitest'

import { getMediaSpec } from '../manifest'
import { toTileSpec } from '../tile-spec'

describe('toTileSpec', () => {
  it('landscape: мобильный постер и мобильное превью и для десктопа', () => {
    const spec = getMediaSpec('project-ohtapark')
    expect(spec).not.toBeNull()
    const tile = toTileSpec(spec!)
    expect(tile.poster.desktop).toBe(spec!.poster.mobile)
    expect(tile.poster.mobile).toBe(spec!.poster.mobile)
    expect(tile.mp4.desktop).toBe(spec!.mp4.mobile)
    expect(tile.mp4.mobile).toBe(spec!.mp4.mobile)
    expect(tile.key).toBe(spec!.key)
  })

  it('превью только десктопное: берёт его', () => {
    const spec = getMediaSpec('project-ohtapark')!
    const tile = toTileSpec({ ...spec, mp4: { desktop: 'd.mp4' } })
    expect(tile.mp4).toEqual({ desktop: 'd.mp4', mobile: 'd.mp4' })
  })

  it('вертикальный мобильный кроп не трогает', () => {
    const spec = getMediaSpec('showreel')!
    const portrait = {
      ...spec,
      poster: { ...spec.poster, mobile: { ...spec.poster.mobile, width: 540, height: 960 } },
    }
    expect(toTileSpec(portrait)).toBe(portrait)
  })
})
