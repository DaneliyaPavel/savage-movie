/**
 * /music-video — «БИТ».
 *
 * Метафора: страница живёт в темпе. Посетитель выбирает BPM, и от этого числа
 * зависит всё: как часто на первом экране склеиваются кадры, как бьёт
 * эквалайзер, с какой скоростью бежит метка на линейке, как отзываются
 * наведения. Темп лежит в одной CSS-переменной (--dm-beat) на корне страницы,
 * а JS-часы нужны только двум экранам-монтажам — первому и заставке работ.
 *
 * Композиция (у каждой секции свой масштаб и плотность):
 *   1. Первый экран — сцена: кадры режутся по доле, сверху качается свет,
 *      над линейкой бьёт эквалайзер (своя полоса, на текст не заходит),
 *      заголовок крупнее всего остального на странице.
 *   2. Принцип — строка-лирика размером с экран, слова «поются» от скролла.
 *   3. Этапы — волна-скраббер по структуре трека (интро, куплет, припев,
 *      бридж, аутро): липкая полоса, метка идёт по волне вместе со скроллом,
 *      по волне можно тянуть и нажимать — это навигация по этапам. На низком
 *      экране полоса не липнет, этап показывает мини-индикатор в шапке. У каждой
 *      части своя композиция; бридж — «дорожка тишины» на листе --dir-paper,
 *      лист открывается шторкой (clip-path), как склейка на первом экране.
 *   4. Призыв после процесса — «плей-бар» во всю ширину.
 *   5. Кому нужен клип — три секвенсорных паттерна с подписью: колонки на
 *      широком экране, строки на узком.
 *   6. Заставка работ — экран целиком: кадры клипов режутся на такт, имя
 *      работы крупно. Кульминация страницы, за ней — список работ кита.
 *   7. Работы, призыв после доказательства, вопросы — общий кит и свой CTA.
 *
 * Безопасность движения. Вспышек на весь экран нет: склейка — быстрая
 * шторка по кадру с красной кромкой, не чаще одной за две доли (≤1,2 раза в
 * секунду при 140 уд/мин), на доле бьёт только тонкая красная линия. Всё
 * бесконечное стоит вне экрана (data-live) и выключено при
 * prefers-reduced-motion: там страница статична, но собрана целиком.
 * Контент (H1, абзацы, кнопки) виден с первого кадра, вход — сдвигом.
 *
 * Кадры первого экрана, этапов и выхода — отобранные иллюстрации направления
 * (scene-stills.ts), а не скриншоты работ: без клиента и ссылки на кейс.
 * Настоящие кадры клипов остаются только в заставке работ и в титрах. Если
 * портфолио не пришло, заставка работ не показывается, остальное цело.
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
import Link from 'next/link'
import { ArrowUpRight, AudioLines } from 'lucide-react'

import { MUSIC_PAGE, type MusicStage } from '@/lib/services/pages/content/music'
import type { DirectionPageWork, SceneFrame } from '@/lib/services/pages/resolve'
import { sceneFrame, sceneFramesFor } from '@/lib/services/scene-stills'
import { DIRECTION_READING } from '@/lib/services/pages'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionCredits } from '../direction-credits'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import { DirectionButton, KIT_KICKER, typo } from '../direction-kit'
import { OtherDirections } from '../other-directions'
import { COVER_SIZES, Still } from '../still'
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

/** Абзац: типографика плюс последние два слова вместе, чтобы не оставалась строка из одного слова */
function prose(text: string): string {
  const set = typo(text)
  const cut = set.lastIndexOf(' ')
  if (cut <= 0 || set.length - cut > 14) return set
  return `${set.slice(0, cut)}${NBSP}${set.slice(cut + 1)}`
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

/**
 * Часы доли: setTimeout с поправкой на дрейф; после паузы вкладки не нагоняют.
 * Обработчик получает длину доли в мс: по ней считается тайм-код, и смена темпа
 * на ходу не заставляет его прыгать.
 */
function useBeatClock(bpm: number, running: boolean, onBeat: (period: number) => void) {
  useEffect(() => {
    if (!running) return
    const period = 60000 / bpm
    let next = performance.now() + period
    let id = 0
    const tick = () => {
      onBeat(period)
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

/** Тайм-код 25 кадров в секунду: на первом отрисованном кадре — 00:00:00:00 */
function formatTimecode(ms: number): string {
  const frames = Math.floor(ms / 40)
  const seconds = Math.floor(frames / 25)
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}:${pad(frames % 25)}`
}

/**
 * Следующий уже загруженный кадр монтажа. Кадры ленивые: шторка на ещё не
 * пришедший кадр открыла бы пустой прямоугольник, поэтому такие пропускаются.
 * -1 — резать некуда, остаёмся на текущем.
 */
function nextLoaded(box: HTMLElement | null, from: number, count: number): number {
  if (!box || count < 2) return -1
  for (let step = 1; step < count; step += 1) {
    const index = (from + step) % count
    const image = box.children[index]?.querySelector('img')
    if (image && image.complete && image.naturalWidth > 0) return index
  }
  return -1
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const vars = (values: Record<string, string | number>) => values as CSSProperties

/**
 * Кадры сцены по местам (порядок задан в scene-stills.ts, от портфолио не зависит):
 * 0–5 — монтаж первого экрана (0 — LCP), 6–10 — мониторы этапов (интро, куплет,
 * припев, бридж, аутро), 11 — выход. Героиня в куртке у купе стоит один раз —
 * на выходе, где её лицо справа читается через градиент; первый кадр монтажа с
 * лицом выше заголовка, чтобы и LCP, и статичный кадр при reduced-motion не были
 * серым туманом дороги. На телефоне выход получает вертикаль другой съёмки: у кадра
 * с героиней лицо уходило под белую кнопку и за правый край, у рыжей в низком ключе оно
 * стоит над заголовком, а волосы падают вправо за контакты.
 */
const SCENE_FRAMES = sceneFramesFor('music')
const HERO_FRAMES = SCENE_FRAMES.slice(0, 6)
const CLOSING_FRAME = SCENE_FRAMES[SCENE_FRAMES.length - 1] ?? null
const CLOSING_PHONE = sceneFrame('redhead-lowkey')

/**
 * Узкий бридж режет кадр до полосы в треть экрана по высоте: по центру остались бы
 * колонны над лестницей. Ставим полосу на освещённые ступени с фигурой.
 */
const BRIDGE_POSITION = '43% 47%'

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
    <div
      role="group"
      aria-labelledby={labelId}
      className="dir-music-tempo"
      data-variant={variant}
      // Плавающая кнопка сметы закрывала бы переключатель на десктопе
      data-sticky-hide={variant === 'inline' ? 'desktop' : undefined}
    >
      <p id={labelId} className="dir-music-tempo-label dir-kit-meta font-mono uppercase">
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
              className="dir-music-ruler-bar dir-kit-meta font-mono uppercase tabular-nums"
              style={vars({ '--at': (bar - 1) / 4 })}
            >
              {pad(bar)}
            </span>
          ))
        : null}
      {label ? (
        <span className="dir-music-ruler-label dir-kit-meta font-mono uppercase">{label}</span>
      ) : null}
      <span className="dir-music-ruler-bpm dir-kit-meta font-mono uppercase tabular-nums">
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

interface MontageProps {
  frames: SceneFrame[]
  cut: number
  prev: number
  fresh: boolean
  /** Первый кадр грузится сразу: на первом экране он — LCP. У заставки работ все кадры ленивые */
  priority?: boolean
}

/** Кадры монтажа. Перерисовывается только на склейке, а не на каждой доле */
const Montage = memo(function Montage({
  frames,
  cut,
  prev,
  fresh,
  priority = false,
}: MontageProps) {
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
              priority={priority && index === 0}
              sizes={COVER_SIZES}
              quality={priority && index === 0 ? 75 : 65}
              objectPosition={frame.position}
              className="h-full w-full"
            />
            {state === 'on' && fresh ? <span className="dir-music-edge" /> : null}
          </div>
        )
      })}
    </>
  )
})

/** Транспорт первого экрана: тайм-код с 00:00:00:00, темп и четыре доли такта */
const Transport = memo(function Transport({
  bpm,
  beat,
  ms,
}: {
  bpm: number
  beat: number
  ms: number
}) {
  const inBar = beat % 4
  return (
    <p
      aria-hidden="true"
      className="dir-music-transport dir-kit-meta font-mono uppercase tabular-nums"
    >
      <span>TC {formatTimecode(ms)}</span>
      <span>{bpm} уд/мин</span>
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

/** Метка раздела над заголовком: одна моно-строка с красной риской, как на соседних страницах */
const HERO_KICKER = ['07 / Music', 'Санкт-Петербург', 'Москва', 'по России']

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
  const bumpRef = useRef<HTMLSpanElement>(null)
  const inView = useInView(rootRef)
  // Доля и время счёта лежат в одном состоянии: одна перерисовка на долю
  const [clock, setClock] = useState({ beat: 0, ms: 0 })
  const [shift, setShift] = useState(0)
  const [scene, setScene] = useState({ index: 0, prev: 0, changes: 0 })
  const clockRef = useRef(clock)
  const sceneRef = useRef(scene)
  const armedRef = useRef(false)

  const count = frames.length
  const beat = clock.beat

  /**
   * Склейка только на кадр, который уже загрузился: остальные кадры ленивые,
   * и на медленной сети шторка открыла бы пустой прямоугольник. Нет готового —
   * остаёмся на текущем.
   */
  const cutNext = useCallback(() => {
    const from = sceneRef.current.index
    const index = nextLoaded(framesRef.current, from, count)
    if (index < 0) return
    const next = { index, prev: from, changes: sceneRef.current.changes + 1 }
    sceneRef.current = next
    setScene(next)
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
  const onBeat = useCallback(
    (period: number) => {
      const next = { beat: clockRef.current.beat + 1, ms: clockRef.current.ms + period }
      clockRef.current = next
      setClock(next)
      if (next.beat % 2 === 0 && armedRef.current) cutNext()
    },
    [cutNext]
  )
  useBeatClock(bpm, inView && !reduced, onBeat)

  // Удар на первую долю такта: слово чуть подпрыгивает и садится. Анимация
  // запускается на том же узле, а не пересоздаёт его: новый текстовый узел на
  // каждом такте считался бы новым кандидатом LCP
  useEffect(() => {
    if (reduced || beat === 0 || beat % 4 !== 0) return
    bumpRef.current?.animate(
      [{ transform: 'translateY(-0.022em) scale(1.014)' }, { transform: 'none' }],
      { duration: (60000 / bpm) * 1.6, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    )
  }, [beat, bpm, reduced])

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
            <Montage frames={frames} cut={scene.index} prev={scene.prev} fresh={fresh} priority />
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
          <p className="dir-music-geo dir-kit-meta font-mono uppercase">
            <span aria-hidden="true" className="dir-music-geo-dash" />
            <span>
              {HERO_KICKER.map((part, index) => (
                <span key={part}>
                  {index > 0 ? ' ' : null}
                  <span className="whitespace-nowrap">
                    {part}
                    {index < HERO_KICKER.length - 1 ? ' ·' : null}
                  </span>
                </span>
              ))}
            </span>
          </p>
          <Transport bpm={bpm} beat={beat} ms={clock.ms} />
        </div>

        <div className="dir-music-lock">
          <h1 className="dir-music-h1">
            <span className="dir-music-h1-a dir-music-in" style={vars({ '--in': 1 })}>
              Музыкальный
            </span>{' '}
            <span className="dir-music-h1-b dir-music-in" style={vars({ '--in': 2 })}>
              <span ref={bumpRef} className="dir-music-bump">
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
            <DirectionButton
              label={MUSIC_PAGE.ctaLabel}
              onClick={() => page.openBrief('hero')}
              className="w-full lg:w-auto lg:min-w-[17.5rem]"
            />
            {count > 1 ? (
              <p aria-hidden="true" className="dir-music-hint dir-kit-meta font-mono uppercase">
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
  const words = useMemo(() => typo(MUSIC_PAGE.lyric).split(' '), [])

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
        <p className="dir-music-lyric-note">{prose(MUSIC_PAGE.lyricNote)}</p>
        <p className="dir-music-lyric-source dir-kit-meta font-mono uppercase">
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
  const miniRef = useRef<HTMLDivElement>(null)
  const gateRef = useRef<HTMLDivElement>(null)
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

  // Низкий экран: полоса-скраббер не липнет, и этап ведёт мини-индикатор в шапке.
  // Он виден, пока секция на экране, а сама полоса уже уехала под шапку
  useEffect(() => {
    const section = sectionRef.current
    const deck = deckRef.current
    const mini = miniRef.current
    if (!section || !deck || !mini || typeof IntersectionObserver === 'undefined') return
    let sectionIn = false
    let deckIn = true
    const apply = () => {
      mini.dataset.on = String(sectionIn && !deckIn)
    }
    const bySection = new IntersectionObserver(([entry]) => {
      sectionIn = Boolean(entry?.isIntersecting)
      apply()
    })
    const byDeck = new IntersectionObserver(
      ([entry]) => {
        deckIn = Boolean(entry?.isIntersecting)
        apply()
      },
      { rootMargin: '-72px 0px 0px 0px' }
    )
    bySection.observe(section)
    byDeck.observe(deck)
    return () => {
      bySection.disconnect()
      byDeck.disconnect()
    }
  }, [])

  // Лист бриджа открывается шторкой (clip-path), когда подходит к экрану. Без JS,
  // при reduced-motion и когда лист уже на экране при загрузке он остаётся открытым
  useEffect(() => {
    const gate = gateRef.current
    if (!gate || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia(REDUCED_QUERY).matches) return
    if (gate.getBoundingClientRect().top < window.innerHeight * 1.15) return
    gate.dataset.gate = 'closed'
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return
        gate.dataset.gate = 'open'
        observer.disconnect()
      },
      { rootMargin: '0px 0px 15% 0px' }
    )
    observer.observe(gate)
    return () => observer.disconnect()
  }, [])

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
            {prose('Каждому этапу — своя часть композиции. Листайте или тяните метку по волне.')}
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
        <div className="dir-music-deck-strip dir-music-pad dir-kit-meta font-mono uppercase">
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
                className="dir-music-head-flag dir-kit-meta font-mono tabular-nums"
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
                      <span className="dir-music-part-label dir-kit-meta font-mono uppercase">
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
          const isBridge = stage.part === 'bridge'

          const monitor = (
            <div aria-hidden="true" className="dir-music-monitor">
              <div className="dir-music-monitor-img">
                {frame ? (
                  <Still
                    src={frame.src}
                    alt=""
                    sizes={
                      isBridge ? '100vw' : '(min-width: 1024px) 50vw, (min-width: 768px) 46vw, 92vw'
                    }
                    quality={isBridge ? 65 : 50}
                    objectPosition={isBridge ? BRIDGE_POSITION : frame.position}
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
              <span className="dir-music-monitor-cap dir-kit-meta font-mono uppercase tabular-nums">
                {stage.partLabel} · {pad(part.barFrom)}–{pad(part.barTo)}
              </span>
            </div>
          )

          const body = (
            <div className="dir-music-row-body">
              <p className="dir-music-row-kicker dir-kit-meta font-mono uppercase tabular-nums">
                <span>{stage.number}</span>
                <span aria-hidden="true" className="dir-music-row-dash" />
                <span>{stage.partLabel}</span>
                <span className="dir-music-row-bars">
                  · такты {pad(part.barFrom)}–{pad(part.barTo)}
                </span>
              </p>
              <span aria-hidden="true" className="dir-music-row-word">
                {stage.partLabel}
              </span>
              <h3 className="dir-music-row-title">{typo(stage.title)}</h3>
              <p className="dir-music-row-text">{prose(stage.text)}</p>
              <ul className="dir-music-tags" role="list">
                {stage.tags.map((tag, position) => (
                  <li
                    key={tag}
                    className="dir-kit-meta font-mono uppercase"
                    style={vars({ '--n': position })}
                  >
                    {typo(tag)}
                  </li>
                ))}
              </ul>
            </div>
          )

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
              {isBridge ? (
                <>
                  {monitor}
                  {/* Лист --dir-paper на общем классе: шапка сама переходит на тёмный знак */}
                  <div ref={gateRef} className="dir-music-bridge dir-paper-section">
                    <span aria-hidden="true" className="dir-music-bridge-sheet" />
                    <span aria-hidden="true" className="dir-music-bridge-edge" />
                    <div className="dir-music-bridge-grid dir-music-pad">
                      {body}
                      <div aria-hidden="true" className="dir-music-bridge-count">
                        <i className="dir-kit-meta font-mono uppercase">Вход · такт</i>
                        <span className="tabular-nums">{pad(part.barFrom)}</span>
                        <i className="dir-kit-meta font-mono uppercase">Выход · такт</i>
                        <span className="tabular-nums">{pad(part.barTo)}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {body}
                  {monitor}
                </>
              )}
            </li>
          )
        })}
      </ol>

      <div ref={miniRef} aria-hidden="true" className="dir-music-mini" data-on="false">
        <span className="dir-music-mini-bars">
          {PARTS.map((part, index) => (
            <i
              key={part.stage.part}
              data-state={index < active ? 'done' : index === active ? 'now' : 'next'}
              style={{ flexGrow: part.stage.bars }}
            />
          ))}
        </span>
        <span className="dir-music-mini-label dir-kit-meta font-mono uppercase">
          {PARTS[active]?.stage.partLabel}
        </span>
      </div>
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
    <section
      aria-label="Обсудить клип"
      className="dir-music-play dir-music-pad"
      data-live-zone
      data-sticky-hide=""
    >
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
        <DirectionButton
          label={MUSIC_PAGE.play.ctaLabel}
          onClick={() => page.openBrief('process')}
          className="dir-music-play-btn w-full md:w-auto md:min-w-[16rem]"
        />
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
          <p className="dir-music-seq-note" data-reveal="">
            {prose(MUSIC_PAGE.patternNote)}
          </p>
        </div>
        <TempoSwitch variant="inline" />
      </div>

      <ul ref={listRef} role="list" className="dir-music-seq-list">
        {MUSIC_PAGE.audiences.map((item, index) => (
          <li key={item.title} data-seq="" className="dir-music-seq-row" data-reveal="">
            <span className="dir-music-seq-idx dir-kit-meta font-mono uppercase tabular-nums">
              {pad(index + 1)}
            </span>
            <div className="dir-music-seq-copy">
              <h3 className="dir-music-seq-title">{typo(item.title)}</h3>
              <p className="dir-music-seq-text">{prose(item.text)}</p>
            </div>
            <div aria-hidden="true" className="dir-music-seq-pattern">
              <div className="dir-music-seq-grid">
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
              <p className="dir-music-seq-cap dir-kit-meta font-mono uppercase">
                <span>Паттерн {pad(index + 1)}</span>
                <span>{item.rhythm}</span>
              </p>
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
      data-sticky-hide=""
    >
      <h2 id="music-cue-title" className="dir-music-cue-title" data-reveal="">
        <span className="dir-music-cue-lead">{typo(MUSIC_PAGE.cue.lead)}</span>{' '}
        <span className="dir-music-cue-accent">{typo(MUSIC_PAGE.cue.accent)}</span>
      </h2>

      <div className="dir-music-cue-side" data-reveal="">
        <ol className="dir-music-cue-list" role="list">
          {MUSIC_PAGE.cue.items.map((entry, index) => (
            <li key={entry} className="dir-music-cue-item">
              <span className="dir-kit-meta font-mono uppercase tabular-nums">
                {pad(index + 1)}
              </span>
              <span>{typo(entry)}</span>
            </li>
          ))}
        </ol>
        <DirectionButton
          label={MUSIC_PAGE.cue.ctaLabel}
          onClick={() => page.openBrief('proof')}
          className="dir-music-cue-btn w-full"
        />
        <p className="dir-music-cue-note">{prose(MUSIC_PAGE.cue.note)}</p>
      </div>
    </section>
  )
}

/* ─────────────────────────── 7. Заставка работ ─────────────────────────── */

interface ReelShot extends SceneFrame {
  year: string | null
}

/** Один кадр на работу, не больше пяти. Второй кадр галереи, чтобы не повторять первый экран */
function buildReel(works: DirectionPageWork[]): ReelShot[] {
  const shots: ReelShot[] = []
  for (const work of works) {
    const src = work.stills[1] ?? work.posterUrl ?? work.stills[0]
    if (!src) continue
    shots.push({
      key: `${work.slug}-reel`,
      src,
      slug: work.slug,
      client: work.client,
      title: work.title,
      year: work.year,
    })
    if (shots.length === 5) break
  }
  return shots
}

/**
 * Заставка перед списком работ: экран целиком, кадры клипов режутся на такт
 * (каждая четвёртая доля), имя работы крупно. Кульминация нижней половины:
 * до неё страница объясняла, здесь — показывает. Список с названиями и ссылками
 * идёт сразу за ней, поэтому заставка — декор, а ссылка на кейс в ней —
 * только для мыши и касания.
 */
function ClipsReel({ works }: { works: DirectionPageWork[] }) {
  const page = useDirectionPage()
  const { bpm } = useTempo()
  const reduced = useReduced()
  const shots = useMemo(() => buildReel(works), [works])
  const rootRef = useRef<HTMLElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const framesRef = useRef<HTMLDivElement>(null)
  const [live, setLive] = useState(false)
  const [clock, setClock] = useState({ beat: 0, ms: 0 })
  const [scene, setScene] = useState({ index: 0, prev: 0, changes: 0 })
  const clockRef = useRef(clock)
  const sceneRef = useRef(scene)
  const count = shots.length

  const cutNext = useCallback(() => {
    const from = sceneRef.current.index
    const index = nextLoaded(framesRef.current, from, count)
    if (index < 0) return
    const next = { index, prev: from, changes: sceneRef.current.changes + 1 }
    sceneRef.current = next
    setScene(next)
  }, [count])

  // Тайм-код каждый раз начинается с 00:00:00:00, когда заставка выходит на экран
  useEffect(() => {
    const node = rootRef.current
    if (!node || count === 0 || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      const on = Boolean(entry?.isIntersecting)
      if (on) {
        clockRef.current = { beat: 0, ms: 0 }
        setClock(clockRef.current)
      }
      setLive(on)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [count])

  const onBeat = useCallback(
    (period: number) => {
      const next = { beat: clockRef.current.beat + 1, ms: clockRef.current.ms + period }
      clockRef.current = next
      setClock(next)
      if (next.beat % 4 === 0) cutNext()
    },
    [cutNext]
  )
  useBeatClock(bpm, live && !reduced && count > 1, onBeat)

  // Кадр идёт вверх и медленно наезжает, пока заставка проходит экран
  const syncScroll = useCallback(() => {
    const node = rootRef.current
    const layer = parallaxRef.current
    if (!node || !layer || reduced) return
    const box = node.getBoundingClientRect()
    const progress = clamp01((window.innerHeight - box.top) / (window.innerHeight + box.height))
    layer.style.transform = `translate3d(0, ${((0.5 - progress) * 80).toFixed(1)}px, 0) scale(${(1.06 + progress * 0.07).toFixed(3)})`
  }, [reduced])
  useScrollSync(rootRef, syncScroll, '0px')

  const onCut = (event: MouseEvent<HTMLElement>) => {
    if (reduced || count < 2) return
    if ((event.target as HTMLElement).closest('a, button')) return
    cutNext()
  }

  if (count === 0) return null
  const shot = shots[scene.index] ?? shots[0]
  if (!shot) return null

  return (
    // Список тех же работ с живыми ссылками идёт следом, поэтому заставка — декор
    <section
      ref={rootRef}
      aria-hidden="true"
      className="dir-music-reel dir-music-pad"
      data-live-zone
      data-sticky-hide=""
      onClick={onCut}
    >
      <div ref={parallaxRef} className="dir-music-reel-stage">
        <div ref={framesRef} className="dir-music-frames">
          <Montage frames={shots} cut={scene.index} prev={scene.prev} fresh={scene.changes > 0} />
        </div>
      </div>
      <span className="dir-music-reel-scrim" />

      <p className="dir-music-reel-top dir-kit-meta font-mono uppercase">
        <span className="dir-music-reel-label">
          <span className="dir-music-geo-dash" />
          Кадры из работ
        </span>
        <span className="tabular-nums">
          TC {formatTimecode(clock.ms)} · {bpm} уд/мин
        </span>
      </p>

      <div className="dir-music-reel-bottom">
        <Link
          key={`${shot.key}-${scene.changes}`}
          href={`/projects/${shot.slug}`}
          prefetch={false}
          tabIndex={-1}
          onClick={() => page.openCase(shot.slug)}
          className="dir-music-reel-copy"
        >
          <span className="dir-music-reel-name">{shot.client}</span>
          <span className="dir-music-reel-meta dir-kit-meta font-mono uppercase">
            <span>{typo(shot.title)}</span>
            {shot.year ? <span className="tabular-nums">{shot.year}</span> : null}
            <span className="dir-music-reel-open">
              Кейс
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </span>
          </span>
        </Link>

        <div className="dir-music-reel-track">
          {shots.map((item, index) => (
            <span
              key={item.key}
              className="dir-music-reel-seg dir-kit-meta font-mono tabular-nums"
              data-state={index === scene.index ? 'now' : 'idle'}
            >
              {pad(index + 1)}
              <i key={index === scene.index ? `on-${scene.changes}` : 'off'} />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Знаки сцены в общих блоках ─────────────────────────── */

const SIGN_PATTERN = ['x...x...x...x..x', '....x.......x...', 'x.x.x.x.x.x.x.xx'] as const

/** Знак финала: три дорожки секвенсора крупно, красная метка шагает по долям */
function EndSign() {
  const { bpm } = useTempo()
  return (
    <div className="dir-music-sign" data-live-zone>
      <p className="dir-music-sign-cap dir-kit-meta font-mono uppercase tabular-nums">
        <span>4/4</span>
        <span>{bpm} уд/мин</span>
      </p>
      <div className="dir-music-sign-grid">
        {SIGN_PATTERN.map((lane, laneIndex) => (
          <div key={laneIndex} className="dir-music-sign-lane">
            {Array.from(lane).map((cell, step) => (
              <span
                key={step}
                className="dir-music-sign-cell"
                data-on={cell === 'x'}
                data-beat={step % 4 === 0}
              />
            ))}
          </div>
        ))}
        <span className="dir-music-sign-head" />
      </div>
    </div>
  )
}

const FAQ_EQ_STYLES = EQ_STYLES.filter((_, index) => index % 2 === 0)

/** Вклейка левой колонки вопросов: эквалайзер первого экрана, уменьшенный */
function FaqSign() {
  const { bpm } = useTempo()
  return (
    <div aria-hidden="true" className="dir-music-faq-sign" data-live-zone>
      <div key={bpm} className="dir-music-faq-eq">
        {FAQ_EQ_STYLES.map((style, index) => (
          <span key={index} className="dir-music-eq-bar" style={style} />
        ))}
      </div>
      <p className="dir-music-faq-cap dir-kit-meta font-mono uppercase tabular-nums">
        <span>В темпе страницы</span>
        <span className="whitespace-nowrap">{bpm} уд/мин</span>
      </p>
    </div>
  )
}

/* ─────────────────────────── Страница ─────────────────────────── */

// Разметка FAQPage строится из MUSIC_PAGE.faq как есть; неразрывные пробелы
// нужны только набору на странице
const FAQ_ITEMS = MUSIC_PAGE.faq.map(item => ({
  question: typo(item.question),
  answer: prose(item.answer),
}))

export function MusicPage({ works }: MusicPageProps) {
  const [bpm, setBpm] = useState<number>(MUSIC_PAGE.tempos[2] ?? 128)
  const tempo = useMemo<TempoApi>(() => ({ bpm, setBpm }), [bpm])
  const rootRef = useRef<HTMLDivElement>(null)
  useLiveZones(rootRef)

  return (
    <DirectionShell id="music" stickyLabel={MUSIC_PAGE.stickyLabel}>
      <TempoContext.Provider value={tempo}>
        <div
          ref={rootRef}
          className="dir-music"
          style={vars({ '--dm-beat': `${Math.round(60000 / bpm)}ms` })}
        >
          <Hero frames={HERO_FRAMES} />
          <Manifesto />
          <Tracks frames={SCENE_FRAMES} />
          <PlayBar />
          <Sequencer />
          <ClipsReel works={works} />
          <BeatRuler variant="slim" label="Клипы" />
          <DirectionCredits
            index="04"
            title="Клипы"
            works={works}
            note="Музыкальные работы студии"
          />
          <CueCta />
          <BeatRuler variant="slim" label="Вопросы" />
          <DirectionFaq
            index="05"
            title="Вопросы о съёмке клипа"
            items={FAQ_ITEMS}
            aside={<FaqSign />}
          />
          <OtherDirections current="music" reading={DIRECTION_READING['music']} />
          <DirectionEnd
            lines={MUSIC_PAGE.end.lines}
            ctaLabel={MUSIC_PAGE.end.ctaLabel}
            note={prose(MUSIC_PAGE.end.note)}
            aside={<EndSign />}
            frame={
              CLOSING_FRAME
                ? {
                    src: CLOSING_FRAME.src,
                    position: CLOSING_FRAME.position,
                    portrait: { src: CLOSING_PHONE.src, objectPosition: CLOSING_PHONE.position },
                  }
                : null
            }
          />
        </div>
      </TempoContext.Provider>
    </DirectionShell>
  )
}
