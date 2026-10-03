import { describe, expect, it } from 'vitest'

import { browserFamily, buildMetrikaParams, ttfmBucket, type MediaReport } from '../telemetry'

describe('ttfmBucket', () => {
  it.each([
    [0, 'lt500'],
    [499, 'lt500'],
    [500, 'lt1000'],
    [1999, 'lt2000'],
    [2000, 'lt4000'],
    [7999, 'lt8000'],
    [8000, 'gte8000'],
    [undefined, 'none'],
    [Number.NaN, 'none'],
    [Number.POSITIVE_INFINITY, 'none'],
  ])('%s мс → %s', (ms, bucket) => {
    expect(ttfmBucket(ms)).toBe(bucket)
  })
})

describe('browserFamily', () => {
  it.each([
    ['Mozilla/5.0 (Windows NT 10.0) Chrome/128.0 YaBrowser/24.10 Safari/537.36', 'yandex'],
    ['Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 Edg/130.0', 'edge'],
    [
      'Mozilla/5.0 (Linux; Android 14) Chrome/130.0 SamsungBrowser/25.0 Mobile Safari/537.36',
      'samsung',
    ],
    ['Mozilla/5.0 (Macintosh; rv:130.0) Gecko/20100101 Firefox/130.0', 'firefox'],
    ['Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/130.0 Mobile Safari/604.1', 'chrome'],
    ['Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15', 'safari'],
    ['curl/8.0', 'other'],
  ])('%s', (ua, family) => {
    expect(browserFamily(ua)).toBe(family)
  })
})

describe('buildMetrikaParams', () => {
  const ua = 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36'
  const visible: MediaReport = {
    kind: 'visible',
    name: 'showreel',
    src: 'mp4',
    cls: 'd',
    ttfm: 1234.6,
  }

  it('visible: исход с корзиной TTFM и точное значение отдельно', () => {
    expect(buildMetrikaParams(visible, ua)).toEqual({
      media: { showreel: { 'chrome-d': { mp4: 'visible:lt2000' } } },
      media_ttfm_ms: { showreel: 1235 },
    })
  })

  it('failed и off не несут ttfm', () => {
    const params = buildMetrikaParams({ kind: 'failed', name: 'showreel', src: 'stream' }, ua)!
    expect(params.media).toEqual({ showreel: { 'chrome-d': { stream: 'failed' } } })
    expect(params).not.toHaveProperty('media_ttfm_ms')
  })

  it('stall-check без остановок ничего не шлёт', () => {
    expect(buildMetrikaParams({ kind: 'stall-check', name: 'showreel', stalls: 0 }, ua)).toBeNull()
  })

  it('stall-check с остановками шлёт счётчики', () => {
    expect(
      buildMetrikaParams({ kind: 'stall-check', name: 'showreel', stalls: 2, degrades: 1 }, ua)
    ).toEqual({ media_stall: { showreel: { chrome: 's2d1' } } })
  })

  it('в параметрах только строки и числа: Метрика не принимает остальное', () => {
    const walk = (value: unknown): void => {
      if (value && typeof value === 'object') Object.values(value).forEach(walk)
      else expect(['string', 'number']).toContain(typeof value)
    }
    walk(buildMetrikaParams(visible, ua))
  })
})
