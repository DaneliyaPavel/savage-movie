/**
 * normalizePosterUrl должна знать точный контракт URL — Bunny Stream
 * (*.b-cdn.net) отдаёт анимированный preview.webp и статичный thumbnail.jpg
 * на одном video id, поэтому подмена безопасна только для этого хоста.
 * Для произвольного стороннего URL нет никакой гарантии, что thumbnail.jpg
 * там вообще существует — такой URL трогать нельзя.
 */
import { describe, expect, it } from 'vitest'

import { normalizePosterUrl } from '../poster-url'

describe('normalizePosterUrl', () => {
  it('Bunny preview.webp → статичный thumbnail.jpg', () => {
    expect(
      normalizePosterUrl('https://vz-a08b303a-cb8.b-cdn.net/22af0815-43ac-4322/preview.webp')
    ).toBe('https://vz-a08b303a-cb8.b-cdn.net/22af0815-43ac-4322/thumbnail.jpg')
  })

  it('Bunny preview.webp с query (?v=cache-bust) → статичный thumbnail.jpg', () => {
    expect(
      normalizePosterUrl(
        'https://vz-a08b303a-cb8.b-cdn.net/22af0815-43ac-4322/preview.webp?v=1774713372'
      )
    ).toBe('https://vz-a08b303a-cb8.b-cdn.net/22af0815-43ac-4322/thumbnail.jpg')
  })

  it('сторонний preview.webp не с Bunny — URL не трогаем', () => {
    const url = 'https://example.com/preview.webp'
    expect(normalizePosterUrl(url)).toBe(url)
  })

  it('сторонний хост с похожим путём — тоже не трогаем', () => {
    const url = 'https://not-b-cdn.net.evil.example/video/preview.webp'
    expect(normalizePosterUrl(url)).toBe(url)
  })

  it('Bunny URL без preview.webp (уже thumbnail.jpg) — не меняется', () => {
    const url = 'https://vz-a08b303a-cb8.b-cdn.net/22af0815-43ac-4322/thumbnail.jpg'
    expect(normalizePosterUrl(url)).toBe(url)
  })

  it('относительный путь (свой /uploads/...) — не трогаем', () => {
    const url = '/uploads/images/8ee477ba-56c6-443a-a299-f902b18e74cb.png'
    expect(normalizePosterUrl(url)).toBe(url)
  })

  it('невалидный URL не роняет вызов', () => {
    expect(normalizePosterUrl('not a url')).toBe('not a url')
  })
})
