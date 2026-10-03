/**
 * Машина состояний загрузчика медиа-поверхностей (lib/media/boot/boot.ts).
 *
 * Тест гоняет настоящий исходник, а не копию логики: на изолированном документе,
 * с поддельными <video>, IntersectionObserver и matchMedia и с управляемыми
 * часами. Проверяются те инварианты, ради которых слой написан:
 *
 *   — видео не показывается, пока не показан движущийся кадр (нет чёрного кадра);
 *   — на мобильном не скачивается десктопный файл и наоборот;
 *   — карточки вне экрана не тянут ни байта видео, одновременно не больше двух;
 *   — любая ошибка оставляет постер, а не пустой <video>;
 *   — reduced motion и экономия трафика дают постер без запроса.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { installMediaBoot, type SmApi, type SmEvent } from '../boot'

/* ───────────────────────── поддельное окружение ───────────────────────── */

type Listener = () => void

interface FakeMedia {
  matches: boolean
  listeners: Set<Listener>
}

class FakeIO {
  static instances: FakeIO[] = []
  targets = new Set<Element>()
  constructor(
    private cb: (entries: unknown[]) => void,
    readonly options: { rootMargin?: string; threshold?: number | number[] }
  ) {
    FakeIO.instances.push(this)
  }
  observe(el: Element) {
    this.targets.add(el)
  }
  unobserve(el: Element) {
    this.targets.delete(el)
  }
  disconnect() {
    this.targets.clear()
  }
  trigger(target: Element, ratio: number) {
    this.cb([{ target, isIntersecting: ratio > 0, intersectionRatio: ratio }])
  }
}

interface VideoState {
  readyState: number
  duration: number
  currentTime: number
  paused: boolean
  networkState: number
  ranges: Array<[number, number]>
  error: { code: number } | null
  playCalls: number
  pauseCalls: number
  loadCalls: number
  playError: string | null
  frameCallbacks: Array<(now: number, meta: { mediaTime: number; presentedFrames: number }) => void>
}

interface Surface {
  el: HTMLElement
  video: HTMLVideoElement
  img: HTMLImageElement
  v: VideoState
}

interface SurfaceOptions {
  hero?: boolean
  play?: 'auto' | 'hover' | 'hover-only'
  srcD?: string
  srcM?: string
  stream?: string
  only?: string
  hoverScope?: string
  afterHero?: boolean
  holdUntil?: string
  buffer?: number
  load?: 'eager' | 'near'
  active?: 'off'
}

function createHarness(
  opts: { reduced?: boolean; saveData?: boolean; finePointer?: boolean } = {}
) {
  FakeIO.instances = []
  const start = Date.now()
  const doc = document.implementation.createHTMLDocument('media-boot')
  let visibility: DocumentVisibilityState = 'visible'
  Object.defineProperty(doc, 'visibilityState', { get: () => visibility, configurable: true })

  const media = new Map<string, FakeMedia>()
  const mediaFor = (query: string): FakeMedia => {
    let entry = media.get(query)
    if (!entry) {
      const defaults: Record<string, boolean> = {
        '(prefers-reduced-motion: reduce)': opts.reduced ?? false,
        '(hover: hover) and (pointer: fine)': opts.finePointer ?? true,
      }
      entry = { matches: defaults[query] ?? false, listeners: new Set() }
      media.set(query, entry)
    }
    return entry
  }

  const target = new EventTarget()
  const win = {
    document: doc,
    navigator: {
      connection: opts.saveData ? { saveData: true, effectiveType: '4g' } : undefined,
    },
    performance: { now: () => Date.now() - start, mark: () => undefined },
    matchMedia: (query: string) => {
      const entry = mediaFor(query)
      return {
        get matches() {
          return entry.matches
        },
        media: query,
        addEventListener: (_type: string, fn: Listener) => entry.listeners.add(fn),
        removeEventListener: (_type: string, fn: Listener) => entry.listeners.delete(fn),
      }
    },
    IntersectionObserver: FakeIO,
    MutationObserver,
    CustomEvent,
    HTMLElement,
    setTimeout: (fn: () => void, ms?: number) => setTimeout(fn, ms),
    requestAnimationFrame: (fn: () => void) => setTimeout(fn, 16),
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
  }

  const api: SmApi = installMediaBoot(win as unknown as Parameters<typeof installMediaBoot>[0])

  const nearIO = () => FakeIO.instances.find(io => io.options.rootMargin)!
  const viewIO = () => FakeIO.instances.find(io => !io.options.rootMargin)!

  function makeVideo(video: HTMLVideoElement): VideoState {
    const v: VideoState = {
      readyState: 0,
      duration: Number.NaN,
      currentTime: 0,
      paused: true,
      networkState: 0,
      ranges: [],
      error: null,
      playCalls: 0,
      pauseCalls: 0,
      loadCalls: 0,
      playError: null,
      frameCallbacks: [],
    }
    Object.defineProperties(video, {
      readyState: { get: () => v.readyState, configurable: true },
      duration: { get: () => v.duration, configurable: true },
      currentTime: {
        get: () => v.currentTime,
        set: (value: number) => {
          v.currentTime = value
        },
        configurable: true,
      },
      paused: { get: () => v.paused, configurable: true },
      networkState: { get: () => v.networkState, configurable: true },
      error: { get: () => v.error, configurable: true },
      buffered: {
        get: () => ({
          length: v.ranges.length,
          start: (i: number) => v.ranges[i]![0],
          end: (i: number) => v.ranges[i]![1],
        }),
        configurable: true,
      },
    })
    const extra = video as unknown as Record<string, unknown>
    extra.play = () => {
      v.playCalls++
      if (v.playError)
        return Promise.reject(Object.assign(new Error(v.playError), { name: v.playError }))
      v.paused = false
      return Promise.resolve()
    }
    extra.pause = () => {
      v.pauseCalls++
      v.paused = true
    }
    extra.load = () => {
      v.loadCalls++
    }
    extra.requestVideoFrameCallback = (cb: VideoState['frameCallbacks'][number]) => {
      v.frameCallbacks.push(cb)
      return v.frameCallbacks.length
    }
    return v
  }

  function addSurface(o: SurfaceOptions = {}, parent: Element = doc.body): Surface {
    const el = doc.createElement('div')
    el.setAttribute('data-sm', '')
    el.setAttribute('data-sm-name', 'test')
    el.setAttribute('data-sm-state', 'poster')
    el.setAttribute('data-sm-mq', '(max-width: 767px)')
    el.setAttribute('data-sm-load', o.load ?? (o.hero ? 'eager' : 'near'))
    el.setAttribute('data-sm-play', o.play ?? 'auto')
    if (o.hero) el.setAttribute('data-sm-hero', '')
    if (o.srcD !== undefined) el.setAttribute('data-sm-src-d', o.srcD)
    else if (!o.stream && o.srcM === undefined) el.setAttribute('data-sm-src-d', '/media/d.mp4')
    if (o.srcM !== undefined) el.setAttribute('data-sm-src-m', o.srcM)
    if (o.stream) el.setAttribute('data-sm-stream', o.stream)
    if (o.only) el.setAttribute('data-sm-only', o.only)
    if (o.hoverScope) el.setAttribute('data-sm-hover-scope', o.hoverScope)
    if (o.afterHero) el.setAttribute('data-sm-after', 'hero')
    if (o.holdUntil) el.setAttribute('data-sm-hold-until', o.holdUntil)
    if (o.buffer) el.setAttribute('data-sm-buffer', String(o.buffer))
    if (o.active) el.setAttribute('data-sm-active', o.active)
    const img = doc.createElement('img')
    const video = doc.createElement('video')
    el.append(img, video)
    const v = makeVideo(video)
    parent.append(el)
    return { el, video, img, v }
  }

  const fire = (video: HTMLVideoElement, type: string) => video.dispatchEvent(new Event(type))
  const flush = () => vi.advanceTimersByTimeAsync(0)
  const advance = (ms: number) => vi.advanceTimersByTimeAsync(ms)

  /** Файл докачан до end секунд: события, которые шлёт браузер, и их порядок */
  function buffer(s: Surface, end: number, extra: Partial<VideoState> = {}) {
    Object.assign(s.v, { duration: 8.04, ranges: [[0, end]], ...extra })
    if (s.v.readyState < 2 && end > 0.2) s.v.readyState = 3
    fire(s.video, 'loadedmetadata')
    fire(s.video, 'loadeddata')
    fire(s.video, 'progress')
  }

  /** Довести поверхность до SAFE и запуска воспроизведения */
  async function reachSafe(s: Surface) {
    await flush()
    buffer(s, 3.2)
    fire(s.video, 'canplaythrough')
    await flush()
  }

  /** Браузер показал кадр с таким mediaTime */
  function presentFrame(s: Surface, mediaTime: number) {
    const cbs = s.v.frameCallbacks.splice(0)
    s.v.currentTime = Math.max(s.v.currentTime, mediaTime)
    cbs.forEach(cb => cb(0, { mediaTime, presentedFrames: 1 }))
  }

  const state = (s: Surface) => s.el.getAttribute('data-sm-state')
  const types = (type: string) => api.events.filter((e: SmEvent) => e.type === type)
  const report = (kind: string) =>
    api.events.find((e: SmEvent) => e.type === 'report' && e.kind === kind)

  return {
    api,
    doc,
    win,
    media,
    mediaFor,
    nearIO,
    viewIO,
    addSurface,
    makeVideo,
    fire,
    flush,
    advance,
    buffer,
    reachSafe,
    presentFrame,
    state,
    types,
    report,
    setVisibility(next: DocumentVisibilityState) {
      visibility = next
      doc.dispatchEvent(new Event('visibilitychange'))
    },
    setMedia(query: string, matches: boolean) {
      const entry = mediaFor(query)
      entry.matches = matches
      entry.listeners.forEach(fn => fn())
    },
  }
}

type Harness = ReturnType<typeof createHarness>

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

/* ───────────────────────── выбор источника ───────────────────────── */

describe('источник видео', () => {
  it('на десктопе берётся десктопный MP4, мобильный не запрашивается', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, srcD: '/media/d.mp4', srcM: '/media/m.mp4' })
    await h.flush()

    expect(s.video.getAttribute('src')).toBe('/media/d.mp4')
    expect(h.state(s)).toBe('loading')
    expect(h.types('request')[0]).toMatchObject({ src: 'mp4', cls: 'd' })
  })

  it('на мобильном берётся мобильный MP4, десктопный не запрашивается', async () => {
    const h = createHarness()
    h.setMedia('(max-width: 767px)', true)
    const s = h.addSurface({ hero: true, srcD: '/media/d.mp4', srcM: '/media/m.mp4' })
    await h.flush()

    expect(s.video.getAttribute('src')).toBe('/media/m.mp4')
    expect(h.types('request')[0]).toMatchObject({ cls: 'm' })
  })

  it('если есть один вариант, он используется на обоих размерах', async () => {
    const h = createHarness()
    h.setMedia('(max-width: 767px)', true)
    const s = h.addSurface({ hero: true, srcD: '/media/only.mp4' })
    await h.flush()
    expect(s.video.getAttribute('src')).toBe('/media/only.mp4')
  })

  it('без MP4 и без stream поверхность остаётся постером и сообщает об этом', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, srcD: '' })
    await h.flush()

    expect(s.video.getAttribute('src')).toBeNull()
    expect(h.state(s)).toBe('failed')
    expect(h.report('failed')).toBeDefined()
  })

  it('источник stream не ставит src, а просит драйвер подключить HLS', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, stream: 'abc', srcD: '' })
    const loads: string[] = []
    s.el.addEventListener('sm:load', () => loads.push('load'))
    // атрибуты уже выставлены, а слушатель добавлен после attach: проверяем по want
    await h.flush()

    expect(s.video.getAttribute('src')).toBeNull()
    expect(s.el.getAttribute('data-sm-want')).toBe('1')
    expect(h.types('request')[0]).toMatchObject({ src: 'stream' })
  })

  it('при смене размера окна загруженный источник заменяется на нужный', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, srcD: '/media/d.mp4', srcM: '/media/m.mp4' })
    await h.flush()
    expect(s.video.getAttribute('src')).toBe('/media/d.mp4')

    h.setMedia('(max-width: 767px)', true)
    await h.advance(300)
    await h.flush()

    expect(h.types('source-swap')).toHaveLength(1)
    expect(s.video.getAttribute('src')).toBe('/media/m.mp4')
  })
})

/* ───────────────────────── показ без чёрного кадра ───────────────────────── */

describe('показ видео', () => {
  it('пока запаса буфера мало, воспроизведение не начинается', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.flush()
    h.buffer(s, 0.8)
    await h.flush()

    expect(h.state(s)).toBe('decoded')
    expect(s.v.playCalls).toBe(0)
  })

  it('запаса хватает → SAFE → play(), но видео ещё скрыто', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.reachSafe(s)

    expect(s.v.playCalls).toBe(1)
    expect(h.state(s)).toBe('safe')
  })

  it('видео не показывается, пока не показан кадр после нулевого', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.reachSafe(s)

    // кадр 0 нарисован: движения ещё нет, показывать рано
    h.presentFrame(s, 0)
    await h.flush()
    expect(h.state(s)).toBe('safe')

    h.presentFrame(s, 0.04)
    await h.flush()
    expect(h.state(s)).toBe('visible')
  })

  it('отчёт содержит таймлайн и TTFM', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.advance(200)
    h.buffer(s, 3.2)
    h.fire(s.video, 'canplaythrough')
    await h.flush()
    h.presentFrame(s, 0.05)
    await h.flush()

    const rep = h.report('visible')!
    expect(rep).toMatchObject({ name: 'test', src: 'mp4', cls: 'd' })
    expect(rep.ttfm).toBeTypeOf('number')
    expect(rep.requestAt).toBeLessThanOrEqual(rep.decodedAt as number)
    expect(rep.decodedAt).toBeLessThanOrEqual(rep.safeAt as number)
    expect(rep.safeAt).toBeLessThanOrEqual(rep.ttfm as number)
  })

  it('если плеер успел уйти дальше начала, его возвращают в нулевой кадр до показа', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.reachSafe(s)

    s.v.currentTime = 0.9
    h.presentFrame(s, 0.9)
    await h.flush()

    expect(s.v.currentTime).toBe(0)
    expect(s.v.paused).toBe(true)
    expect(h.state(s)).not.toBe('visible')
  })

  it('заставка держит показ, но не дольше потолка', async () => {
    const h = createHarness()
    const overlay = h.doc.createElement('div')
    overlay.className = 'preloader-overlay'
    h.doc.body.append(overlay)
    const s = h.addSurface({ hero: true, holdUntil: '.preloader-overlay' })
    await h.reachSafe(s)

    expect(h.state(s)).toBe('safe')
    expect(s.v.playCalls).toBe(0)

    // заставка ушла: воспроизведение стартует на ближайшем тике
    overlay.remove()
    await h.advance(200)
    expect(s.v.playCalls).toBe(1)
  })

  it('заставка, которая не уходит, не блокирует видео навсегда', async () => {
    const h = createHarness()
    const overlay = h.doc.createElement('div')
    overlay.className = 'preloader-overlay'
    h.doc.body.append(overlay)
    const s = h.addSurface({ hero: true, holdUntil: '.preloader-overlay' })
    await h.reachSafe(s)
    expect(s.v.playCalls).toBe(0)

    await h.advance(1200)
    expect(s.v.playCalls).toBe(1)
  })

  it('прогрев iOS: если сеть простаивает, запускается скрытое воспроизведение', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.flush()
    // метаданные есть, данных нет, браузер ничего не качает
    s.v.readyState = 1
    s.v.networkState = 1
    await h.advance(800)

    expect(h.types('kickstart')).toHaveLength(1)
    expect(s.v.playCalls).toBe(1)
    expect(h.state(s)).not.toBe('visible')
  })
})

/* ───────────────────────── ошибки: всегда остаётся постер ───────────────────────── */

describe('ошибки', () => {
  it('ошибка декодирования: состояние failed, src снят, отчёт отправлен', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.flush()

    s.v.error = { code: 4 }
    h.fire(s.video, 'error')
    await h.flush()

    expect(h.state(s)).toBe('failed')
    expect(s.video.getAttribute('src')).toBeNull()
    expect(h.report('failed')).toBeDefined()
  })

  it('сетевая ошибка MP4 повторяется один раз, потом failed', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.flush()

    s.v.error = { code: 2 }
    h.fire(s.video, 'error')
    await h.advance(900)
    expect(h.state(s)).toBe('loading')
    expect(s.video.getAttribute('src')).toBe('/media/d.mp4')

    h.fire(s.video, 'error')
    await h.flush()
    expect(h.state(s)).toBe('failed')
  })

  it('кадр не пришёл за таймаут: откат на постер и повторная попытка с большим запасом', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.reachSafe(s)

    await h.advance(1900)
    expect(h.types('frame-timeout')).toHaveLength(1)
    expect(h.types('degrade')).toHaveLength(1)
    // поверхность честно вернулась в LOADING (видео скрыто, постер на месте);
    // буфер уже есть, поэтому она сразу снова готова и пробует ещё раз
    expect(h.types('state').some(e => e.to === 'loading' && e.reason === 'frame-timeout')).toBe(
      true
    )
    expect(h.state(s)).not.toBe('visible')
    expect(s.v.currentTime).toBe(0)
    expect(s.v.pauseCalls).toBeGreaterThan(0)
  })

  it('после четвёртой неудачи поверхность сдаётся и остаётся постером', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.flush()

    for (let attempt = 0; attempt < 6; attempt++) {
      if (h.state(s) === 'failed') break
      // после каждой неудачи требуется больше запаса (до 4 с): докачиваем с избытком
      h.buffer(s, 7.5)
      h.fire(s.video, 'canplaythrough')
      await h.flush()
      await h.advance(1900)
    }

    expect(h.state(s)).toBe('failed')
    expect(h.report('failed')).toMatchObject({ degrades: 4 })
    expect(s.video.getAttribute('src')).toBeNull()
  })

  it('остановка после показа: видео возвращается на постер, а не зависает кадром', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.reachSafe(s)
    h.presentFrame(s, 0.05)
    await h.flush()
    expect(h.state(s)).toBe('visible')

    s.v.readyState = 2
    h.fire(s.video, 'waiting')
    await h.advance(800)

    expect(h.types('degrade')[0]).toMatchObject({ reason: 'stall' })
    expect(h.types('state').some(e => e.to === 'loading' && e.reason === 'stall')).toBe(true)
    // видео скрыто и снова идёт путём LOADING → SAFE, а не остаётся «visible» на замершем кадре
    expect(h.state(s)).not.toBe('visible')
    expect(s.v.currentTime).toBe(0)
  })

  it('NotAllowedError: остаёмся на постере и пробуем снова по первому жесту', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    s.v.playError = 'NotAllowedError'
    await h.reachSafe(s)

    expect(h.types('autoplay-blocked')).toHaveLength(1)
    expect(h.state(s)).toBe('safe')
    expect(s.v.playCalls).toBe(1)

    s.v.playError = null
    h.doc.dispatchEvent(new Event('pointerdown'))
    await h.flush()
    expect(s.v.playCalls).toBe(2)
  })
})

/* ───────────────────────── когда движения быть не должно ───────────────────────── */

describe('когда видео не оживает', () => {
  it('prefers-reduced-motion: постер без единого запроса видео', async () => {
    const h = createHarness({ reduced: true })
    const s = h.addSurface({ hero: true })
    await h.flush()

    expect(h.state(s)).toBe('off')
    expect(s.video.getAttribute('src')).toBeNull()
    expect(h.report('off')).toBeDefined()
  })

  it('Save-Data: постер без единого запроса видео', async () => {
    const h = createHarness({ saveData: true })
    const s = h.addSurface({ hero: true })
    await h.flush()

    expect(h.state(s)).toBe('off')
    expect(s.video.getAttribute('src')).toBeNull()
  })

  it('включили reduced motion на лету: видео выгружается', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.flush()
    expect(s.video.getAttribute('src')).toBe('/media/d.mp4')

    h.setMedia('(prefers-reduced-motion: reduce)', true)
    await h.flush()
    expect(h.state(s)).toBe('off')
    expect(s.video.getAttribute('src')).toBeNull()
  })

  it('блок «только для десктопа» на узком экране не грузит видео вовсе', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, only: '(min-width: 768px)' })
    await h.flush()

    expect(s.video.getAttribute('src')).toBeNull()
    expect(h.types('request')).toHaveLength(0)

    // экран стал шире: теперь блок оживает
    h.setMedia('(min-width: 768px)', true)
    await h.flush()
    expect(s.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('карточка вне экрана не получает ни src, ни запроса', async () => {
    const h = createHarness()
    const s = h.addSurface({ play: 'auto' })
    await h.flush()
    await h.advance(5000)

    expect(s.video.getAttribute('src')).toBeNull()
    expect(h.types('request')).toHaveLength(0)
    expect(h.state(s)).toBe('poster')
  })

  it('карточка с hover на мыши: движение только после наведения', async () => {
    const h = createHarness({ finePointer: true })
    const s = h.addSurface({ play: 'hover' })
    await h.flush()
    h.nearIO().trigger(s.el, 1)
    h.viewIO().trigger(s.el, 1)
    await h.flush()
    expect(s.video.getAttribute('src')).toBeNull()

    s.el.dispatchEvent(new Event('pointerenter'))
    await h.advance(60)
    expect(s.video.getAttribute('src')).toBeNull() // порог намерения ещё не прошёл
    await h.advance(100)
    expect(s.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('курсор прошёл мимо быстрее порога: ничего не загружается', async () => {
    const h = createHarness({ finePointer: true })
    const s = h.addSurface({ play: 'hover' })
    await h.flush()
    h.nearIO().trigger(s.el, 1)
    h.viewIO().trigger(s.el, 1)
    await h.flush()

    s.el.dispatchEvent(new Event('pointerenter'))
    await h.advance(50)
    s.el.dispatchEvent(new Event('pointerleave'))
    await h.advance(500)

    expect(s.video.getAttribute('src')).toBeNull()
  })

  it('hover по предку (data-sm-hover-scope) запускает карточку целиком', async () => {
    const h = createHarness({ finePointer: true })
    const card = h.doc.createElement('a')
    card.className = 'group'
    h.doc.body.append(card)
    const s = h.addSurface({ play: 'hover-only', hoverScope: '.group' }, card)
    await h.flush()
    h.nearIO().trigger(s.el, 1)
    h.viewIO().trigger(s.el, 1)
    await h.flush()

    card.dispatchEvent(new Event('pointerenter'))
    await h.advance(200)
    expect(s.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('hover-only на таче: движения нет вовсе, даже в кадре', async () => {
    const h = createHarness({ finePointer: false })
    const s = h.addSurface({ play: 'hover-only' })
    await h.flush()
    h.nearIO().trigger(s.el, 1)
    h.viewIO().trigger(s.el, 1)
    await h.flush()
    await h.advance(3000)

    expect(s.video.getAttribute('src')).toBeNull()
  })

  it('карточка hover на таче оживает по видимости (не меньше трети в кадре)', async () => {
    const h = createHarness({ finePointer: false })
    const s = h.addSurface({ play: 'hover' })
    await h.flush()
    h.nearIO().trigger(s.el, 1)
    h.viewIO().trigger(s.el, 0.1)
    await h.flush()
    expect(s.video.getAttribute('src')).toBeNull()

    h.viewIO().trigger(s.el, 0.8)
    await h.flush()
    expect(s.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('одновременно не больше двух превью, остальные ждут', async () => {
    const h = createHarness()
    const cards = [h.addSurface(), h.addSurface(), h.addSurface()]
    await h.flush()
    cards.forEach((card, index) => {
      h.nearIO().trigger(card.el, 1)
      h.viewIO().trigger(card.el, 1 - index * 0.2)
    })
    await h.flush()

    const loaded = cards.filter(card => card.video.getAttribute('src') !== null)
    expect(loaded).toHaveLength(2)
    // третья — наименее видимая — осталась постером
    expect(cards[2]!.video.getAttribute('src')).toBeNull()
  })

  it('hero не занимает слот карточек', async () => {
    const h = createHarness()
    const hero = h.addSurface({ hero: true })
    const cards = [h.addSurface(), h.addSurface()]
    await h.flush()
    cards.forEach(card => {
      h.nearIO().trigger(card.el, 1)
      h.viewIO().trigger(card.el, 1)
    })
    await h.flush()

    expect(hero.video.getAttribute('src')).not.toBeNull()
    cards.forEach(card => expect(card.video.getAttribute('src')).not.toBeNull())
  })

  it('afterHero: карточка ждёт, пока hero определится', async () => {
    const h = createHarness()
    const hero = h.addSurface({ hero: true })
    const card = h.addSurface({ afterHero: true })
    await h.flush()
    h.nearIO().trigger(card.el, 1)
    h.viewIO().trigger(card.el, 1)
    await h.flush()
    expect(card.video.getAttribute('src')).toBeNull()
    expect(h.api.settled).toBe(false)

    await h.reachSafe(hero)
    h.buffer(hero, 8.04)
    h.presentFrame(hero, 0.05)
    await h.flush()

    expect(h.api.settled).toBe(true)
    expect(h.types('hero-settled')).toHaveLength(1)
    expect(card.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('afterHero: hero показан, но ещё докачивается: плитки ждут конца загрузки', async () => {
    const h = createHarness()
    const hero = h.addSurface({ hero: true })
    const card = h.addSurface({ afterHero: true })
    await h.flush()
    h.nearIO().trigger(card.el, 1)
    h.viewIO().trigger(card.el, 1)
    await h.reachSafe(hero)
    h.presentFrame(hero, 0.05)
    await h.advance(1000)

    expect(h.state(hero)).toBe('visible')
    expect(h.api.settled).toBe(false)
    expect(card.video.getAttribute('src')).toBeNull()

    h.buffer(hero, 8.04)
    await h.advance(500)

    expect(h.api.settled).toBe(true)
    expect(card.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('afterHero: докачка затянулась, плитки ждут не дольше 5 с после показа', async () => {
    const h = createHarness()
    const hero = h.addSurface({ hero: true })
    const card = h.addSurface({ afterHero: true })
    await h.flush()
    h.nearIO().trigger(card.el, 1)
    h.viewIO().trigger(card.el, 1)
    await h.reachSafe(hero)
    h.presentFrame(hero, 0.05)
    await h.advance(4000)
    expect(h.api.settled).toBe(false)

    await h.advance(1500)

    expect(h.api.settled).toBe(true)
    expect(card.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('hero, который завис, отпускает страницу по таймауту загрузки (12 с), а не держит вечно', async () => {
    const h = createHarness()
    h.addSurface({ hero: true })
    const card = h.addSurface({ afterHero: true })
    await h.flush()
    h.nearIO().trigger(card.el, 1)
    h.viewIO().trigger(card.el, 1)
    await h.advance(13100)

    expect(h.types('hero-settled')).toHaveLength(1)
    expect(h.api.settled).toBe(true)
    expect(card.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('страница без hero считается определившейся сразу', async () => {
    const h = createHarness()
    h.addSurface()
    await h.flush()
    expect(h.api.settled).toBe(true)
  })
})

/* ───────────────────────── жизненный цикл страницы ───────────────────────── */

describe('жизненный цикл', () => {
  async function visibleHero(h: Harness) {
    const s = h.addSurface({ hero: true })
    await h.reachSafe(s)
    h.presentFrame(s, 0.05)
    await h.flush()
    expect(h.state(s)).toBe('visible')
    return s
  }

  it('скрытая вкладка ставит видео на паузу, возвращение — продолжает', async () => {
    const h = createHarness()
    const s = await visibleHero(h)
    const plays = s.v.playCalls

    h.setVisibility('hidden')
    expect(s.v.paused).toBe(true)

    h.setVisibility('visible')
    await h.flush()
    expect(s.v.playCalls).toBe(plays + 1)
  })

  it('bfcache: pageshow с persisted продолжает воспроизведение', async () => {
    const h = createHarness()
    const s = await visibleHero(h)

    h.win.dispatchEvent(Object.assign(new Event('pagehide'), {}))
    expect(s.v.paused).toBe(true)

    const plays = s.v.playCalls
    h.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }))
    await h.flush()
    expect(h.types('bfcache-restore')).toHaveLength(1)
    expect(s.v.playCalls).toBe(plays + 1)
  })

  it('поверхность вышла из кадра: пауза; вернулась: продолжение', async () => {
    const h = createHarness()
    const s = await visibleHero(h)

    h.viewIO().trigger(s.el, 0)
    expect(s.v.paused).toBe(true)

    const plays = s.v.playCalls
    h.viewIO().trigger(s.el, 1)
    await h.flush()
    expect(s.v.playCalls).toBe(plays + 1)
  })

  it('поверхность удалена из DOM (soft navigation): видео выгружено, таймеры сняты', async () => {
    const h = createHarness()
    const s = await visibleHero(h)

    s.el.remove()
    await h.flush()

    expect(s.video.getAttribute('src')).toBeNull()
    expect(h.types('unload').at(-1)).toMatchObject({ reason: 'removed' })
    expect(h.api.stateOf(s.el)).toBeNull()
    // после удаления больше нет активных таймеров загрузчика, кроме страховки hero-settled
    const timers = vi.getTimerCount()
    await h.advance(20_000)
    expect(vi.getTimerCount()).toBeLessThanOrEqual(timers)
  })

  it('поверхность, добавленная после загрузки страницы (клиентская навигация), подхватывается', async () => {
    const h = createHarness()
    await h.flush()
    const s = h.addSurface({ hero: true })
    await h.flush()
    expect(s.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('корень поверхности пришёл раньше своего <video> (парсер отдал по частям): подключается позже', async () => {
    const h = createHarness()
    const el = h.doc.createElement('div')
    el.setAttribute('data-sm', '')
    el.setAttribute('data-sm-hero', '')
    el.setAttribute('data-sm-load', 'eager')
    el.setAttribute('data-sm-src-d', '/media/d.mp4')
    el.setAttribute('data-sm-mq', '(max-width: 767px)')
    h.doc.body.append(el)
    await h.flush()
    expect(h.api.stateOf(el)).toBeNull()

    const video = h.doc.createElement('video')
    h.makeVideo(video)
    el.append(video)
    await h.flush()
    expect(video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('установка идемпотентна: второй вызов возвращает тот же API', () => {
    const h = createHarness()
    expect(installMediaBoot(h.win as unknown as Parameters<typeof installMediaBoot>[0])).toBe(h.api)
  })

  it('события пишутся и в performance.mark-совместимый поток, и в CustomEvent', async () => {
    const h = createHarness()
    const seen: string[] = []
    h.win.addEventListener('savage:media', e => seen.push((e as CustomEvent<SmEvent>).detail.type))
    h.addSurface({ hero: true })
    await h.flush()
    expect(seen).toContain('request')
    expect(h.api.events.length).toBeGreaterThan(0)
  })
})

/* ───────────────────────── граничные случаи после независимого ревью ───────────────────────── */

describe('системная пауза и остановки без сбоя', () => {
  async function visibleHero(h: Harness) {
    const s = h.addSurface({ hero: true })
    await h.reachSafe(s)
    h.presentFrame(s, 0.05)
    await h.flush()
    expect(h.state(s)).toBe('visible')
    return s
  }

  it('ОС поставила видимое видео на паузу: оно продолжается, а не замерзает кадром', async () => {
    const h = createHarness()
    const s = await visibleHero(h)
    const plays = s.v.playCalls

    s.v.paused = true
    h.fire(s.video, 'pause')
    await h.flush()

    expect(h.types('external-pause')).toHaveLength(1)
    expect(s.v.playCalls).toBe(plays + 1)
    expect(h.state(s)).toBe('visible')
  })

  it('продолжить не удалось: возврат на постер, а не замерзший кадр', async () => {
    const h = createHarness()
    const s = await visibleHero(h)

    s.v.paused = true
    s.v.playError = 'NotAllowedError'
    h.fire(s.video, 'pause')
    await h.flush()

    expect(h.types('degrade')[0]).toMatchObject({ reason: 'resume-NotAllowedError' })
    expect(h.state(s)).not.toBe('visible')
  })

  it('наша пауза при выходе из кадра не принимается за системную', async () => {
    const h = createHarness()
    const s = await visibleHero(h)
    const plays = s.v.playCalls

    h.viewIO().trigger(s.el, 0)
    h.fire(s.video, 'pause')
    await h.flush()

    expect(h.types('external-pause')).toHaveLength(0)
    expect(s.v.playCalls).toBe(plays)
  })

  it('пауза снова и снова: после трёх возвратов поверхность уходит на постер', async () => {
    const h = createHarness()
    const s = await visibleHero(h)

    for (let i = 0; i < 4; i++) {
      s.v.paused = true
      h.fire(s.video, 'pause')
      await h.flush()
    }
    expect(h.types('external-pause')).toHaveLength(4)
    expect(h.types('degrade')[0]).toMatchObject({ reason: 'paused' })
  })

  it('кадр не пришёл, потому что блок вышел из кадра: попытка не сгорает', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.reachSafe(s)

    h.viewIO().trigger(s.el, 0)
    await h.advance(2500)

    expect(h.types('frame-timeout')).toHaveLength(0)
    expect(h.types('degrade')).toHaveLength(0)
  })
})

describe('источник: нет сигнала и нет лишних перезагрузок', () => {
  it('первый кадр так и не пришёл за 12 с: постер, сеть освобождена, сообщение отправлено', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.flush()
    await h.advance(12100)

    expect(h.state(s)).toBe('failed')
    expect(h.types('load-timeout')).toHaveLength(1)
    expect(h.report('failed')).toBeDefined()
    expect(s.video.getAttribute('src')).toBeNull()
  })

  it('данные пришли вовремя: таймаут загрузки ничего не ломает', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.reachSafe(s)
    h.presentFrame(s, 0.05)
    await h.flush()
    await h.advance(13000)

    expect(h.types('load-timeout')).toHaveLength(0)
    expect(h.state(s)).toBe('visible')
  })

  it('один и тот же MP4 для обоих экранов не перезагружается при смене ширины', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, srcD: '/media/same.mp4', srcM: '/media/same.mp4' })
    await h.flush()
    const loads = s.v.loadCalls

    h.setMedia('(max-width: 767px)', true)
    await h.advance(300)
    await h.flush()

    expect(h.types('source-swap')).toHaveLength(0)
    expect(s.v.loadCalls).toBe(loads)
    expect(s.video.getAttribute('src')).toBe('/media/same.mp4')
    expect(h.state(s)).toBe('loading')
  })

  it('поток не перезагружается при смене ширины', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, stream: 'abc', srcD: '' })
    await h.flush()

    h.setMedia('(max-width: 767px)', true)
    await h.advance(300)
    await h.flush()

    expect(h.types('source-swap')).toHaveLength(0)
    expect(s.el.getAttribute('data-sm-want')).toBe('1')
  })
})

describe('нативный HLS: прогрев', () => {
  it('Safari/iOS (драйвер пометил data-sm-native=1): сеть простаивает, запускается скрытое воспроизведение', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, stream: 'abc', srcD: '' })
    s.el.setAttribute('data-sm-native', '1')
    await h.flush()
    s.v.readyState = 1
    s.v.networkState = 1
    await h.advance(800)

    expect(h.types('kickstart')).toHaveLength(1)
    expect(s.v.playCalls).toBe(1)
  })

  it('hls.js (data-sm-native=0): прогрев не нужен, play() не вызывается', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, stream: 'abc', srcD: '' })
    s.el.setAttribute('data-sm-native', '0')
    await h.flush()
    s.v.readyState = 1
    s.v.networkState = 1
    await h.advance(3000)

    expect(h.types('kickstart')).toHaveLength(0)
    expect(s.v.playCalls).toBe(0)
  })

  it('драйвер подключился позже загрузчика: пометка подхватывается при повторной проверке', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true, stream: 'abc', srcD: '' })
    await h.flush()
    s.v.readyState = 1
    s.v.networkState = 1
    await h.advance(800)
    expect(h.types('kickstart')).toHaveLength(0)

    s.el.setAttribute('data-sm-native', '1')
    await h.advance(600)
    expect(h.types('kickstart')).toHaveLength(1)
  })
})

describe('стопка карточек: data-sm-active', () => {
  it('закрытая карточка не занимает слот, открытая получает его', async () => {
    const h = createHarness()
    const cards = [h.addSurface({ active: 'off' }), h.addSurface({ active: 'off' }), h.addSurface()]
    await h.flush()
    cards.forEach(card => {
      h.nearIO().trigger(card.el, 1)
      h.viewIO().trigger(card.el, 1)
    })
    await h.flush()

    expect(cards[0]!.video.getAttribute('src')).toBeNull()
    expect(cards[1]!.video.getAttribute('src')).toBeNull()
    expect(cards[2]!.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('карточку закрыли на лету: она выгружается, а следующая оживает', async () => {
    const h = createHarness()
    const first = h.addSurface()
    const second = h.addSurface({ active: 'off' })
    await h.flush()
    ;[first, second].forEach(card => {
      h.nearIO().trigger(card.el, 1)
      h.viewIO().trigger(card.el, 1)
    })
    await h.flush()
    expect(first.video.getAttribute('src')).not.toBeNull()
    expect(second.video.getAttribute('src')).toBeNull()

    first.el.setAttribute('data-sm-active', 'off')
    second.el.removeAttribute('data-sm-active')
    await h.flush()
    await h.advance(3100)

    expect(first.video.getAttribute('src')).toBeNull()
    expect(second.video.getAttribute('src')).toBe('/media/d.mp4')
  })

  it('закрытый hero выгружается и не держит страницу в ожидании', async () => {
    const h = createHarness()
    const hero = h.addSurface({ hero: true, active: 'off' })
    await h.flush()

    expect(hero.video.getAttribute('src')).toBeNull()
    expect(h.api.settled).toBe(true)
  })
})

describe('постер: запасные адреса', () => {
  it('ошибка загрузки переключает постер на следующий адрес списка', async () => {
    const h = createHarness()
    const img = h.doc.createElement('img')
    img.setAttribute('src', '/a.jpg')
    img.setAttribute('srcset', '/a.jpg 1x')
    img.setAttribute('data-sm-alt', '/b.jpg|/c.jpg')
    h.doc.body.append(img)

    img.dispatchEvent(new Event('error'))
    expect(img.getAttribute('src')).toBe('/b.jpg')
    expect(img.hasAttribute('srcset')).toBe(false)

    img.dispatchEvent(new Event('error'))
    expect(img.getAttribute('src')).toBe('/c.jpg')

    img.dispatchEvent(new Event('error'))
    expect(img.getAttribute('src')).toBe('/c.jpg')
  })

  it('картинки без data-sm-alt не трогаются', () => {
    const h = createHarness()
    const img = h.doc.createElement('img')
    img.setAttribute('src', '/a.jpg')
    h.doc.body.append(img)

    img.dispatchEvent(new Event('error'))
    expect(img.getAttribute('src')).toBe('/a.jpg')
  })
})

describe('TTFM', () => {
  it('у карточки он считается от запроса видео, а не от начала навигации', async () => {
    const h = createHarness()
    const card = h.addSurface()
    await h.flush()
    await h.advance(40000)
    h.nearIO().trigger(card.el, 1)
    h.viewIO().trigger(card.el, 1)
    await h.flush()
    await h.advance(300)
    h.buffer(card, 3.2)
    h.fire(card.video, 'canplaythrough')
    await h.flush()
    h.presentFrame(card, 0.05)
    await h.flush()

    const rep = h.report('visible')!
    expect(rep.hero).toBe(false)
    expect(rep.ttfm as number).toBeLessThan(3000)
  })

  it('у hero он считается от начала навигации', async () => {
    const h = createHarness()
    const s = h.addSurface({ hero: true })
    await h.advance(900)
    h.buffer(s, 3.2)
    h.fire(s.video, 'canplaythrough')
    await h.flush()
    h.presentFrame(s, 0.05)
    await h.flush()

    const rep = h.report('visible')!
    expect(rep.hero).toBe(true)
    expect(rep.ttfm as number).toBeGreaterThanOrEqual(900)
  })
})
