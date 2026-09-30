/**
 * /music-video — «БИТ».
 *
 * Метафора: страница живёт в темпе. Посетитель выбирает BPM, и от этого числа
 * зависит всё: как часто на первом экране склеиваются кадры, как бьёт
 * эквалайзер, с какой скоростью бежит метка на линейке, как отзываются
 * наведения. Темп лежит в одной CSS-переменной (--dm-beat) на корне страницы,
 * а JS-часы нужны только первому экрану — счёту и смене кадров.
 *
 * Композиция (у каждой секции свой масштаб и плотность):
 *   1. Первый экран — сцена: кадры режутся по доле, сверху качается свет,
 *      снизу бьёт эквалайзер, заголовок крупнее всего остального на странице.
 *   2. Принцип — строка-лирика размером с экран, слова «поются» от скролла.
 *   3. Этапы — волна-скраббер по структуре трека (интро, куплет, припев,
 *      бридж, аутро): липкая полоса, метка идёт по волне вместе со скроллом,
 *      по волне можно тянуть и нажимать — это навигация по этапам.
 *   4. Призыв после процесса — «плей-бар» во всю ширину.
 *   5. Кому нужен клип — три секвенсорных паттерна вместо списка.
 *   6. Работы, призыв после доказательства, вопросы — общий кит и свой CTA.
 *
 * Безопасность движения. Вспышек на весь экран нет: склейка — быстрая
 * шторка по кадру с красной кромкой, не чаще одной за две доли (≤1,2 раза в
 * секунду при 140 уд/мин), на доле бьёт только тонкая красная линия. Всё
 * бесконечное стоит вне экрана (data-live) и выключено при
 * prefers-reduced-motion: там страница статична, но собрана целиком.
 * Контент (H1, абзацы, кнопки) виден с первого кадра, вход — сдвигом.
 *
 * Если портфолио не пришло, кадры заменяет «сцена» — свет и сетка; секции,
 * смысл и кнопки остаются.
 */
'use client'

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react'
import { ArrowRight, AudioLines } from 'lucide-react'

import { MUSIC_PAGE, type MusicStage } from '@/lib/services/pages/content/music'
import {
  interleaveFrames,
  type DirectionPageWork,
  type SceneFrame,
} from '@/lib/services/pages/resolve'
import { DIRECTION_READING } from '@/lib/services/pages'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionCredits } from '../direction-credits'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import { KIT_KICKER } from '../direction-kit'
import { OtherDirections } from '../other-directions'
import { Still } from '../still'
import './music-page.css'

export interface MusicPageProps {
  works: DirectionPageWork[]
}

/* ─────────────────────────── Темп и часы ─────────────────────────── */

interface TempoApi {
  bpm: number
  setBpm: (value: number) => void
}

const TempoContext = createContext<TempoApi | null>(null)

function useTempo(): TempoApi {
  const value = useContext(TempoContext)
  if (!value) throw new Error('useTempo вызван вне MusicPage')
  return value
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

const NBSP = '\u00a0'
const LETTER = 'A-Za-zА-Яа-яЁё'
const SHORT_WORD = new RegExp(`([${LETTER}]{1,3})(\\s+)(?=\\S)`, 'g')
const NUMBER_UNIT = new RegExp(`(\\d)\\s+(?=[${LETTER}%])`, 'g')
const WORD_EDGE = /[\s«("'—–]/

/**
 * Набор как в общем ките, но с цепочками: общий typo() съедает пробел перед
 * следующим словом вместе с совпадением, и в «нужен ли у нас» средний предлог
 * оставался без привязки и повисал в конце строки. Здесь каждое слово до трёх
 * букв проверяется по исходной строке. maxNext ограничивает длину слова, к
 * которому приклеиваем: в гигантских строках («не иллюстрируем») склейка
 * длиннее экрана вылезла бы за край.
 */
function typo(text: string, maxNext = 40): string {
  return text
    .replace(/\s+—/g, `${NBSP}—`)
    .replace(SHORT_WORD, (match, word: string, _gap: string, offset: number, whole: string) => {
      const before = offset === 0 ? '' : (whole[offset - 1] ?? '')
      if (before && !WORD_EDGE.test(before)) return match
      const next = /^\S+/.exec(whole.slice(offset + match.length))?.[0] ?? ''
      return next.length > maxNext ? match : `${word}${NBSP}`
    })
    .replace(NUMBER_UNIT, `$1${NBSP}`)
}

function subscribeLoad(onChange: () => void) {
  window.addEventListener('load', onChange)
  return () => window.removeEventListener('load', onChange)
}

function useWindowLoaded(): boolean {
  return useSyncExternalStore(
    subscribeLoad,
    () => document.readyState === 'complete',
    () => false
  )
}

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** Без движения на сервере и до гидрации считаем «нет»: разметка одинакова */
function useReduced(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  )
}

/** Часы доли: setTimeout с поправкой на дрейф; после паузы вкладки не нагоняют */
function useBeatClock(bpm: number, running: boolean, onBeat: () => void) {
  useEffect(() => {
    if (!running) return
    const period = 60000 / bpm
    let next = performance.now() + period
    let id = 0
    const tick = () => {
      onBeat()
      const now = performance.now()
      next += period
      if (next < now) next = now + period
      id = window.setTimeout(tick, next - now)
    }
    id = window.setTimeout(tick, period)
    return () => window.clearTimeout(id)
  }, [bpm, running, onBeat])
}

function useInView(ref: RefObject<Element | null>, margin = '0px') {
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (entry) setInView(entry.isIntersecting)
      },
      { rootMargin: margin }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, margin])
  return inView
}

/**
 * Скролл-синхронизация без React: пока узел рядом с экраном, onSync вызывается
 * раз в кадр. Расчёты и запись в DOM делает сам обработчик.
 */
function useScrollSync(ref: RefObject<Element | null>, onSync: () => void, margin = '240px 0px') {
  useEffect(() => {
    const node = ref.current
    if (!node) return
    let frame = 0
    let attached = false
    const run = () => {
      frame = 0
      onSync()
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(run)
    }
    const attach = () => {
      if (attached) return
      attached = true
      window.addEventListener('scroll', schedule, { passive: true })
      window.addEventListener('resize', schedule)
      schedule()
    }
    const detach = () => {
      if (!attached) return
      attached = false
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
      frame = 0
    }
    if (typeof IntersectionObserver === 'undefined') {
      attach()
      return detach
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) attach()
        else detach()
      },
      { rootMargin: margin }
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      detach()
    }
  }, [ref, onSync, margin])
}

/** Помечает зоны с бесконечным движением: вне экрана CSS ставит их на паузу */
function useLiveZones(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          ;(entry.target as HTMLElement).dataset.live = String(entry.isIntersecting)
        }
      },
      { rootMargin: '120px 0px' }
    )
    root.querySelectorAll('[data-live-zone]').forEach(zone => observer.observe(zone))
    return () => observer.disconnect()
  }, [rootRef])
}

/* ─────────────────────────── Мелочи ─────────────────────────── */

const pad = (value: number) => String(value).padStart(2, '0')
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const vars = (values: Record<string, string | number>) => values as CSSProperties

/**
 * Кадры сцены. Первым идёт выбранный в раскадровке план (posterUrl), дальше —
 * кадры галерей вперемешку; повторов нет.
 */
function buildFrames(works: DirectionPageWork[]): SceneFrame[] {
  const lead = works.find(work => work.posterUrl)
  const head: SceneFrame[] = lead?.posterUrl
    ? [
        {
          key: `${lead.slug}-lead`,
          src: lead.posterUrl,
          slug: lead.slug,
          client: lead.client,
          title: lead.title,
        },
      ]
    : []
  const seen = new Set(head.map(frame => frame.src))
  const tail = interleaveFrames(works, 12).filter(frame => !seen.has(frame.src))
  return [...head, ...tail].slice(0, 12)
}

/** Кадр для слота: если кадров мало, берём по кругу; без кадров — null (сцена) */
const frameAt = (frames: SceneFrame[], index: number): SceneFrame | null =>
  frames.length > 0 ? (frames[index % frames.length] ?? null) : null

/* Псевдослучайность без Math.random: сервер и клиент считают одно и то же */
const grain = (i: number) => 0.5 + 0.5 * Math.sin(i * 2.399) * Math.cos(i * 0.71)

/** Огибающая части трека: интро растёт, припев плотный, бридж проваливается, аутро затухает */
function envelope(part: MusicStage['part'], t: number, i: number): number {
  const n = grain(i)
  const value =
    part === 'intro'
      ? 0.16 + 0.3 * t + 0.12 * n
      : part === 'verse'
        ? 0.3 + (i % 4 === 0 ? 0.2 : 0) + 0.16 * n
        : part === 'chorus'
          ? 0.6 + 0.26 * n + (i % 2 === 0 ? 0.1 : 0)
          : part === 'bridge'
            ? 0.36 - 0.2 * Math.sin(Math.PI * t) + 0.1 * n + 0.34 * t ** 3
            : 0.1 + 0.5 * (1 - t) ** 1.3 + 0.1 * n
  return Math.min(1, Math.max(0.1, value))
}

const STAGES = MUSIC_PAGE.stages
const TOTAL_BARS = STAGES.reduce((sum, stage) => sum + stage.bars, 0)

interface PartLayout {
  stage: MusicStage
  /** Доли ширины волны: [from, to] */
  from: number
  to: number
  /** Первый и последний такт части */
  barFrom: number
  barTo: number
  heights: number[]
}

const PARTS: PartLayout[] = (() => {
  let offset = 0
  let column = 0
  return STAGES.map(stage => {
    const count = Math.round(stage.bars * 1.5)
    const heights = Array.from({ length: count }, (_, j) =>
      Number(envelope(stage.part, j / Math.max(1, count - 1), column + j).toFixed(2))
    )
    const layout: PartLayout = {
      stage,
      from: offset / TOTAL_BARS,
      to: (offset + stage.bars) / TOTAL_BARS,
      barFrom: offset + 1,
      barTo: offset + stage.bars,
      heights,
    }
    offset += stage.bars
    column += count
    return layout
  })
})()

/* ─────────────────────────── Переключатель темпа ─────────────────────────── */

function TempoSwitch({ variant }: { variant: 'hero' | 'inline' }) {
  const { bpm, setBpm } = useTempo()
  const labelId = useId()

  return (
    <div role="group" aria-labelledby={labelId} className="dir-music-tempo" data-variant={variant}>
      <p id={labelId} className="dir-music-tempo-label type-meta font-mono uppercase">
        {variant === 'hero' ? 'Темп склейки, уд/мин' : 'Темп страницы, уд/мин'}
      </p>
      <div className="dir-music-tempo-row">
        {MUSIC_PAGE.tempos.map(tempo => (
          <button
            key={tempo}
            type="button"
            onClick={() => setBpm(tempo)}
            aria-pressed={bpm === tempo}
            className="dir-music-tempo-btn"
          >
            <span className="dir-music-tempo-num tabular-nums">{tempo}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────── Линейка доли ─────────────────────────── */

/**
 * Линейка такта: засечки на каждую долю, красная метка шагает по долям.
 * Склейка между секциями и низ первого экрана; темп — от корня страницы.
 */
function BeatRuler({ variant, label }: { variant: 'hero' | 'slim'; label?: string }) {
  const { bpm } = useTempo()

  return (
    <div className="dir-music-ruler" data-variant={variant} data-live-zone aria-hidden="true">
      <span className="dir-music-ruler-head" />
      {variant === 'hero'
        ? [1, 2, 3, 4].map(bar => (
            <span
              key={bar}
              className="dir-music-ruler-bar type-meta-sm font-mono uppercase tabular-nums"
              style={vars({ '--at': (bar - 1) / 4 })}
            >
              {pad(bar)}
            </span>
          ))
        : null}
      {label ? (
        <span className="dir-music-ruler-label type-meta font-mono uppercase">{label}</span>
      ) : null}
      <span className="dir-music-ruler-bpm type-meta font-mono uppercase tabular-nums">
        {bpm} уд/мин
      </span>
    </div>
  )
}

/* ─────────────────────────── 1. Первый экран ─────────────────────────── */

const EQ_BARS = 44

/** Уровни полосы: низкие бьют на «бочку», средние — на «снейр», верхние живут тише */
function eqLevels(i: number) {
  const t = i / (EQ_BARS - 1)
  const body = 0.55 + 0.45 * Math.abs(Math.sin(i * 1.7))
  const kick = Math.max(0.16, 1 - t * 1.25) * body
  const snare = Math.max(0.14, 1 - Math.abs(t - 0.5) * 1.9) * (0.65 + 0.35 * grain(i))
  const rest = 0.1 + 0.14 * grain(i + 9)
  return {
    '--k': kick.toFixed(2),
    '--s': snare.toFixed(2),
    '--r': rest.toFixed(2),
  } as CSSProperties
}

const EQ_STYLES = Array.from({ length: EQ_BARS }, (_, i) => eqLevels(i))

interface HeroFramesProps {
  frames: SceneFrame[]
  cut: number
  prev: number
  fresh: boolean
}

/** Кадры монтажа. Перерисовывается только на склейке, а не на каждой доле */
const HeroFrames = memo(function HeroFrames({ frames, cut, prev, fresh }: HeroFramesProps) {
  if (frames.length === 0) return <span className="dir-music-plate" />
  return (
    <>
      {frames.map((frame, index) => {
        const state = index === cut ? 'on' : index === prev ? 'prev' : 'off'
        return (
          <div key={frame.key} className="dir-music-frame" data-state={state} data-fresh={fresh}>
            <Still
              src={frame.src}
              alt=""
              priority={index === 0}
              sizes="100vw"
              quality={index === 0 ? 75 : 65}
              className="h-full w-full"
            />
            {state === 'on' && fresh ? <span className="dir-music-edge" /> : null}
          </div>
        )
      })}
    </>
  )
})

const Transport = memo(function Transport({ bpm, beat }: { bpm: number; beat: number }) {
  const bar = Math.floor(beat / 4) + 1
  const inBar = beat % 4
  return (
    <p
      aria-hidden="true"
      className="dir-music-transport type-meta font-mono uppercase tabular-nums"
    >
      <span>{bpm} уд/мин</span>
      <span className="dir-music-transport-bar">такт {pad(bar % 100)}</span>
      <span className="dir-music-pips">
        {[0, 1, 2, 3].map(i => (
          <i key={i} data-on={i === inBar} data-down={i === 0} />
        ))}
      </span>
    </p>
  )
})

/**
 * Подпись первого экрана: слово на доле подсвечено. Две строки заданы текстом:
 * при подмене шрифта слова остаются на своих строках и не прыгают через весь
 * блок, а это главный источник сдвига разметки на первом экране.
 */
const LyricLine = memo(function LyricLine({ lines, beat }: { lines: string[]; beat: number }) {
  const rows = lines.map(line => typo(line).split(' '))
  const total = rows.reduce((sum, words) => sum + words.length, 0)
  const starts = rows.map((_, row) =>
    rows.slice(0, row).reduce((sum, words) => sum + words.length, 0)
  )
  return (
    <p className="dir-music-tagline">
      {rows.map((words, row) => (
        <span key={row} className="dir-music-tagline-line">
          {words.map((word, index) => (
            <span key={`${word}-${index}`}>
              {index > 0 ? ' ' : null}
              <span
                className="dir-music-word"
                data-on={beat >= 0 && (starts[row] ?? 0) + index === beat % total}
              >
                {word}
              </span>
            </span>
          ))}{' '}
        </span>
      ))}
    </p>
  )
})

function Hero({ frames }: { frames: SceneFrame[] }) {
  const page = useDirectionPage()
  const { bpm } = useTempo()
  const reduced = useReduced()
  const loaded = useWindowLoaded()
  const rootRef = useRef<HTMLElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const beamsRef = useRef<HTMLDivElement>(null)
  const eqRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const framesRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef)
  const [beat, setBeat] = useState(0)
  const [shift, setShift] = useState(0)
  const [scene, setScene] = useState({ index: 0, prev: 0, changes: 0 })
  const beatRef = useRef(0)
  const sceneRef = useRef(scene)
  const armedRef = useRef(false)

  const count = frames.length

  /**
   * Склейка только на кадр, который уже загрузился: остальные кадры ленивые,
   * и на медленной сети шторка открыла бы пустой прямоугольник. Нет готового —
   * остаёмся на текущем.
   */
  const cutNext = useCallback(() => {
    const box = framesRef.current
    if (!box || count < 2) return
    const from = sceneRef.current.index
    for (let step = 1; step < count; step += 1) {
      const index = (from + step) % count
      const image = box.children[index]?.querySelector('img')
      if (!image || !image.complete || image.naturalWidth === 0) continue
      const next = { index, prev: from, changes: sceneRef.current.changes + 1 }
      sceneRef.current = next
      setScene(next)
      return
    }
  }, [count])

  // Первые полторы секунды после load сцена «включается» сама (кадр оседает,
  // свет разгорается), а сеть занята кадрами: склейки начинаются после этого.
  // Счёт доли идёт с самого начала, режется только с этого момента.
  useEffect(() => {
    if (!loaded) return
    const id = window.setTimeout(() => {
      armedRef.current = true
    }, 1400)
    return () => window.clearTimeout(id)
  }, [loaded])

  // Доля: счёт идёт всегда, кадр меняется на каждую вторую долю
  const onBeat = useCallback(() => {
    beatRef.current += 1
    setBeat(beatRef.current)
    if (beatRef.current % 2 === 0 && armedRef.current) cutNext()
  }, [cutNext])
  useBeatClock(bpm, inView && !reduced, onBeat)

  const fresh = scene.changes > 0
  // Свет меняет положение на каждой склейке, даже если кадров нет
  const aimStep = (Math.floor(beat / 2) + shift) % 2

  // Ввод. Курсор или горизонтальный жест пальцем качает свет; скролл уводит
  // кадр вниз и гасит эквалайзер. Запись — прямо в transform, без React.
  useEffect(() => {
    const root = rootRef.current
    if (!root || reduced) return
    const aim = { target: 0, current: 0, frame: 0 }
    const settle = () => {
      aim.current += (aim.target - aim.current) * 0.09
      if (beamsRef.current) beamsRef.current.style.transform = `rotate(${aim.current * 7}deg)`
      aim.frame = Math.abs(aim.target - aim.current) > 0.002 ? requestAnimationFrame(settle) : 0
    }
    const onMove = (event: globalThis.PointerEvent) => {
      const box = root.getBoundingClientRect()
      aim.target = clamp01((event.clientX - box.left) / box.width) * 2 - 1
      if (!aim.frame) aim.frame = requestAnimationFrame(settle)
    }
    root.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      root.removeEventListener('pointermove', onMove)
      if (aim.frame) cancelAnimationFrame(aim.frame)
    }
  }, [reduced])

  const syncScroll = useCallback(() => {
    const root = rootRef.current
    if (!root || reduced) return
    const progress = clamp01(-root.getBoundingClientRect().top / root.offsetHeight)
    if (parallaxRef.current) {
      parallaxRef.current.style.transform = `translate3d(0, ${(progress * 70).toFixed(1)}px, 0) scale(${(1 + progress * 0.07).toFixed(3)})`
    }
    if (copyRef.current) {
      copyRef.current.style.transform = `translate3d(0, ${(-progress * 36).toFixed(1)}px, 0)`
    }
    if (eqRef.current) {
      eqRef.current.style.transform = `scaleY(${(1 - progress * 0.75).toFixed(3)})`
    }
  }, [reduced])
  useScrollSync(rootRef, syncScroll, '0px')

  const onCut = (event: MouseEvent<HTMLElement>) => {
    if (reduced) return
    if ((event.target as HTMLElement).closest('a, button')) return
    setShift(value => value + 1)
    cutNext()
  }

  const lineBeat = reduced ? -1 : beat

  return (
    // Клик по кадру — необязательная игра: всё, что в ней есть, доступно и
    // без неё (кнопки, темп), поэтому отдельной клавиатурной кнопки нет
    <section ref={rootRef} className="dir-music-hero dir-music-pad" data-live-zone onClick={onCut}>
      <div aria-hidden="true" className="dir-music-stage">
        <div ref={parallaxRef} className="dir-music-parallax">
          <div ref={framesRef} className="dir-music-frames">
            <HeroFrames frames={frames} cut={scene.index} prev={scene.prev} fresh={fresh} />
          </div>
        </div>
        <span className="dir-music-scrim" />
        <div ref={beamsRef} className="dir-music-beams-aim">
          <div className="dir-music-beams" data-aim={aimStep}>
            <span className="dir-music-beam" data-beam="1" />
            <span className="dir-music-beam" data-beam="2" />
            <span className="dir-music-beam" data-beam="3" />
          </div>
        </div>
        <span key={beat} className="dir-music-tick" data-down={beat % 4 === 0} />
        <span className="dir-music-arrive" />
        <div ref={eqRef} className="dir-music-eq-scroll">
          <div key={bpm} className="dir-music-eq">
            {EQ_STYLES.map((style, index) => (
              <span key={index} className="dir-music-eq-bar" style={style} />
            ))}
          </div>
        </div>
      </div>

      <BeatRuler variant="hero" />

      <div ref={copyRef} className="dir-music-copy">
        <div className="dir-music-meta dir-music-in" style={vars({ '--in': 0 })}>
          <p className="dir-music-geo type-meta font-mono uppercase">
            <span>07 / MUSIC</span> <span>Санкт-Петербург</span> <span>Москва</span>{' '}
            <span>по России</span>
          </p>
          <Transport bpm={bpm} beat={beat} />
        </div>

        <div className="dir-music-lock">
          <h1 className="dir-music-h1">
            <span className="dir-music-h1-a dir-music-in" style={vars({ '--in': 1 })}>
              Музыкальный
            </span>{' '}
            <span className="dir-music-h1-b dir-music-in" style={vars({ '--in': 2 })}>
              <span key={Math.floor(beat / 4)} className={beat > 0 ? 'dir-music-bump' : undefined}>
                клип
              </span>
            </span>
          </h1>
          <div className="dir-music-tempo-slot dir-music-in" style={vars({ '--in': 3 })}>
            <TempoSwitch variant="hero" />
          </div>
        </div>

        <div className="dir-music-foot dir-music-in" style={vars({ '--in': 4 })}>
          <LyricLine lines={MUSIC_PAGE.tagline} beat={lineBeat} />
          <div className="dir-music-act">
            <button type="button" onClick={() => page.openBrief('hero')} className="dir-music-cta">
              <span className="dir-music-cta-curtain" aria-hidden="true" />
              <span className="dir-music-cta-label">{MUSIC_PAGE.ctaLabel}</span>
              <ArrowRight aria-hidden="true" className="dir-music-cta-arrow" />
            </button>
            {count > 1 ? (
              <p aria-hidden="true" className="dir-music-hint type-meta font-mono uppercase">
                <span className="dir-music-hint-pointer">Клик по кадру — склейка</span>
                <span className="dir-music-hint-touch">Тап по кадру — склейка</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── 2. Принцип ─────────────────────────── */

function Manifesto() {
  const sectionRef = useRef<HTMLElement>(null)
  const lyricRef = useRef<HTMLParagraphElement>(null)
  const last = useRef(-2)
  const words = useMemo(() => typo(MUSIC_PAGE.lyric, 10).split(' '), [])

  // Слова «поются» по мере скролла: ушло — белое, поётся сейчас — красное.
  // Состояние лежит в data-s: React на скролле не перерисовывается.
  const sync = useCallback(() => {
    const lyric = lyricRef.current
    if (!lyric || window.matchMedia(REDUCED_QUERY).matches) return
    const box = lyric.getBoundingClientRect()
    const vh = window.innerHeight
    const progress = clamp01((vh * 0.86 - box.top) / (vh * 0.46 + box.height))
    const total = words.length
    const current = Math.min(total, Math.floor(progress * (total + 1)))
    if (current === last.current) return
    last.current = current
    lyric.querySelectorAll<HTMLElement>('[data-w]').forEach((node, index) => {
      node.dataset.s = index < current ? 'sung' : index === current ? 'now' : 'next'
    })
  }, [words.length])
  useScrollSync(sectionRef, sync)

  return (
    <section
      ref={sectionRef}
      aria-labelledby="music-lyric-title"
      className="dir-music-manifesto dir-music-pad"
    >
      <p className={KIT_KICKER} data-reveal="">
        <span aria-hidden="true" className="h-px w-8 bg-accent" />
        01 / Принцип
      </p>
      <h2 id="music-lyric-title" className="sr-only">
        Принцип: монтаж внутри структуры трека
      </h2>

      <p ref={lyricRef} className="dir-music-lyric">
        {words.map((word, index) => (
          <span key={`${word}-${index}`}>
            {index > 0 ? ' ' : null}
            <span data-w="" className="dir-music-w">
              {word}
            </span>
          </span>
        ))}
      </p>

      <div className="dir-music-lyric-foot" data-reveal="">
        <p className="dir-music-lyric-note">{typo(MUSIC_PAGE.lyricNote)}</p>
        <p className="dir-music-lyric-source type-meta font-mono uppercase">
          <span aria-hidden="true" className="h-px w-6 bg-white/40" />
          {typo(MUSIC_PAGE.lyricSource)}
        </p>
      </div>
    </section>
  )
}

/* ─────────────────────────── 3. Скраббер этапов ─────────────────────────── */

function Tracks({ frames }: { frames: SceneFrame[] }) {
  const { bpm } = useTempo()
  const reduced = useReduced()
  const sectionRef = useRef<HTMLElement>(null)
  const deckRef = useRef<HTMLDivElement>(null)
  const waveRef = useRef<HTMLDivElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLSpanElement>(null)
  const flagRef = useRef<HTMLSpanElement>(null)
  const flagBoxRef = useRef<HTMLSpanElement>(null)
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])
  const navRef = useRef<HTMLOListElement>(null)
  const current = useRef(0)
  const gesture = useRef({ id: -1, x: 0, moved: false, suppress: false })
  const [active, setActive] = useState(0)

  /**
   * Линия отсчёта: чуть ниже липкой полосы. Часть, через которую она идёт, —
   * играет. На низком экране полоса не липнет, и высоту её не считаем.
   */
  const referenceLine = () => {
    const deck = deckRef.current
    if (!deck) return 72
    return (getComputedStyle(deck).position === 'sticky' ? deck.offsetHeight : 0) + 72
  }

  const sync = useCallback(() => {
    const wave = waveRef.current
    if (!wave) return
    const deck = deckRef.current
    const line = (deck && getComputedStyle(deck).position === 'sticky' ? deck.offsetHeight : 0) + 72
    const rows = rowRefs.current
    let index = rows.length - 1
    let local = 1
    for (let i = 0; i < rows.length; i += 1) {
      const box = rows[i]?.getBoundingClientRect()
      if (!box) continue
      if (box.bottom > line) {
        index = i
        local = clamp01((line - box.top) / box.height)
        break
      }
    }
    const part = PARTS[index]
    if (!part) return
    const fraction = part.from + local * (part.to - part.from)
    if (headRef.current) {
      headRef.current.style.transform = `translate3d(${(fraction * wave.clientWidth).toFixed(1)}px, 0, 0)`
    }
    if (fillRef.current) {
      fillRef.current.style.clipPath = `inset(0 ${((1 - fraction) * 100).toFixed(2)}% 0 0)`
    }
    if (flagRef.current) {
      flagRef.current.textContent = pad(Math.min(TOTAL_BARS, Math.floor(fraction * TOTAL_BARS) + 1))
    }
    // У краёв волны флажок не выходит за экран: прижимается к метке боком
    if (flagBoxRef.current) {
      const anchor = fraction < 0.05 ? 0 : fraction > 0.95 ? 100 : 50
      flagBoxRef.current.style.transform = `translateX(-${anchor}%)`
    }
    if (current.current !== index) {
      current.current = index
      setActive(index)
    }
  }, [])
  useScrollSync(sectionRef, sync, '400px 0px')

  const scrollToPart = (index: number) => {
    const row = rowRefs.current[index]
    if (!row) return
    const top = row.getBoundingClientRect().top + window.scrollY - referenceLine() + 14
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  }

  /** Тянем по волне — страница едет к тому месту трека, на которое указали */
  const scrubTo = (clientX: number) => {
    const wave = waveRef.current
    if (!wave) return
    const box = wave.getBoundingClientRect()
    const fraction = clamp01((clientX - box.left) / box.width)
    const index = Math.max(
      0,
      PARTS.findIndex(part => fraction <= part.to)
    )
    const part = PARTS[index]
    const row = rowRefs.current[index]?.getBoundingClientRect()
    if (!part || !row) return
    const local = clamp01((fraction - part.from) / (part.to - part.from))
    const top = row.top + window.scrollY + local * row.height - referenceLine()
    window.scrollTo({ top, behavior: 'instant' })
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    gesture.current = { id: event.pointerId, x: event.clientX, moved: false, suppress: false }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const state = gesture.current
    if (state.id !== event.pointerId) return
    if (!state.moved) {
      if (Math.abs(event.clientX - state.x) < 6) return
      state.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    scrubTo(event.clientX)
  }
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const state = gesture.current
    if (state.id !== event.pointerId) return
    state.suppress = state.moved
    state.id = -1
    // Захваченный указатель не доставляет клик кнопке, и флаг остался бы
    // поднятым до следующего нажатия: после перетаскивания Enter не работал
    if (state.suppress) {
      window.setTimeout(() => {
        gesture.current.suppress = false
      }, 0)
    }
  }
  const onPartClick = (event: MouseEvent<HTMLButtonElement>, index: number) => {
    // detail === 0 — клик с клавиатуры: у него не бывает «хвоста» от перетаскивания
    if (gesture.current.suppress && event.detail !== 0) {
      gesture.current.suppress = false
      return
    }
    scrollToPart(index)
  }

  const onNavKey = (event: KeyboardEvent<HTMLOListElement>) => {
    const buttons = Array.from(navRef.current?.querySelectorAll('button') ?? [])
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (at < 0) return
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    buttons[(at + step + buttons.length) % buttons.length]?.focus()
  }

  return (
    <section
      ref={sectionRef}
      id="music-stages"
      aria-labelledby="music-stages-title"
      className="dir-music-tracks"
      data-live-zone
    >
      <header className="dir-music-tracks-head dir-music-pad">
        <p className={KIT_KICKER} data-reveal="">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          02 / От трека до клипа
        </p>
        <div className="dir-music-tracks-head-row">
          <h2 id="music-stages-title" data-reveal="" className="dir-music-h2">
            {typo('Клип собирается как трек')}
          </h2>
          <p className="dir-music-lede" data-reveal="">
            {typo('Каждому этапу — своя часть композиции. Листайте или тяните метку по волне.')}
          </p>
        </div>
      </header>

      <div
        ref={deckRef}
        className="dir-music-deck"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div className="dir-music-deck-strip dir-music-pad type-meta font-mono uppercase">
          <span>Схема трека · {TOTAL_BARS} такта</span>
          <span className="tabular-nums">{bpm} уд/мин · 4/4</span>
        </div>

        <div className="dir-music-wave-wrap dir-music-pad">
          <div ref={waveRef} className="dir-music-wave">
            <div aria-hidden="true" className="dir-music-wave-layer">
              {PARTS.map((part, index) => (
                <div
                  key={part.stage.part}
                  className="dir-music-wave-part"
                  data-on={active === index}
                  style={{ flexGrow: part.stage.bars }}
                >
                  {part.heights.map((height, i) => (
                    <span
                      key={i}
                      className="dir-music-wave-bar"
                      style={vars({ height: `${height * 100}%`, '--i': i })}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div
              ref={fillRef}
              aria-hidden="true"
              className="dir-music-wave-layer dir-music-wave-fill"
            >
              {PARTS.map((part, index) => (
                <div
                  key={part.stage.part}
                  className="dir-music-wave-part"
                  data-on={active === index}
                  style={{ flexGrow: part.stage.bars }}
                >
                  {part.heights.map((height, i) => (
                    <span
                      key={i}
                      className="dir-music-wave-bar"
                      style={vars({ height: `${height * 100}%`, '--i': i })}
                    />
                  ))}
                </div>
              ))}
            </div>
            <span ref={headRef} aria-hidden="true" className="dir-music-head">
              <span
                ref={flagBoxRef}
                className="dir-music-head-flag type-meta-sm font-mono tabular-nums"
              >
                <span ref={flagRef}>01</span>
              </span>
            </span>

            <nav aria-label="Структура трека" className="dir-music-nav">
              <ol ref={navRef} onKeyDown={onNavKey}>
                {PARTS.map((part, index) => (
                  <li key={part.stage.part} style={{ flexGrow: part.stage.bars }}>
                    <button
                      type="button"
                      onClick={event => onPartClick(event, index)}
                      aria-current={active === index ? 'step' : undefined}
                      aria-label={`${part.stage.partLabel}: ${part.stage.title}`}
                      className="dir-music-part"
                    >
                      <span className="dir-music-part-label type-meta font-mono uppercase">
                        {part.stage.partLabel}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <ol className="dir-music-rows">
        {PARTS.map((part, index) => {
          const frame = frameAt(frames, frames.length > 6 ? 6 + index : index * 2 + 1)
          const { stage } = part
          return (
            <li
              key={stage.part}
              id={`music-part-${index}`}
              ref={node => {
                rowRefs.current[index] = node
              }}
              className="dir-music-row dir-music-pad"
              data-part={stage.part}
              data-active={active === index}
            >
              <div className="dir-music-row-body">
                <p className="dir-music-row-kicker type-meta font-mono uppercase tabular-nums">
                  <span>{stage.number}</span>
                  <span aria-hidden="true" className="dir-music-row-dash" />
                  <span>{stage.partLabel}</span>
                  <span className="text-white/55">
                    · такты {pad(part.barFrom)}–{pad(part.barTo)}
                  </span>
                </p>
                <span aria-hidden="true" className="dir-music-row-word">
                  {stage.partLabel}
                </span>
                <h3 className="dir-music-row-title">{typo(stage.title)}</h3>
                <p className="dir-music-row-text">{typo(stage.text)}</p>
                <ul className="dir-music-tags" role="list">
                  {stage.tags.map((tag, position) => (
                    <li
                      key={tag}
                      className="type-meta font-mono uppercase"
                      style={vars({ '--n': position })}
                    >
                      {typo(tag)}
                    </li>
                  ))}
                </ul>
              </div>

              {stage.part === 'bridge' ? (
                <div aria-hidden="true" className="dir-music-bridge-count">
                  <i className="type-meta font-mono uppercase">Вход · такт</i>
                  <span className="tabular-nums">{pad(part.barFrom)}</span>
                  <i className="type-meta font-mono uppercase">Выход · такт</i>
                  <span className="tabular-nums">{pad(part.barTo)}</span>
                </div>
              ) : null}

              <div aria-hidden="true" className="dir-music-monitor">
                <div className="dir-music-monitor-img">
                  {frame ? (
                    <Still
                      src={frame.src}
                      alt=""
                      sizes={
                        stage.part === 'bridge'
                          ? '100vw'
                          : '(min-width: 1024px) 50vw, (min-width: 768px) 46vw, 92vw'
                      }
                      quality={stage.part === 'bridge' ? 65 : 50}
                      className="absolute inset-0 h-full w-full"
                    />
                  ) : (
                    <span className="dir-music-plate" />
                  )}
                </div>
                <span className="dir-music-monitor-scrim" />
                <div className="dir-music-monitor-bars">
                  {part.heights.map((height, i) => (
                    <span key={i} style={vars({ height: `${height * 100}%`, '--i': i })} />
                  ))}
                </div>
                <span className="dir-music-monitor-cap type-meta-sm font-mono uppercase tabular-nums">
                  {stage.partLabel} · {pad(part.barFrom)}–{pad(part.barTo)}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/* ─────────────────────────── 4. Призыв после процесса ─────────────────────────── */

const PLAY_BARS = Array.from({ length: 64 }, (_, i) => ({
  height: Number(
    (0.2 + 0.8 * Math.abs(Math.sin(i * 0.43) * 0.6 + Math.sin(i * 0.11 + 1) * 0.4)).toFixed(2)
  ),
  index: i,
}))

function PlayBar() {
  const page = useDirectionPage()

  return (
    <section aria-label="Обсудить клип" className="dir-music-play dir-music-pad" data-live-zone>
      <div className="dir-music-play-card" data-reveal="">
        <div aria-hidden="true" className="dir-music-play-wave">
          {PLAY_BARS.map(bar => (
            <span
              key={bar.index}
              style={vars({ height: `${bar.height * 100}%`, '--i': bar.index })}
            />
          ))}
        </div>
        <span aria-hidden="true" className="dir-music-play-disc">
          <AudioLines className="h-6 w-6 md:h-8 md:w-8" strokeWidth={2.25} />
        </span>
        <p className="dir-music-play-lead">{typo(MUSIC_PAGE.play.lead)}</p>
        <button
          type="button"
          onClick={() => page.openBrief('process')}
          className="dir-music-play-btn"
        >
          <span>{MUSIC_PAGE.play.ctaLabel}</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </section>
  )
}

/* ─────────────────────────── 5. Кому нужен клип ─────────────────────────── */

/** Три дорожки на 16 долей: «бочка», «снейр», верхние. Декор, у каждого заказчика свой рисунок */
const PATTERNS = [
  ['x...x...x...x..x', '....x.......x...', 'x.x.x.x.x.x.x.xx'],
  ['x.......x.......', '........x.......', '..x...x...x...x.'],
  ['x..x..x...x..x..', '....x.......x..x', '.x.x.x.x.x.x.x.x'],
] as const

function Sequencer() {
  const listRef = useRef<HTMLUListElement>(null)

  // Без курсора строку зажигает положение на экране — как титры работ ниже
  useEffect(() => {
    const list = listRef.current
    if (!list || typeof IntersectionObserver === 'undefined') return
    const touch = window.matchMedia('(hover: none)')
    let observer: IntersectionObserver | null = null
    const connect = () => {
      observer?.disconnect()
      observer = null
      const rows = list.querySelectorAll<HTMLElement>('[data-seq]')
      rows.forEach(row => row.removeAttribute('data-focus'))
      if (!touch.matches) return
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            ;(entry.target as HTMLElement).dataset.focus = String(entry.isIntersecting)
          }
        },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
      )
      rows.forEach(row => observer?.observe(row))
    }
    connect()
    touch.addEventListener('change', connect)
    return () => {
      touch.removeEventListener('change', connect)
      observer?.disconnect()
    }
  }, [])

  return (
    <section
      aria-labelledby="music-seq-title"
      className="dir-music-seq dir-music-pad"
      data-live-zone
    >
      <div className="dir-music-seq-head">
        <div>
          <p className={KIT_KICKER} data-reveal="">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            03 / Кому
          </p>
          <h2 id="music-seq-title" data-reveal="" className="dir-music-h2">
            {typo('Кому нужен клип')}
          </h2>
        </div>
        <TempoSwitch variant="inline" />
      </div>

      <ul ref={listRef} role="list" className="dir-music-seq-list">
        {MUSIC_PAGE.audiences.map((item, index) => (
          <li key={item.title} data-seq="" className="dir-music-seq-row" data-reveal="">
            <span className="dir-music-seq-idx type-meta font-mono uppercase tabular-nums">
              {pad(index + 1)}
            </span>
            <div className="dir-music-seq-copy">
              <h3 className="dir-music-seq-title">{typo(item.title)}</h3>
              <p className="dir-music-seq-text">{typo(item.text)}</p>
            </div>
            <div aria-hidden="true" className="dir-music-seq-grid">
              {(PATTERNS[index % PATTERNS.length] ?? PATTERNS[0]).map((lane, laneIndex) => (
                <div key={laneIndex} className="dir-music-seq-lane">
                  {Array.from(lane).map((cell, step) => (
                    <span
                      key={step}
                      className="dir-music-seq-cell"
                      data-on={cell === 'x'}
                      data-beat={step % 4 === 0}
                      style={vars({ '--i': step })}
                    />
                  ))}
                </div>
              ))}
              <span className="dir-music-seq-head-col" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─────────────────────────── 6. Призыв после доказательства ─────────────────────────── */

function CueCta() {
  const page = useDirectionPage()

  return (
    <section
      aria-labelledby="music-cue-title"
      className="dir-music-cue dir-music-pad"
      data-live-zone
    >
      <h2 id="music-cue-title" className="dir-music-cue-title" data-reveal="">
        <span className="dir-music-cue-lead">{typo(MUSIC_PAGE.cue.lead)}</span>{' '}
        <span className="dir-music-cue-accent">{typo(MUSIC_PAGE.cue.accent)}</span>
      </h2>

      <div className="dir-music-cue-side" data-reveal="">
        <ol className="dir-music-cue-list" role="list">
          {MUSIC_PAGE.cue.items.map((entry, index) => (
            <li key={entry} className="dir-music-cue-item">
              <span className="type-meta font-mono uppercase tabular-nums">{pad(index + 1)}</span>
              <span>{typo(entry)}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => page.openBrief('proof')}
          className="dir-music-cta dir-music-cta-wide"
        >
          <span className="dir-music-cta-curtain" aria-hidden="true" />
          <span className="dir-music-cta-label">{MUSIC_PAGE.cue.ctaLabel}</span>
          <ArrowRight aria-hidden="true" className="dir-music-cta-arrow" />
        </button>
        <p className="dir-music-cue-note">{typo(MUSIC_PAGE.cue.note)}</p>
      </div>
    </section>
  )
}

/* ─────────────────────────── Страница ─────────────────────────── */

// Разметка FAQPage строится из MUSIC_PAGE.faq как есть; неразрывные пробелы
// нужны только набору на странице
const FAQ_ITEMS = MUSIC_PAGE.faq.map(item => ({
  question: typo(item.question),
  answer: typo(item.answer),
}))

export function MusicPage({ works }: MusicPageProps) {
  const [bpm, setBpm] = useState<number>(MUSIC_PAGE.tempos[2] ?? 128)
  const tempo = useMemo<TempoApi>(() => ({ bpm, setBpm }), [bpm])
  const rootRef = useRef<HTMLDivElement>(null)
  const frames = useMemo(() => buildFrames(works), [works])
  const closing = frames[frames.length - 1]
  useLiveZones(rootRef)

  return (
    <DirectionShell id="music" stickyLabel={MUSIC_PAGE.stickyLabel}>
      <TempoContext.Provider value={tempo}>
        <div
          ref={rootRef}
          className="dir-music"
          style={vars({ '--dm-beat': `${Math.round(60000 / bpm)}ms` })}
        >
          <Hero frames={frames.slice(0, 6)} />
          <Manifesto />
          <Tracks frames={frames} />
          <PlayBar />
          <Sequencer />
          <BeatRuler variant="slim" label="Клипы" />
          <DirectionCredits
            index="04"
            title="Клипы"
            works={works}
            note="Музыкальные работы студии"
          />
          <CueCta />
          <BeatRuler variant="slim" label="Вопросы" />
          <DirectionFaq index="05" title="Вопросы о съёмке клипа" items={FAQ_ITEMS} />
          <OtherDirections current="music" reading={DIRECTION_READING['music']} />
          <DirectionEnd
            lines={MUSIC_PAGE.end.lines}
            ctaLabel={MUSIC_PAGE.end.ctaLabel}
            note={typo(MUSIC_PAGE.end.note)}
            frame={closing ? { src: closing.src, alt: closing.client } : null}
          />
        </div>
      </TempoContext.Provider>
    </DirectionShell>
  )
}
