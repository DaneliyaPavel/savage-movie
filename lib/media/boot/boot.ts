/**
 * Загрузчик медиа-поверхностей Savage Movie.
 *
 * Этот файл не импортирует ничего: он собирается esbuild-ом в одну строку
 * (boot.generated.ts) и вставляется инлайном в <head>. Поэтому hero-ролик
 * начинает качаться, как только парсер увидел <video>, — до загрузки React
 * и до гидратации. Редактируйте этот файл, затем `npm run media:boot`.
 *
 * Поверхность (surface) — корневой элемент с data-sm. Внутри него лежат
 * <picture class="sm-poster"> (рендерится сервером и всегда остаётся под
 * видео) и <video class="sm-video">. Контракт атрибутов:
 *
 *   data-sm              маркер поверхности
 *   data-sm-name         имя для телеметрии (showreel, project-card, …)
 *   data-sm-src-d/-m     MP4 для десктопа / мобайла (постоянные URL с хэшем)
 *   data-sm-stream       id Bunny-видео: если MP4 нет, источником служит HLS,
 *                        который подключает React-драйвер по событию sm:load
 *   data-sm-mq           медиазапрос мобильного варианта
 *   data-sm-load         eager (hero) | near (карточки)
 *   data-sm-play         auto | hover | hover-only (карточки: hover на мыши, видимость на тач;
 *                        hover-only: на таче движения нет вовсе — экономим мобильный трафик)
 *   data-sm-only         медиазапрос: поверхность оживает, только пока он выполняется
 *                        (блок только для десктопа). Не зависит от CSS и порядка загрузки стилей
 *   data-sm-hover-scope  селектор ближайшего предка, над которым ловится hover (карточка целиком)
 *   data-sm-buffer       сколько секунд запаса нужно до показа (1.5–3, по умолч. 2)
 *   data-sm-hero         hero страницы: не участвует в лимите одновременных превью
 *   data-sm-after        "hero": не грузить, пока hero не определился
 *   data-sm-hold-until   селектор: не показывать видео, пока такой элемент в DOM
 *                        (заставка), но не дольше HOLD_CAP_MS от начала навигации
 *   data-sm-active       "off": блок сейчас закрыт другим (стопка карточек): не грузить и не играть
 *   data-sm-native       "1": HLS идёт нативно (Safari/iOS), ставит React-драйвер; нужен для прогрева
 *   data-sm-state        poster | loading | decoded | safe | visible | failed | off
 *
 * Постер с data-sm-alt="url|url" при ошибке загрузки переключается на следующий адрес списка
 * (кадр Bunny мог быть ещё не сгенерирован): слушатель стоит на документе, до гидратации.
 *
 * Состояния: POSTER → LOADING → DECODED → SAFE → VISIBLE.
 *   LOADING  источник назначен, ждём первый кадр;
 *   DECODED  первый кадр декодирован (readyState >= 2);
 *   SAFE     запаса буфера хватает, чтобы проиграть без остановки;
 *   VISIBLE  видео играет и показало движущийся кадр (requestVideoFrameCallback),
 *            только теперь CSS плавно открывает его поверх постера.
 * Любая ошибка оставляет постер: он под видео всегда, так что «чёрного кадра»
 * между состояниями не бывает по построению.
 */

export type SmState = 'poster' | 'loading' | 'decoded' | 'safe' | 'visible' | 'failed' | 'off'

export interface SmEvent {
  type: string
  name: string
  t: number
  [key: string]: unknown
}

export interface SmApi {
  version: 1
  events: SmEvent[]
  /** hero определился (показан, не удался или выключен) или такого hero нет */
  settled: boolean
  scan(root?: ParentNode): void
  stateOf(el: Element): SmState | null
  destroyAll(): void
}

type SmWindow = Window & typeof globalThis & { __sm?: SmApi }

interface VideoFrameMeta {
  mediaTime: number
  presentedFrames: number
}

type VideoWithRvfc = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number, meta: VideoFrameMeta) => void) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

interface NetworkInformationLike {
  saveData?: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
}

interface Surface {
  el: HTMLElement
  video: VideoWithRvfc
  img: HTMLImageElement | null
  name: string
  hero: boolean
  hover: boolean
  hoverOnly: boolean
  loop: boolean
  only: MediaQueryList | null
  afterHero: boolean
  minAhead: number
  holdUntil: string
  srcD: string
  srcM: string
  stream: string
  mq: string
  state: SmState
  kind: 'mp4' | 'stream' | 'none'
  cls: 'd' | 'm'
  loaded: boolean
  near: boolean
  inView: boolean
  ratio: number
  hovered: boolean
  holdTimer: ReturnType<typeof setTimeout> | null
  hoverTimer: ReturnType<typeof setTimeout> | null
  tickTimer: ReturnType<typeof setInterval> | null
  waitTimer: ReturnType<typeof setTimeout> | null
  frameTimer: ReturnType<typeof setTimeout> | null
  kickTimer: ReturnType<typeof setTimeout> | null
  loadTimer: ReturnType<typeof setTimeout> | null
  kickChecks: number
  resumes: number
  frameToken: number
  starting: boolean
  awaitingFrame: boolean
  kick: boolean
  canThrough: boolean
  gestureBlocked: boolean
  degrades: number
  restarts: number
  retries: number
  minAheadNow: number
  samples: Array<[number, number]>
  rate: number | null
  t: Record<string, number>
  stalls: number
  reported: boolean
  stallReported: boolean
  cleanup: Array<() => void>
  mql: MediaQueryList | null
}

const MAX_ACTIVE_PREVIEWS = 2
const DEFAULT_MOBILE_MQ = '(max-width: 767px)'
const TICK_MS = 120
/** Потолок ожидания заставки: она сама уходит не позже ~1 с, дольше держать нельзя */
const HOLD_CAP_MS = 1100
const POSTER_WAIT_MS = 1500
const FRAME_TIMEOUT_MS = 1800
const STALL_AFTER_REVEAL_MS = 700
const HERO_SETTLE_FAILSAFE_MS = 6000
const KICKSTART_AFTER_MS = 700
/** Нет первого кадра за это время — постер остаётся, сеть освобождается */
const LOAD_TIMEOUT_MS = 12000
const MAX_EXTERNAL_RESUMES = 3
const MAX_KICK_RECHECKS = 6
const FAR_UNLOAD_MS = 3000
const HOVER_INTENT_MS = 130
const HOVER_HOLD_MS = 350
const MAX_DEGRADES = 3
const MAX_EVENTS = 300

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

export function installMediaBoot(win: SmWindow): SmApi {
  if (win.__sm) return win.__sm

  const doc = win.document
  const perf = win.performance
  const nav = win.navigator as Navigator & { connection?: NetworkInformationLike }
  const registry = new Map<HTMLElement, Surface>()
  const events: SmEvent[] = []

  const mm = (query: string): MediaQueryList | null =>
    typeof win.matchMedia === 'function' ? win.matchMedia(query) : null
  const reducedMql = mm('(prefers-reduced-motion: reduce)')
  const finePointerMql = mm('(hover: hover) and (pointer: fine)')

  const now = () => Math.round(perf.now())
  const isReduced = () => !!reducedMql && reducedMql.matches
  const isFinePointer = () => !!finePointerMql && finePointerMql.matches
  const isDataSaver = () => {
    const c = nav.connection
    return !!c && (c.saveData === true || /(^|-)2g$/.test(c.effectiveType ?? ''))
  }

  const api: SmApi = {
    version: 1,
    events,
    settled: false,
    scan,
    stateOf: el => registry.get(el as HTMLElement)?.state ?? null,
    destroyAll,
  }
  win.__sm = api

  /* ───────────────────────── телеметрия ───────────────────────── */

  function emit(type: string, s: Surface | null, extra?: Record<string, unknown>) {
    const ev: SmEvent = { type, name: s ? s.name : '', t: now(), ...(extra ?? {}) }
    if (events.length < MAX_EVENTS) events.push(ev)
    try {
      perf.mark('sm:' + ev.name + ':' + type)
    } catch {
      /* mark не критичен */
    }
    try {
      win.dispatchEvent(new win.CustomEvent('savage:media', { detail: ev }))
    } catch {
      /* телеметрия не должна ломать воспроизведение */
    }
  }

  function netInfo(): Record<string, unknown> {
    const c = nav.connection
    return c ? { et: c.effectiveType, dl: c.downlink, rtt: c.rtt, sd: c.saveData === true } : {}
  }

  function report(s: Surface, kind: 'visible' | 'failed' | 'off' | 'stall-check') {
    if (kind === 'stall-check') {
      if (s.stallReported) return
      s.stallReported = true
    } else {
      if (s.reported) return
      s.reported = true
    }
    const t = s.t
    emit('report', s, {
      kind,
      src: s.kind,
      cls: s.cls,
      // ttfm: когда пользователь впервые увидел движущийся кадр видео. У hero это
      // время от начала навигации, у остальных — от запроса видео (карточку могли
      // навести через минуту после загрузки страницы)
      ttfm: t.visible === undefined ? undefined : s.hero ? t.visible : t.visible - (t.request ?? 0),
      hero: s.hero,
      posterAt: t.posterReady,
      requestAt: t.request,
      decodedAt: t.decoded,
      safeAt: t.safe,
      stalls: s.stalls,
      degrades: s.degrades,
      kicked: s.kick,
      ...netInfo(),
    })
  }

  /* ───────────────────────── утилиты видео ───────────────────────── */

  function bufferedRange(v: HTMLVideoElement): { start: number; end: number } | null {
    const b = v.buffered
    const t = v.currentTime
    for (let i = 0; i < b.length; i++) {
      if (t >= b.start(i) - 0.1 && t <= b.end(i) + 0.1) return { start: b.start(i), end: b.end(i) }
    }
    return null
  }

  function posterReady(s: Surface): boolean {
    const img = s.img
    if (!img) return true
    return img.complete
  }

  function setState(s: Surface, next: SmState, extra?: Record<string, unknown>) {
    if (s.state === next) return
    const from = s.state
    s.state = next
    if (s.t[next] === undefined) s.t[next] = now()
    s.el.setAttribute('data-sm-state', next)
    emit('state', s, { from, to: next, ...(extra ?? {}) })
    if (next === 'visible' || next === 'failed' || next === 'off') settleHeroIfNeeded()
  }

  function resolveSource(s: Surface): { kind: 'mp4' | 'stream' | 'none'; url: string } {
    const cls = s.mql && s.mql.matches ? 'm' : 'd'
    s.cls = cls
    const url = cls === 'm' ? s.srcM || s.srcD : s.srcD || s.srcM
    if (url) return { kind: 'mp4', url }
    if (s.stream) return { kind: 'stream', url: '' }
    return { kind: 'none', url: '' }
  }

  /* ───────────────────────── загрузка и выгрузка ───────────────────────── */

  function clearTimers(s: Surface) {
    if (s.tickTimer) clearInterval(s.tickTimer)
    if (s.waitTimer) clearTimeout(s.waitTimer)
    if (s.frameTimer) clearTimeout(s.frameTimer)
    if (s.kickTimer) clearTimeout(s.kickTimer)
    if (s.loadTimer) clearTimeout(s.loadTimer)
    s.tickTimer = s.waitTimer = s.frameTimer = s.kickTimer = s.loadTimer = null
    cancelFrame(s)
  }

  function resetPlaybackFlags(s: Surface) {
    s.starting = false
    s.awaitingFrame = false
    s.kick = false
    s.kickChecks = 0
    s.resumes = 0
    s.restarts = 0
    s.canThrough = false
    s.samples = []
    s.rate = null
    s.minAheadNow = s.minAhead
  }

  function load(s: Surface) {
    if (s.loaded || s.state === 'off' || s.state === 'failed') return
    const src = resolveSource(s)
    s.kind = src.kind
    if (src.kind === 'none') {
      setState(s, 'failed', { reason: 'no-source' })
      report(s, 'failed')
      return
    }
    s.loaded = true
    s.t.request = now()
    resetPlaybackFlags(s)
    const v = s.video
    v.muted = true
    v.defaultMuted = true
    v.playsInline = true
    v.loop = s.loop
    v.autoplay = false
    v.preload = 'auto'
    setState(s, 'loading', { src: src.kind, cls: s.cls })
    s.el.setAttribute('data-sm-want', '1')
    if (src.kind === 'mp4') {
      v.src = src.url
    } else {
      s.el.dispatchEvent(new win.CustomEvent('sm:load'))
    }
    emit('request', s, { src: src.kind, cls: s.cls })
    startTick(s)
    s.kickTimer = setTimeout(() => maybeKickstart(s), KICKSTART_AFTER_MS)
    s.loadTimer = setTimeout(() => {
      s.loadTimer = null
      // источник так и не дал кадр (манифест не загрузился, сеть оборвалась без ошибки)
      if (s.loaded && s.state === 'loading' && s.video.readyState < 2) {
        emit('load-timeout', s)
        fail(s, 'load-timeout')
      }
    }, LOAD_TIMEOUT_MS)
  }

  function startTick(s: Surface) {
    if (s.tickTimer) return
    s.tickTimer = setInterval(() => tick(s), TICK_MS)
  }

  function stopTick(s: Surface) {
    if (s.tickTimer) clearInterval(s.tickTimer)
    s.tickTimer = null
  }

  /** Вернуть поверхность в состояние постера и освободить сеть */
  function unload(s: Surface, reason: string) {
    if (!s.loaded && s.state === 'poster') return
    clearTimers(s)
    const v = s.video
    try {
      v.pause()
    } catch {
      /* ignore */
    }
    if (s.kind === 'mp4') {
      v.removeAttribute('src')
      try {
        v.load()
      } catch {
        /* jsdom и старые браузеры */
      }
    } else if (s.kind === 'stream') {
      s.el.dispatchEvent(new win.CustomEvent('sm:unload'))
    }
    s.loaded = false
    s.el.setAttribute('data-sm-want', '0')
    resetPlaybackFlags(s)
    if (s.state !== 'off' && s.state !== 'failed') setState(s, 'poster', { reason })
    s.reported = false
    s.stallReported = false
    s.t = {}
    emit('unload', s, { reason })
  }

  function swapSource(s: Surface) {
    const wasLoaded = s.loaded
    const prev = s.cls
    const mqlNow = s.mql && s.mql.matches ? 'm' : 'd'
    if (prev === mqlNow) return
    // поток и один и тот же MP4 для обоих экранов не перезагружаем: поворот
    // телефона или изменение окна не должны возвращать видео к постеру
    const urlOf = (c: 'd' | 'm') => (c === 'm' ? s.srcM || s.srcD : s.srcD || s.srcM)
    if (!s.srcD && !s.srcM) {
      s.cls = mqlNow
      return
    }
    if (urlOf(prev) === urlOf(mqlNow)) {
      s.cls = mqlNow
      return
    }
    emit('source-swap', s, { from: prev, to: mqlNow })
    if (wasLoaded) {
      unload(s, 'resize')
      reconcile()
    } else {
      s.cls = mqlNow
    }
  }

  /* ───────────────────────── буфер и безопасный старт ───────────────────────── */

  function sampleRate(s: Surface) {
    const v = s.video
    const r = bufferedRange(v)
    if (!r) return
    const t = now()
    s.samples.push([t, r.end])
    if (s.samples.length > 12) s.samples.shift()
    const first = s.samples[0]
    const last = s.samples[s.samples.length - 1]
    if (first && last && last[0] - first[0] >= 450) {
      s.rate = (last[1] - first[1]) / ((last[0] - first[0]) / 1000)
    }
  }

  function isSafe(s: Surface): boolean {
    const v = s.video
    const D = v.duration
    if (!isFinite(D) || D <= 0) return false
    const r = bufferedRange(v)
    if (!r) return false
    const ahead = r.end - v.currentTime
    // файл целиком в буфере: дальше ждать нечего
    if (r.end >= D - 0.1) return ahead > 0.05
    const need = Math.min(s.minAheadNow, D * 0.6)
    if (ahead < need) return false
    if (s.canThrough) return true
    const rate = s.rate
    if (rate === null) return ahead >= need + 0.5
    if (rate >= 1.05) return true
    // Скорость докачки ниже реального времени: хватит ли запаса до конца файла.
    // Играть дальше конца буфера можно, только если докачка успеет за плеером.
    const remaining = D - r.end
    return ahead >= ((1 - rate) * remaining) / Math.max(rate, 0.05) + 0.5
  }

  function tick(s: Surface) {
    if (!s.loaded) return
    sampleRate(s)
    evaluate(s)
  }

  function evaluate(s: Surface) {
    if (!s.loaded || s.state === 'off' || s.state === 'failed') return
    const v = s.video
    if (s.state === 'loading' && v.readyState >= 2) setState(s, 'decoded')
    if (s.state === 'decoded' && isSafe(s)) setState(s, 'safe')
    if (s.state !== 'safe') return
    if (!v.paused) {
      // скрытый прогрев (kickstart) закончен: возвращаемся в нулевой кадр
      if (s.kick && v.currentTime > 0.05) rewind(s)
      else if (!s.awaitingFrame && !s.starting) awaitFrame(s)
      return
    }
    if (!s.starting && !s.awaitingFrame && canStartPlay(s)) startPlay(s)
  }

  function wantsPlayback(s: Surface): boolean {
    if (doc.visibilityState === 'hidden') return false
    if (s.gestureBlocked) return false
    if (s.hero) return s.inView
    if (!s.hover) return s.inView
    if (isFinePointer()) return s.inView && s.hovered
    return s.inView && !s.hoverOnly
  }

  /** Постер уже на экране и заставка ушла: теперь можно запускать скрытое воспроизведение */
  function canStartPlay(s: Surface): boolean {
    if (!wantsPlayback(s)) return false
    if (!posterReady(s) && now() - (s.t.safe ?? 0) < POSTER_WAIT_MS) return false
    return !holdActive(s)
  }

  /** Назад к нулевому кадру: показ всегда начинается с того же кадра, что и постер */
  function rewind(s: Surface) {
    const v = s.video
    s.kick = false
    s.restarts++
    cancelFrame(s)
    try {
      v.pause()
    } catch {
      /* ignore */
    }
    try {
      v.currentTime = 0
    } catch {
      /* ignore */
    }
  }

  /* iOS и часть мобильных браузеров игнорируют preload: пока не вызван play(),
     буфер не растёт и сеть простаивает (networkState IDLE). Тогда запускаем
     скрытое воспроизведение «для прогрева», а перед показом вернёмся в нулевой кадр. */
  function maybeKickstart(s: Surface) {
    if (!s.loaded || s.state !== 'loading') return
    if (s.kind === 'stream') {
      // нативный HLS (Safari/iOS) тоже игнорирует preload; hls.js (MSE) в прогреве не нуждается.
      // Драйвер подключается позже загрузчика: ждём его пометку несколько раз
      const native = s.el.getAttribute('data-sm-native')
      if (native === null && s.kickChecks < MAX_KICK_RECHECKS) {
        s.kickChecks++
        s.kickTimer = setTimeout(() => maybeKickstart(s), 500)
        return
      }
      if (native !== '1') return
    } else if (s.kind !== 'mp4') {
      return
    }
    const v = s.video
    if (v.readyState >= 2 || v.readyState < 1) return
    if (v.networkState !== 1) return
    s.kick = true
    emit('kickstart', s)
    startPlay(s)
  }

  function startPlay(s: Surface) {
    if (s.starting) return
    s.starting = true
    if (s.t.play === undefined) s.t.play = now()
    const v = s.video
    let p: Promise<void> | undefined
    try {
      p = v.play()
    } catch {
      p = undefined
    }
    if (p && typeof p.then === 'function') {
      p.then(
        () => {
          s.starting = false
          if (s.state === 'safe') awaitFrame(s)
        },
        err => {
          s.starting = false
          onPlayRejected(s, err)
        }
      )
    } else {
      s.starting = false
      awaitFrame(s)
    }
  }

  function onPlayRejected(s: Surface, err: unknown) {
    const name = err && typeof err === 'object' && 'name' in err ? String((err as Error).name) : ''
    if (name === 'AbortError') return // сменили источник или поставили pause — не ошибка
    if (name === 'NotAllowedError') {
      // Low Power Mode и жёсткие политики автовоспроизведения: остаёмся на постере
      // и пробуем ещё раз один раз — по первому жесту пользователя
      s.gestureBlocked = true
      emit('autoplay-blocked', s)
      armGestureRetry()
      return
    }
    fail(s, 'play-' + (name || 'error'))
  }

  let gestureArmed = false
  function armGestureRetry() {
    if (gestureArmed) return
    gestureArmed = true
    const retry = () => {
      gestureArmed = false
      doc.removeEventListener('pointerdown', retry, true)
      doc.removeEventListener('touchend', retry, true)
      doc.removeEventListener('keydown', retry, true)
      registry.forEach(s => {
        if (!s.gestureBlocked) return
        s.gestureBlocked = false
        evaluate(s)
      })
    }
    doc.addEventListener('pointerdown', retry, true)
    doc.addEventListener('touchend', retry, true)
    doc.addEventListener('keydown', retry, true)
  }

  /* ───────────────────────── первый движущийся кадр и показ ───────────────────────── */

  function cancelFrame(s: Surface) {
    s.frameToken++
    s.awaitingFrame = false
    if (s.frameTimer) clearTimeout(s.frameTimer)
    s.frameTimer = null
  }

  function awaitFrame(s: Surface) {
    if (s.awaitingFrame) return
    s.awaitingFrame = true
    const token = ++s.frameToken
    const v = s.video
    s.frameTimer = setTimeout(() => {
      if (token !== s.frameToken) return
      s.awaitingFrame = false
      // видео стоит, потому что блок вышел из кадра или вкладка скрыта: кадров нет по делу,
      // это не сбой. Вернёмся к ожиданию, когда поверхность снова понадобится
      if (s.video.paused && !wantsPlayback(s)) return
      emit('frame-timeout', s)
      degrade(s, 'frame-timeout')
    }, FRAME_TIMEOUT_MS)

    const finish = () => {
      if (token !== s.frameToken) return
      s.awaitingFrame = false
      if (s.frameTimer) clearTimeout(s.frameTimer)
      s.frameTimer = null
      if (s.t.frame === undefined) s.t.frame = now()
      reveal(s)
    }

    if (typeof v.requestVideoFrameCallback === 'function') {
      const arm = () => {
        v.requestVideoFrameCallback!((_t, meta) => {
          if (token !== s.frameToken) return
          // mediaTime > 0: показан кадр после нулевого, то есть видео уже движется
          if (meta.mediaTime >= 0.03 || v.currentTime >= 0.03) finish()
          else arm()
        })
      }
      arm()
    } else {
      // Без requestVideoFrameCallback: время пошло, данных хватает, кадр прорисован
      const poll = () => {
        if (token !== s.frameToken) return
        if (!v.paused && v.currentTime >= 0.05 && v.readyState >= 3) {
          win.requestAnimationFrame(() => win.requestAnimationFrame(finish))
        } else {
          win.setTimeout(poll, 50)
        }
      }
      poll()
    }
  }

  function holdActive(s: Surface): boolean {
    if (!s.holdUntil) return false
    if (now() >= HOLD_CAP_MS) return false
    try {
      return !!doc.querySelector(s.holdUntil)
    } catch {
      return false
    }
  }

  function reveal(s: Surface) {
    if (s.state !== 'safe') return
    const v = s.video
    // Показ начинается с начала файла: нулевой кадр совпадает с постером, и
    // переход не читается как скачок. Если плеер успел уйти дальше — вернём его.
    if (v.currentTime > 0.5 && s.restarts < 2) {
      rewind(s)
      return
    }
    stopTick(s)
    setState(s, 'visible')
    report(s, 'visible')
    win.setTimeout(() => {
      if (s.state === 'visible') report(s, 'stall-check')
    }, 10000)
  }

  /** Плавное возвращение на постер без чёрного кадра: пауза, нулевой кадр, повторный вход */
  function degrade(s: Surface, reason: string) {
    if (!s.loaded || s.state === 'off' || s.state === 'failed') return
    s.degrades++
    emit('degrade', s, { reason, n: s.degrades })
    if (s.degrades > MAX_DEGRADES) {
      fail(s, 'unstable')
      return
    }
    const v = s.video
    cancelFrame(s)
    try {
      v.pause()
    } catch {
      /* ignore */
    }
    // нужно больше запаса, чтобы не повторить остановку
    s.minAheadNow = clamp(s.minAheadNow * 1.5, 1.5, 4)
    s.samples = []
    s.rate = null
    s.starting = false
    setState(s, 'loading', { reason })
    startTick(s)
    try {
      v.currentTime = 0
    } catch {
      /* ignore */
    }
    evaluate(s)
  }

  function fail(s: Surface, reason: string) {
    clearTimers(s)
    const v = s.video
    try {
      v.pause()
    } catch {
      /* ignore */
    }
    setState(s, 'failed', { reason })
    report(s, 'failed')
    // сеть освобождаем, постер остаётся
    if (s.kind === 'mp4') {
      v.removeAttribute('src')
      try {
        v.load()
      } catch {
        /* ignore */
      }
    } else if (s.kind === 'stream') {
      s.el.dispatchEvent(new win.CustomEvent('sm:unload'))
    }
    s.loaded = false
    reconcile()
  }

  /* ───────────────────────── события <video> ───────────────────────── */

  function bindVideo(s: Surface) {
    const v = s.video
    const on = (type: string, fn: (e: Event) => void) => {
      v.addEventListener(type, fn)
      s.cleanup.push(() => v.removeEventListener(type, fn))
    }
    on('loadedmetadata', () => {
      if (s.t.meta === undefined) s.t.meta = now()
      evaluate(s)
    })
    on('loadeddata', () => evaluate(s))
    on('seeked', () => evaluate(s))
    on('canplay', () => evaluate(s))
    on('canplaythrough', () => {
      s.canThrough = true
      evaluate(s)
    })
    on('progress', () => {
      sampleRate(s)
      evaluate(s)
    })
    on('playing', () => {
      if (s.waitTimer) {
        clearTimeout(s.waitTimer)
        s.waitTimer = null
      }
      if (s.state === 'safe' && !s.awaitingFrame) awaitFrame(s)
    })
    on('pause', () => {
      // системная пауза (экономия заряда, звонок, медиа-сессия ОС): без этого на экране
      // остался бы замерзший кадр. Наши собственные паузы идут не из состояния visible
      if (s.state !== 'visible' || v.ended || !wantsPlayback(s)) return
      emit('external-pause', s)
      if (s.resumes >= MAX_EXTERNAL_RESUMES) {
        degrade(s, 'paused')
        return
      }
      s.resumes++
      resumeVisible(s)
    })
    on('timeupdate', () => {
      // в режиме kickstart видео крутится скрыто: как только данных достаточно,
      // возвращаем его в нулевой кадр и идём по обычному пути
      if (s.kick && s.state === 'loading' && v.readyState >= 2) setState(s, 'decoded')
      evaluate(s)
    })
    on('waiting', () => {
      if (s.state !== 'visible') return
      s.stalls++
      emit('waiting', s)
      if (s.waitTimer) clearTimeout(s.waitTimer)
      s.waitTimer = setTimeout(() => {
        s.waitTimer = null
        if (s.state === 'visible' && v.readyState < 3) degrade(s, 'stall')
      }, STALL_AFTER_REVEAL_MS)
    })
    on('stalled', () => {
      if (s.state === 'visible') emit('stalled', s)
    })
    on('error', () => {
      if (!s.loaded) return
      const code = v.error ? v.error.code : 0
      emit('media-error', s, { code })
      // сетевая ошибка при загрузке MP4: одна повторная попытка
      if (code === 2 && s.kind === 'mp4' && s.retries < 1) {
        s.retries++
        const url = v.currentSrc || v.src
        win.setTimeout(() => {
          if (s.loaded && url) v.src = url
        }, 800)
        return
      }
      fail(s, 'media-error-' + code)
    })
    if (s.img && !s.img.complete) {
      const mark = () => {
        if (s.t.posterReady === undefined) s.t.posterReady = now()
        emit('poster', s)
        evaluate(s)
      }
      s.img.addEventListener('load', mark, { once: true })
      s.img.addEventListener('error', mark, { once: true })
    } else {
      s.t.posterReady = 0
    }
  }

  /* ───────────────────────── видимость, наведение, лимит ───────────────────────── */

  let nearIO: IntersectionObserver | null = null
  let viewIO: IntersectionObserver | null = null
  const byEl = (el: Element) => registry.get(el as HTMLElement)

  function ensureObservers() {
    if (nearIO || typeof win.IntersectionObserver !== 'function') return
    nearIO = new win.IntersectionObserver(
      entries => {
        for (const e of entries) {
          const s = byEl(e.target)
          if (!s) continue
          s.near = e.isIntersecting
        }
        reconcile()
      },
      { rootMargin: '300px 0px', threshold: 0 }
    )
    viewIO = new win.IntersectionObserver(
      entries => {
        for (const e of entries) {
          const s = byEl(e.target)
          if (!s) continue
          s.inView = e.isIntersecting
          s.ratio = e.intersectionRatio
          applyViewport(s)
        }
        reconcile()
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
  }

  /** Вышли из кадра — ставим на паузу и не жжём декодер; вернулись — продолжаем */
  function applyViewport(s: Surface) {
    if (!s.loaded) return
    const v = s.video
    if (!s.inView && !v.paused) {
      try {
        v.pause()
      } catch {
        /* ignore */
      }
    } else if (s.inView && v.paused && (s.state === 'visible' || s.state === 'safe')) {
      if (s.state === 'visible') resumeVisible(s)
      else evaluate(s)
    }
  }

  function resumeVisible(s: Surface) {
    if (!wantsPlayback(s)) return
    let p: Promise<void> | undefined
    try {
      p = s.video.play()
    } catch {
      p = undefined
    }
    if (p && typeof p.then === 'function') {
      p.catch(err => {
        const name =
          err && typeof err === 'object' && 'name' in err ? String((err as Error).name) : ''
        if (name !== 'AbortError') degrade(s, 'resume-' + (name || 'error'))
      })
    }
  }

  function heroPending(): boolean {
    let pending = false
    registry.forEach(s => {
      if (
        s.hero &&
        eligible(s) &&
        s.state !== 'visible' &&
        s.state !== 'failed' &&
        s.state !== 'off'
      )
        pending = true
    })
    return pending
  }

  function heroPresent(): boolean {
    let present = false
    registry.forEach(s => {
      if (s.hero) present = true
    })
    return present
  }

  function settleHeroIfNeeded() {
    if (api.settled) return
    if (heroPresent() && heroPending()) return
    api.settled = true
    emit('hero-settled', null)
    win.dispatchEvent(new win.CustomEvent('sm:hero-settled'))
    reconcile()
  }

  /** Блок «только для десктопа» и подобные: решает медиазапрос, а не раскладка */
  function eligible(s: Surface): boolean {
    // data-sm-active="off": карточку закрыла другая (стопка), играть ей нечего
    if (s.el.getAttribute('data-sm-active') === 'off') return false
    return !s.only || s.only.matches
  }

  function score(s: Surface): number {
    if (s.state === 'off' || s.state === 'failed') return 0
    if (!eligible(s)) return 0
    if (s.afterHero && !api.settled) return 0
    if (s.hover) {
      if (isFinePointer()) return s.hovered ? 100 : 0
      if (s.hoverOnly) return 0
      return s.inView && s.ratio >= 0.3 ? 10 + s.ratio * 10 : 0
    }
    return s.near ? 10 + (s.inView ? 5 + s.ratio * 5 : 0) : 0
  }

  let reconcileQueued = false
  function reconcile() {
    if (reconcileQueued) return
    reconcileQueued = true
    Promise.resolve().then(runReconcile)
  }

  function runReconcile() {
    reconcileQueued = false
    const wanted: Surface[] = []
    registry.forEach(s => {
      if (s.hero) {
        if (!s.loaded && s.state !== 'off' && s.state !== 'failed' && eligible(s)) load(s)
        else if (s.loaded && !eligible(s)) unload(s, 'not-eligible')
        return
      }
      if (score(s) > 0) wanted.push(s)
    })
    wanted.sort((a, b) => score(b) - score(a))
    const granted = new Set(wanted.slice(0, MAX_ACTIVE_PREVIEWS))
    registry.forEach(s => {
      if (s.hero) return
      if (granted.has(s)) {
        if (s.holdTimer) {
          clearTimeout(s.holdTimer)
          s.holdTimer = null
        }
        if (!s.loaded) load(s)
        return
      }
      // не получили слот: выгружаем с небольшой задержкой, чтобы не мигать
      if (s.loaded && !s.holdTimer) {
        s.holdTimer = setTimeout(
          () => {
            s.holdTimer = null
            unload(s, 'slot')
          },
          s.near ? HOVER_HOLD_MS : FAR_UNLOAD_MS
        )
      }
    })
  }

  function bindPointer(s: Surface) {
    if (!s.hover) return
    // карточку часто перекрывает ссылка-оверлей, поэтому hover ловим на предке
    const scope = s.el.dataset.smHoverScope
    const el = (scope && s.el.closest(scope)) || s.el
    const enter = () => {
      if (s.hoverTimer) clearTimeout(s.hoverTimer)
      s.hoverTimer = setTimeout(() => {
        s.hovered = true
        reconcile()
        evaluate(s)
      }, HOVER_INTENT_MS)
    }
    const leave = () => {
      if (s.hoverTimer) clearTimeout(s.hoverTimer)
      s.hoverTimer = null
      if (!s.hovered) return
      s.hovered = false
      if (s.loaded) {
        try {
          s.video.pause()
        } catch {
          /* ignore */
        }
      }
      reconcile()
    }
    const add = (type: string, fn: () => void) => {
      el.addEventListener(type, fn)
      s.cleanup.push(() => el.removeEventListener(type, fn))
    }
    add('pointerenter', enter)
    add('pointerleave', leave)
    add('focusin', enter)
    add('focusout', leave)
  }

  /* ───────────────────────── подключение и отключение ───────────────────────── */

  function attach(el: HTMLElement) {
    if (registry.has(el)) return
    const video = el.querySelector('video') as VideoWithRvfc | null
    if (!video) return
    const img = el.querySelector('img')
    const ds = el.dataset
    const mqText = ds.smMq || DEFAULT_MOBILE_MQ
    const s: Surface = {
      el,
      video,
      img: img as HTMLImageElement | null,
      name: ds.smName || 'surface',
      hero: ds.smHero !== undefined,
      hover: ds.smPlay === 'hover' || ds.smPlay === 'hover-only',
      hoverOnly: ds.smPlay === 'hover-only',
      loop: ds.smLoop !== 'off',
      only: ds.smOnly ? mm(ds.smOnly) : null,
      afterHero: ds.smAfter === 'hero',
      minAhead: clamp(parseFloat(ds.smBuffer || '2') || 2, 1.5, 3),
      holdUntil: ds.smHoldUntil || '',
      srcD: ds.smSrcD || '',
      srcM: ds.smSrcM || '',
      stream: ds.smStream || '',
      mq: mqText,
      state: 'poster',
      kind: 'none',
      cls: 'd',
      loaded: false,
      near: ds.smLoad === 'eager',
      inView: false,
      ratio: 0,
      hovered: false,
      holdTimer: null,
      hoverTimer: null,
      tickTimer: null,
      waitTimer: null,
      frameTimer: null,
      kickTimer: null,
      loadTimer: null,
      kickChecks: 0,
      resumes: 0,
      frameToken: 0,
      starting: false,
      awaitingFrame: false,
      kick: false,
      canThrough: false,
      gestureBlocked: false,
      degrades: 0,
      restarts: 0,
      retries: 0,
      minAheadNow: 2,
      samples: [],
      rate: null,
      t: { attach: now() },
      stalls: 0,
      reported: false,
      stallReported: false,
      cleanup: [],
      mql: mm(mqText),
    }
    s.minAheadNow = s.minAhead
    registry.set(el, s)
    s.cls = s.mql && s.mql.matches ? 'm' : 'd'
    el.setAttribute('data-sm-ready', '1')
    if (s.mql) {
      const onChange = () => {
        win.setTimeout(() => swapSource(s), 250)
      }
      if (typeof s.mql.addEventListener === 'function') {
        s.mql.addEventListener('change', onChange)
        const mql = s.mql
        s.cleanup.push(() => mql.removeEventListener('change', onChange))
      }
    }
    bindVideo(s)
    bindPointer(s)

    if (isReduced() || isDataSaver()) {
      setState(s, 'off', { reason: isReduced() ? 'reduced-motion' : 'save-data' })
      report(s, 'off')
      return
    }
    emit('attach', s, { cls: s.cls, hero: s.hero })
    if (ds.smLoad === 'eager' || s.hero) {
      s.near = true
      s.inView = true
      s.ratio = 1
    }
    ensureObservers()
    if (nearIO && viewIO) {
      nearIO.observe(el)
      viewIO.observe(el)
      s.cleanup.push(() => {
        nearIO?.unobserve(el)
        viewIO?.unobserve(el)
      })
    } else {
      // без IntersectionObserver — считаем видимым
      s.near = true
      s.inView = true
      s.ratio = 1
    }
    if (s.only && typeof s.only.addEventListener === 'function') {
      const only = s.only
      const onOnly = () => {
        reconcile()
        settleHeroIfNeeded()
      }
      only.addEventListener('change', onOnly)
      s.cleanup.push(() => only.removeEventListener('change', onOnly))
    }
    if (s.hero && eligible(s)) {
      // hero грузится сразу, не дожидаясь первого колбэка наблюдателя
      load(s)
    }
    reconcile()
    // нет hero (или он не подходит этому экрану): ждать нечего. Иначе settled выставится при показе hero
    settleHeroIfNeeded()
  }

  function detach(el: HTMLElement) {
    const s = registry.get(el)
    if (!s) return
    clearTimers(s)
    if (s.holdTimer) clearTimeout(s.holdTimer)
    if (s.hoverTimer) clearTimeout(s.hoverTimer)
    unload(s, 'removed')
    s.cleanup.forEach(fn => fn())
    registry.delete(el)
    reconcile()
  }

  function scan(root?: ParentNode) {
    const scope = root ?? doc
    const list = scope.querySelectorAll<HTMLElement>('[data-sm]')
    list.forEach(attach)
    if (root instanceof win.HTMLElement && root.matches('[data-sm]')) attach(root)
  }

  function destroyAll() {
    Array.from(registry.keys()).forEach(detach)
  }

  /* ───────────────────────── жизненный цикл страницы ───────────────────────── */

  const mo = new win.MutationObserver(records => {
    let removed = false
    for (const r of records) {
      if (r.removedNodes.length) removed = true
      r.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return
        const el = node as HTMLElement
        if (el.matches('[data-sm]')) attach(el)
        else if (el.querySelector('[data-sm]')) scan(el)
        else if (el.tagName === 'VIDEO') {
          // парсер мог отдать корень поверхности раньше его <video>: подключаем, когда он дошёл
          const root = el.closest('[data-sm]')
          if (root) attach(root as HTMLElement)
        }
      })
    }
    // React переносит узлы: отключаем только те, что действительно ушли из документа
    if (removed) {
      registry.forEach((_s, el) => {
        if (!el.isConnected) detach(el)
      })
    }
  })
  mo.observe(doc.documentElement, { childList: true, subtree: true })

  // Стопка карточек: React переключает data-sm-active, загрузчик пересчитывает слоты
  const activeMo = new win.MutationObserver(() => {
    reconcile()
    settleHeroIfNeeded()
  })
  activeMo.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ['data-sm-active'],
    subtree: true,
  })

  // Постер, который не загрузился (кадр Bunny ещё не сгенерирован), заменяется следующим
  // адресом из data-sm-alt. Событие error не всплывает, поэтому слушаем в фазе перехвата
  doc.addEventListener(
    'error',
    (e: Event) => {
      const img = e.target as HTMLImageElement | null
      if (!img || img.tagName !== 'IMG') return
      const alt = img.getAttribute('data-sm-alt')
      if (!alt) return
      const list = alt.split('|').filter(Boolean)
      const next = list.shift()
      if (!next) return
      img.setAttribute('data-sm-alt', list.join('|'))
      img.removeAttribute('srcset')
      img.removeAttribute('sizes')
      img.src = next
    },
    true
  )

  doc.addEventListener('visibilitychange', () => {
    registry.forEach(s => {
      if (!s.loaded) return
      if (doc.visibilityState === 'hidden') {
        try {
          s.video.pause()
        } catch {
          /* ignore */
        }
      } else if (s.state === 'visible') {
        resumeVisible(s)
      } else {
        evaluate(s)
      }
    })
  })

  win.addEventListener('pagehide', () => {
    registry.forEach(s => {
      if (!s.loaded) return
      try {
        s.video.pause()
      } catch {
        /* ignore */
      }
    })
  })
  win.addEventListener('pageshow', (e: PageTransitionEvent) => {
    if (!e.persisted) return
    emit('bfcache-restore', null)
    registry.forEach(s => {
      if (!s.loaded) return
      if (s.state === 'visible') resumeVisible(s)
      else evaluate(s)
    })
  })

  if (reducedMql && typeof reducedMql.addEventListener === 'function') {
    reducedMql.addEventListener('change', () => {
      registry.forEach(s => {
        if (isReduced()) {
          unload(s, 'reduced-motion')
          setState(s, 'off', { reason: 'reduced-motion' })
        }
      })
    })
  }

  win.setTimeout(() => {
    if (!api.settled) {
      emit('hero-settle-failsafe', null)
      api.settled = true
      win.dispatchEvent(new win.CustomEvent('sm:hero-settled'))
      reconcile()
    }
  }, HERO_SETTLE_FAILSAFE_MS)

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', () => scan(), { once: true })
  } else {
    scan()
  }
  win.addEventListener('load', () => scan(), { once: true })

  return api
}
