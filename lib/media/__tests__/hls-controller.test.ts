/**
 * Чистые части HLS-фабрики: выбор стратегии, выбор уровня, конфигурация.
 * Сам hls.js здесь не нужен — именно поэтому логика вынесена в чистые функции.
 */
import { describe, expect, it } from 'vitest'

import {
  buildHlsConfig,
  isAppleWebKit,
  pickLevelIndex,
  pickStrategy,
  type StrategyEnv,
} from '../hls-controller'

const UA = {
  chromeMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
  yandex:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 YaBrowser/24.10.0.0 Safari/537.36',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
}

function env(partial: Partial<StrategyEnv>): StrategyEnv {
  return {
    userAgent: UA.chromeMac,
    platform: 'MacIntel',
    maxTouchPoints: 0,
    mseSupported: true,
    nativeHls: false,
    ...partial,
  }
}

describe('isAppleWebKit', () => {
  it.each([
    ['Safari macOS', UA.safariMac, 'MacIntel', 0, true],
    ['iPhone Safari', UA.iphoneSafari, 'iPhone', 5, true],
    ['iPhone Chrome (WebKit под капотом)', UA.iphoneChrome, 'iPhone', 5, true],
    ['iPadOS под видом Mac', UA.chromeMac, 'MacIntel', 5, true],
    ['Chrome macOS', UA.chromeMac, 'MacIntel', 0, false],
    ['Яндекс Браузер', UA.yandex, 'Win32', 0, false],
    ['Android Chrome', UA.androidChrome, 'Linux armv81', 5, false],
  ])('%s', (_name, userAgent, platform, maxTouchPoints, expected) => {
    expect(isAppleWebKit({ userAgent, platform, maxTouchPoints })).toBe(expected)
  })
})

describe('pickStrategy', () => {
  it('Safari и iOS играют HLS нативно, даже если MSE есть', () => {
    expect(pickStrategy(env({ userAgent: UA.safariMac, nativeHls: true }))).toBe('native')
    expect(
      pickStrategy(env({ userAgent: UA.iphoneSafari, platform: 'iPhone', nativeHls: true }))
    ).toBe('native')
  })

  it('Chrome с canPlayType «maybe» всё равно идёт через hls.js', () => {
    // Chrome 124+ отвечает на canPlayType HLS утвердительно; раньше это уводило его мимо hls.js
    expect(pickStrategy(env({ nativeHls: true, mseSupported: true }))).toBe('hlsjs')
  })

  it('без MSE остаётся нативный HLS, а если нет и его — ничего', () => {
    expect(pickStrategy(env({ mseSupported: false, nativeHls: true }))).toBe('native')
    expect(pickStrategy(env({ mseSupported: false, nativeHls: false }))).toBe('none')
  })
})

describe('pickLevelIndex', () => {
  const ladder = [360, 540, 720, 1080]

  it('берёт ближайший сверху к физической высоте блока', () => {
    // 640×360 при DPR 1: нужно 360
    expect(pickLevelIndex(ladder, { width: 640, height: 360 }, 1)).toBe(0)
    // 640×360 при DPR 2: 720
    expect(pickLevelIndex(ladder, { width: 640, height: 360 }, 2)).toBe(2)
  })

  it('DPR выше 2 не раздувает уровень', () => {
    expect(pickLevelIndex(ladder, { width: 640, height: 360 }, 3)).toBe(2)
  })

  it('полноэкранный блок упирается в 720, а не в самый высокий из возможных', () => {
    expect(pickLevelIndex([360, 720, 1080, 2160], { width: 2560, height: 1440 }, 2)).toBe(1)
    expect(pickLevelIndex([360, 540, 720, 1080], { width: 1920, height: 1080 }, 1)).toBe(2)
  })

  it('крошечный блок не опускается ниже 360', () => {
    expect(pickLevelIndex(ladder, { width: 120, height: 68 }, 1)).toBe(0)
  })

  it('если подходящего уровня нет, берётся самый высокий', () => {
    expect(pickLevelIndex([240, 360], { width: 1920, height: 1080 }, 1)).toBe(1)
  })

  it('пустая лестница даёт -1', () => {
    expect(pickLevelIndex([], { width: 100, height: 100 }, 1)).toBe(-1)
  })

  it('уровни без высоты не закрепляются: решает ABR', () => {
    expect(pickLevelIndex([0, 0, 0], { width: 1920, height: 1080 }, 1)).toBe(-1)
  })
})

describe('buildHlsConfig', () => {
  it('фон держит маленький буфер, плеер — большой', () => {
    const bg = buildHlsConfig('background', false)
    const player = buildHlsConfig('player', false)
    expect(bg.maxBufferLength!).toBeLessThan(player.maxBufferLength!)
    expect(bg.maxMaxBufferLength!).toBeLessThan(player.maxMaxBufferLength!)
  })

  it('progressive — это флаг, а не константа', () => {
    expect(buildHlsConfig('background', true).progressive).toBe(true)
    expect(buildHlsConfig('background', false).progressive).toBe(false)
  })

  it('ABR не стартует с нижнего уровня: нет пробного сегмента и высокая первая оценка', () => {
    const cfg = buildHlsConfig('background', false)
    expect(cfg.testBandwidth).toBe(false)
    expect(cfg.abrEwmaDefaultEstimate!).toBeGreaterThanOrEqual(5_000_000)
  })

  it('фон ограничивает уровень сам, плеер — по размеру плеера', () => {
    expect(buildHlsConfig('background', false).capLevelToPlayerSize).toBe(false)
    expect(buildHlsConfig('player', false).capLevelToPlayerSize).toBe(true)
  })

  it('у загрузок есть таймауты и ретраи с экспоненциальным backoff', () => {
    const policy = buildHlsConfig('player', false).fragLoadPolicy!.default
    expect(policy.maxTimeToFirstByteMs).toBeGreaterThan(0)
    expect(policy.errorRetry!.maxNumRetry).toBeGreaterThan(0)
    expect(policy.errorRetry!.backoff).toBe('exponential')
  })
})
