/**
 * Единственное место, где сайт создаёт hls.js.
 *
 * До этого `new Hls({...})` лежал в семи файлах с разными настройками:
 * где-то startLevel -1 (первый сегмент — самый низкий уровень, отсюда
 * «мыло» в первых секундах), где-то без обработчика ошибок (любая сетевая
 * ошибка оставляла чёрный <video> навсегда), где-то без destroy при
 * размонтировании. Здесь это решено один раз:
 *
 *   — выбор стратегии: нативный HLS (Safari/iOS), hls.js (MSE) или ничего;
 *     нативность определяем по WebKit, а не по canPlayType: Chrome 124+
 *     отвечает на canPlayType HLS «maybe», но играть его нативно не умеет
 *     надёжно, и именно этот ответ раньше уводил Chrome мимо hls.js;
 *   — режим background (карточки, фоновые лупы): уровень фиксируется под
 *     размер контейнера и устройство, ABR только опускает, а не «разгоняет»
 *     с самого низкого кадра; режим player (контролы, весь фильм): обычный ABR;
 *   — ограничение буфера, retry-политики с backoff, восстановление после
 *     NETWORK/MEDIA-ошибок, остановка загрузки в скрытой вкладке;
 *   — destroy освобождает всё; фатальная ошибка отдаётся наверх, поверхность
 *     остаётся на постере;
 *   — телеметрия колбэком, без привязки к конкретной системе.
 *
 * hls.js подключается динамическим импортом: на страницах, где есть только
 * MP4-превью, он вообще не попадает в загрузку.
 */
import type Hls from 'hls.js'
import type { HlsConfig, LoaderConfig } from 'hls.js'

import { HLS_PROGRESSIVE } from './config'

export type HlsUseCase = 'background' | 'player'
export type HlsStrategy = 'native' | 'hlsjs' | 'none'

export interface HlsControllerOptions {
  /** Полный URL playlist.m3u8 */
  src: string
  useCase: HlsUseCase
  /** Размер контейнера в CSS-пикселях: по нему выбирается уровень в режиме background */
  containerSize?: () => { width: number; height: number }
  /** Начать загрузку сразу (по умолчанию да) */
  autoStart?: boolean
  /** Принудительно включить/выключить hls.js `progressive` (по умолчанию флаг сборки) */
  progressive?: boolean
  /** Фатальная ошибка, после которой поток не восстановить */
  onFatal?: (reason: string) => void
  /** Лёгкая телеметрия: manifest, level, first-frag, error, recover */
  onTelemetry?: (event: string, data?: Record<string, unknown>) => void
}

export interface HlsController {
  readonly strategy: HlsStrategy
  startLoad(): void
  stopLoad(): void
  destroy(): void
}

/* ───────────────────────── выбор стратегии ───────────────────────── */

export interface StrategyEnv {
  userAgent: string
  platform: string
  maxTouchPoints: number
  /** Hls.isSupported() */
  mseSupported: boolean
  /** video.canPlayType('application/vnd.apple.mpegurl') */
  nativeHls: boolean
}

/** iOS/iPadOS (любой браузер: все на WebKit) и десктопный Safari */
export function isAppleWebKit(
  env: Pick<StrategyEnv, 'userAgent' | 'platform' | 'maxTouchPoints'>
): boolean {
  const ua = env.userAgent
  if (/iP(hone|ad|od)/.test(ua)) return true
  // iPadOS 13+ выдаёт себя за Mac, но у него есть тач
  if (env.platform === 'MacIntel' && env.maxTouchPoints > 1) return true
  // десктопный Safari: в UA есть Safari и нет маркеров Chromium-семейства
  return (
    /Safari\//.test(ua) &&
    !/(Chrome|Chromium|CriOS|FxiOS|Edg|OPR|YaBrowser|SamsungBrowser)/.test(ua)
  )
}

export function pickStrategy(env: StrategyEnv): HlsStrategy {
  // Apple: нативный HLS надёжнее MSE и экономит заряд
  if (isAppleWebKit(env) && env.nativeHls) return 'native'
  if (env.mseSupported) return 'hlsjs'
  if (env.nativeHls) return 'native'
  return 'none'
}

/* ───────────────────────── конфигурация hls.js ───────────────────────── */

function loadPolicy(opts: {
  ttfbMs: number
  loadMs: number
  errorRetries: number
  errorDelayMs: number
  errorMaxDelayMs: number
  timeoutRetries: number
}): { default: LoaderConfig } {
  return {
    default: {
      maxTimeToFirstByteMs: opts.ttfbMs,
      maxLoadTimeMs: opts.loadMs,
      timeoutRetry: { maxNumRetry: opts.timeoutRetries, retryDelayMs: 0, maxRetryDelayMs: 0 },
      errorRetry: {
        maxNumRetry: opts.errorRetries,
        retryDelayMs: opts.errorDelayMs,
        maxRetryDelayMs: opts.errorMaxDelayMs,
        backoff: 'exponential',
      },
    },
  }
}

export function buildHlsConfig(useCase: HlsUseCase, progressive: boolean): Partial<HlsConfig> {
  const background = useCase === 'background'
  return {
    enableWorker: true,
    lowLatencyMode: false,
    // Фон не копит запас: достаточно, чтобы сцена не спотыкалась
    maxBufferLength: background ? 12 : 30,
    maxMaxBufferLength: background ? 20 : 60,
    maxBufferSize: background ? 24 * 1000 * 1000 : 60 * 1000 * 1000,
    maxBufferHole: 0.5,
    backBufferLength: background ? 8 : 30,
    // Без пробного сегмента для измерения скорости: он сам по себе тратит канал
    testBandwidth: false,
    // Первая оценка скорости достаточно высокая, чтобы ABR не стартовал с нижнего уровня
    abrEwmaDefaultEstimate: 5_000_000,
    startFragPrefetch: true,
    progressive,
    // background фиксирует потолок сам (по контейнеру), player — по размеру плеера
    capLevelToPlayerSize: !background,
    manifestLoadPolicy: loadPolicy({
      ttfbMs: 8000,
      loadMs: 20000,
      errorRetries: 3,
      errorDelayMs: 800,
      errorMaxDelayMs: 6000,
      timeoutRetries: 2,
    }),
    playlistLoadPolicy: loadPolicy({
      ttfbMs: 8000,
      loadMs: 20000,
      errorRetries: 3,
      errorDelayMs: 800,
      errorMaxDelayMs: 6000,
      timeoutRetries: 2,
    }),
    fragLoadPolicy: loadPolicy({
      ttfbMs: 10000,
      loadMs: 120000,
      errorRetries: 4,
      errorDelayMs: 1000,
      errorMaxDelayMs: 8000,
      timeoutRetries: 2,
    }),
  }
}

/**
 * Какой уровень нужен контейнеру: ближайший сверху к физической высоте блока
 * (CSS-пиксели × DPR, но не больше 2×), в пределах 360–1080. Отдельная чистая
 * функция, чтобы её можно было проверить без hls.js.
 */
export function pickLevelIndex(
  heights: number[],
  container: { width: number; height: number },
  dpr: number
): number {
  if (!heights.length) return -1
  const scale = Math.min(Math.max(dpr, 1), 2)
  const need = Math.min(
    1080,
    Math.max(360, Math.max(container.height, (container.width * 9) / 16) * scale)
  )
  let best = -1
  let bestHeight = Infinity
  let tallest = 0
  let tallestIdx = 0
  heights.forEach((h, i) => {
    if (h > tallest) {
      tallest = h
      tallestIdx = i
    }
    if (h >= need && h < bestHeight) {
      best = i
      bestHeight = h
    }
  })
  return best === -1 ? tallestIdx : best
}

/* ───────────────────────── контроллер ───────────────────────── */

const MAX_NETWORK_RECOVERIES = 3

function readEnv(video: HTMLVideoElement, mseSupported: boolean): StrategyEnv {
  const nav = typeof navigator === 'undefined' ? null : navigator
  return {
    userAgent: nav?.userAgent ?? '',
    platform: nav?.platform ?? '',
    maxTouchPoints: nav?.maxTouchPoints ?? 0,
    mseSupported,
    nativeHls: !!video.canPlayType('application/vnd.apple.mpegurl'),
  }
}

export async function createHlsController(
  video: HTMLVideoElement,
  options: HlsControllerOptions
): Promise<HlsController> {
  const { src, useCase, onFatal, onTelemetry } = options
  const progressive = options.progressive ?? HLS_PROGRESSIVE
  const tel = (event: string, data?: Record<string, unknown>) => {
    try {
      onTelemetry?.(event, data)
    } catch {
      /* телеметрия не имеет права ломать плеер */
    }
  }

  // hls.js нужен только вне нативного пути: импортируем лениво и один раз
  const hlsModule = await import('hls.js')
  const HlsCtor = hlsModule.default
  const mseSupported = HlsCtor.isSupported()
  const strategy = pickStrategy(readEnv(video, mseSupported))
  tel('strategy', { strategy })

  if (strategy === 'none') {
    onFatal?.('unsupported')
    return { strategy, startLoad() {}, stopLoad() {}, destroy() {} }
  }

  if (strategy === 'native') {
    video.src = src
    let destroyed = false
    return {
      strategy,
      startLoad() {
        if (!destroyed && !video.src) video.src = src
      },
      stopLoad() {},
      destroy() {
        destroyed = true
        video.removeAttribute('src')
        try {
          video.load()
        } catch {
          /* ignore */
        }
      },
    }
  }

  // Загрузку сегментов запускаем сами после выбора уровня: иначе первый сегмент
  // уходит с уровнем по умолчанию, и именно он оказывается «мыльным»
  const hls: Hls = new HlsCtor({
    ...buildHlsConfig(useCase, progressive),
    autoStartLoad: false,
  })

  let destroyed = false
  let manifestParsed = false
  let wantLoad = options.autoStart !== false
  let networkRecoveries = 0
  let lastMediaRecovery = 0
  let swappedAudio = false
  let firstFragSeen = false
  const started = typeof performance === 'undefined' ? 0 : performance.now()

  const onManifestParsed = () => {
    manifestParsed = true
    tel('manifest', { levels: hls.levels.length })
    if (useCase === 'background') pinLevel()
    if (wantLoad) hls.startLoad(-1)
  }

  const pinLevel = () => {
    const heights = hls.levels.map(l => l.height || 0)
    const size = options.containerSize
      ? options.containerSize()
      : { width: video.clientWidth, height: video.clientHeight }
    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    const idx = pickLevelIndex(heights, size, dpr)
    if (idx >= 0) {
      // Старт сразу с нужного уровня, потолок — он же: ABR может только опустить
      hls.startLevel = idx
      hls.autoLevelCapping = idx
      tel('level-pinned', { idx, height: heights[idx] })
    }
  }

  const onFragBuffered = () => {
    networkRecoveries = 0
    if (firstFragSeen) return
    firstFragSeen = true
    tel('first-frag', {
      ms: Math.round((typeof performance === 'undefined' ? 0 : performance.now()) - started),
    })
  }

  const onLevelSwitched = (_e: unknown, data: { level: number }) => {
    tel('level', { level: data.level, height: hls.levels[data.level]?.height })
  }

  const onError = (_e: unknown, data: { fatal: boolean; type: string; details: string }) => {
    tel('error', { type: data.type, details: data.details, fatal: data.fatal })
    if (!data.fatal || destroyed) return
    const E = HlsCtor.ErrorTypes
    if (data.type === E.NETWORK_ERROR && networkRecoveries < MAX_NETWORK_RECOVERIES) {
      networkRecoveries++
      const delay = 1000 * 2 ** (networkRecoveries - 1)
      tel('recover', { kind: 'network', n: networkRecoveries, delay })
      setTimeout(() => {
        if (!destroyed) hls.startLoad(-1)
      }, delay)
      return
    }
    if (data.type === E.MEDIA_ERROR) {
      const t = typeof performance === 'undefined' ? 0 : performance.now()
      if (t - lastMediaRecovery > 3000) {
        lastMediaRecovery = t
        tel('recover', { kind: 'media' })
        hls.recoverMediaError()
        return
      }
      if (!swappedAudio) {
        swappedAudio = true
        tel('recover', { kind: 'media-swap-audio' })
        hls.swapAudioCodec()
        hls.recoverMediaError()
        return
      }
    }
    destroy()
    onFatal?.(`${data.type}:${data.details}`)
  }

  const onVisibility = () => {
    if (destroyed || !manifestParsed) return
    if (document.visibilityState === 'hidden') hls.stopLoad()
    else if (wantLoad) hls.startLoad(-1)
  }

  hls.on(HlsCtor.Events.MANIFEST_PARSED, onManifestParsed)
  hls.on(HlsCtor.Events.FRAG_BUFFERED, onFragBuffered)
  hls.on(HlsCtor.Events.LEVEL_SWITCHED, onLevelSwitched)
  hls.on(HlsCtor.Events.ERROR, onError)
  document.addEventListener('visibilitychange', onVisibility)

  function destroy() {
    if (destroyed) return
    destroyed = true
    document.removeEventListener('visibilitychange', onVisibility)
    try {
      hls.destroy()
    } catch {
      /* ignore */
    }
  }

  hls.loadSource(src)
  hls.attachMedia(video)

  return {
    strategy,
    startLoad() {
      wantLoad = true
      if (!destroyed && manifestParsed) hls.startLoad(-1)
    },
    stopLoad() {
      wantLoad = false
      if (!destroyed) hls.stopLoad()
    },
    destroy,
  }
}
