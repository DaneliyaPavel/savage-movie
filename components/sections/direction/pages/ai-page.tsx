/**
 * /ai-video — «ШОВ И СЛОИ».
 *
 * AI в Savage Movie — инструмент производства, а не эстетика, поэтому язык
 * страницы — не неон и не глитч, а монтажный шов. Чёрный, белый и красная
 * нитка шва, технарская графика (сетка, метки трекинга, рамки, таймкод).
 *
 * Страница идёт как сборка кадра:
 *   шов (первый экран) → слои (закреплённая стопка карточек) → где что
 *   (разрез по шву) → работы → разбор задачи (плоская «плёнка») → процесс
 *   (монтажные дорожки) → вопросы → финальный CTA.
 *
 * Фирменный жест первого экрана — шов сам ходит по кадру: слева плоская серая
 * плёнка с метками трекинга, справа финал. Заголовок «проявляется» вместе с
 * кадром: левее шва он серый, правее — белый. Без ввода шов плавно качается,
 * курсор ведёт его за собой, на телефоне его тянут пальцем, с клавиатуры —
 * стрелками. Шов — демонстрация цвета и постпродакшна, а не заявление «слева
 * камера, справа нейросеть»; подпись об этом сказана прямо.
 *
 * Движение: только transform, clip-path и opacity декора. Текст — в разметке
 * и виден с первого кадра (вход — keyframes со сдвигом, без opacity:0).
 * Первый ход шва и все входы — CSS, поэтому работают до гидрации. Бесконечное
 * движение (качание шва, кольцо у ручки, мини-шов) стоит, пока блок вне кадра,
 * и выключено при prefers-reduced-motion.
 *
 * Каркас (DirectionShell) даёт странице три вещи, своих обходов нет: светлая
 * «плёнка» — .dir-paper-section, и шапка сама темнеет над ней; плавающая кнопка
 * прячется по data-sticky-hide; кнопки — DirectionButton.
 *
 * Кадры сцены — отобранные иллюстрации направления (scene-stills.ts), а не
 * скриншоты работ: без клиента, подписи и ссылки на кейс. Настоящие кадры
 * проектов остаются только в «Работах». Если работ из портфолио нет, страница
 * остаётся целой: секция работ уходит, CTA встаёт после «Где что».
 */
'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from 'react'
import Link from 'next/link'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

import { DIRECTION_READING } from '@/lib/services/pages'
import { AI_PAGE, type AiCta } from '@/lib/services/pages/content/ai'
import type { DirectionPageWork, SceneFrame } from '@/lib/services/pages/resolve'
import { sceneFrame } from '@/lib/services/scene-stills'
import { cn } from '@/lib/utils'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import { DirectionButton, KIT_KICKER, typo } from '../direction-kit'
import { OtherDirections } from '../other-directions'
import { COVER_SIZES, Still } from '../still'
import './ai-page.css'

export interface AiPageProps {
  works: DirectionPageWork[]
}

/* ───────────────────────────── Мелочи набора ───────────────────────────── */

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'
const SEAM_REST = 52

const pad2 = (value: number) => String(value).padStart(2, '0')
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const smooth = (t: number) => t * t * (3 - 2 * t)
const delay = (ms: number, extra?: CSSProperties) =>
  ({ '--d': `${ms}ms`, ...extra }) as CSSProperties
const vars = (values: Record<string, string | number>) => values as CSSProperties

const NBSP = '\u00a0'

const CTA_LABEL = AI_PAGE.ctaLabel
/** Вопросы идут на экран с набором, а в разметку поиска уходят из контента как есть */
const FAQ_ITEMS = AI_PAGE.faq.map(item => ({
  question: tidy(item.question),
  answer: tidy(item.answer),
}))

/**
 * Для узкого столбца крупного набора: короткое слово держится за следующим, но цепочка
 * не склеивается. typo() связала бы «и лицо в крупном плане» в один кусок шире колонки
 * на телефоне, и перенос по символам рвал бы слово («ПЛАН / Е»).
 */
const tieShort = (text: string) =>
  text.replace(/(^|\s)([A-Za-zА-Яа-яЁё]{1,3}) (?=\S)/g, '$1$2\u00A0')

/**
 * Набор абзаца: предлоги и цепочки коротких слов связывает общий typo(). Сверх него —
 * вдова: два последних слова не разъезжаются («…где пройдёт / шов.»). Склеивается только
 * последняя пара слов, а не целые связки: иначе заголовок в три слова держался бы колонной.
 */
function tidy(text: string): string {
  const tied = typo(text)
  const cut = Math.max(tied.lastIndexOf(' '), tied.lastIndexOf(NBSP))
  // Пробел перед последним словом уже неразрывный — склеивать нечего
  if (cut < 0 || tied[cut] === NBSP) return tied
  const head = tied.slice(0, cut)
  const tail = tied.slice(cut + 1)
  const previous = head.split(/[ \u00a0]/).pop() ?? ''
  const words = tied.split(/[ \u00a0]/).length
  return words > 3 && previous.length + tail.length <= 16 ? `${head}${NBSP}${tail}` : tied
}

/** Таймкод шва: положение 0…100 → 00:00:00:00…00:00:59:23, 24 кадра в секунде */
function timecode(position: number): string {
  const frames = Math.round(clamp(position, 0, 100) * 14.39)
  return `00:00:${pad2(Math.floor(frames / 24))}:${pad2(frames % 24)}`
}

/**
 * Сниженное движение без расхождения с серверной разметкой: на сервере и в
 * первом проходе гидрации — false, настоящее значение приходит следующим
 * рендером. Разметка от настройки не зависит, меняется только логика скролла.
 */
function useReduced() {
  return useSyncExternalStore(
    notify => {
      const query = window.matchMedia(REDUCED_QUERY)
      query.addEventListener('change', notify)
      return () => query.removeEventListener('change', notify)
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  )
}

/** Бесконечное движение декора стоит, пока блок вне кадра: data-live переключает CSS */
function useLive<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      node.dataset.live = String(Boolean(entry?.isIntersecting))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return ref
}

/**
 * Метка раздела: красная риска и «01 / Слои», как у всего семейства (KIT_KICKER).
 * На светлой плёнке цвет — вторичный токен бумаги: белое на ней не читается.
 */
function Kicker({
  index,
  label,
  tone = 'dark',
  className,
}: {
  index?: string
  label: string
  tone?: 'dark' | 'paper'
  className?: string
}) {
  return (
    <p
      className={cn(
        KIT_KICKER,
        tone === 'paper' && 'text-[color:var(--dir-paper-mute)]',
        className
      )}
    >
      <span aria-hidden="true" className="h-px w-8 shrink-0 bg-accent" />
      <span>{index ? `${index} / ${label}` : label}</span>
    </p>
  )
}

/** Склейка между секциями: прошитая линия и таймкод монтажного стола */
function Cut({ from, to, tone = 'dark' }: { from: string; to: string; tone?: 'dark' | 'deep' }) {
  return (
    <div aria-hidden="true" data-reveal="" data-tone={tone} className="dir-ai-cut dir-ai-pad">
      <span className="dir-ai-cut-l type-meta font-mono uppercase tabular-nums">{from}</span>
      <span className="dir-ai-cut-line">
        <span className="dir-ai-cut-stitch" />
        <span className="dir-ai-cut-mark" />
      </span>
      <span className="dir-ai-cut-r type-meta font-mono uppercase tabular-nums">{to}</span>
    </div>
  )
}

/* ───────────────────────────── Кадры и сцена ───────────────────────────── */

/**
 * Нарисованный кадр — запасной путь, если кадра сцены нет (а также мини-шов и
 * секция работ без галереи). Плёнка — плоская серая, финал — чёрный с
 * единственным красным кругом: красный здесь сигнал, а не заливка. Для
 * вертикального экрана в SVG лежит вторая композиция: при обрезке «cover»
 * центральной полосы иначе хватило бы только на пол.
 */
function Scene({ tone, adaptive = false }: { tone: 'final' | 'plate'; adaptive?: boolean }) {
  const plate = tone === 'plate'
  const ink = plate ? 'rgb(255 255 255 / 0.15)' : 'rgb(255 255 255 / 0.2)'
  const horizon = plate ? 'rgb(255 255 255 / 0.34)' : 'rgb(255 255 255 / 0.5)'
  const rays = Array.from({ length: 17 }, (_, i) => (i - 8) * 260)

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="dir-ai-scene"
      data-adaptive={adaptive ? 'true' : undefined}
    >
      <rect width="1600" height="900" fill={plate ? '#252525' : '#080808'} />
      <rect y="560" width="1600" height="340" fill={plate ? '#1b1b1b' : '#111111'} />
      {rays.map(x => (
        <line
          key={x}
          x1="800"
          y1="560"
          x2={800 + x * 3}
          y2="900"
          stroke={ink}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {[590, 625, 672, 740, 835].map(y => (
        <line
          key={y}
          x1="0"
          x2="1600"
          y1={y}
          y2={y}
          stroke={ink}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <line x1="0" x2="1600" y1="560" y2="560" stroke={horizon} vectorEffect="non-scaling-stroke" />

      <g className="dir-ai-scene-wide">
        <circle cx="1130" cy="360" r="170" style={{ fill: plate ? '#6f6f6f' : 'var(--accent)' }} />
        <circle
          cx="1130"
          cy="360"
          r="232"
          fill="none"
          stroke={horizon}
          vectorEffect="non-scaling-stroke"
        />
        <rect x="380" y="236" width="150" height="324" fill={plate ? '#3b3b3b' : '#ececec'} />
        <polygon points="380,560 530,560 640,740 470,740" fill={plate ? '#202020' : '#1a1a1a'} />
      </g>
      <g className="dir-ai-scene-tall">
        <circle cx="906" cy="380" r="104" style={{ fill: plate ? '#6f6f6f' : 'var(--accent)' }} />
        <circle
          cx="906"
          cy="380"
          r="146"
          fill="none"
          stroke={horizon}
          vectorEffect="non-scaling-stroke"
        />
        <rect x="660" y="250" width="92" height="310" fill={plate ? '#3b3b3b' : '#ececec'} />
        <polygon points="660,560 752,560 820,700 720,700" fill={plate ? '#202020' : '#1a1a1a'} />
      </g>
    </svg>
  )
}

interface PhotoProps {
  frame: SceneFrame | null
  tone: 'final' | 'plate'
  sizes: string
  priority?: boolean
  quality?: 50 | 65 | 75
  position?: string
  adaptive?: boolean
  /** Вертикальный кадр для телефона: горизонталь в высоком экране режется до трети ширины */
  portrait?: SceneFrame | null
}

/**
 * Кадр сцены или нарисованная сцена; плёнка — тот же кадр, лишённый цвета.
 * Кроп берётся из самого кадра (у каждого своя композиция), position его перекрывает.
 */
function Photo({
  frame,
  tone,
  sizes,
  priority,
  quality,
  position,
  adaptive,
  portrait,
}: PhotoProps) {
  if (!frame) return <Scene tone={tone} adaptive={adaptive} />
  return (
    <Still
      src={frame.src}
      alt=""
      sizes={sizes}
      priority={priority}
      quality={quality}
      objectPosition={position ?? frame.position}
      portrait={portrait ? { src: portrait.src, objectPosition: portrait.position } : undefined}
      className="absolute inset-0 h-full w-full"
      imgClassName={tone === 'plate' ? 'dir-ai-plate-img' : undefined}
    />
  )
}

/* ───────────────────────────── Технарская графика ───────────────────────────── */

/**
 * Метки трекинга: только кресты, без подписей. Лежат в верхней трети кадра, выше заголовка:
 * заголовок растёт от ширины экрана, а кадр — от высоты, и на низком окне нижние кресты
 * оказались бы на буквах.
 */
const CROSSES = [
  { x: 24, y: 9, hide: true },
  { x: 44, y: 8, hide: true },
  { x: 73, y: 17, hide: true },
  { x: 86, y: 13, hide: true },
]

function Cross({ x, y, hide }: { x: number | string; y: number | string; hide?: boolean }) {
  const at = (value: number | string) => (typeof value === 'number' ? `${value}%` : value)
  return (
    <span
      className="dir-ai-cross"
      data-hide={hide ? 'true' : undefined}
      style={vars({ '--x': at(x), '--y': at(y) })}
    />
  )
}

/** Метки трекинга и сетка: живут только на плёнке, то есть левее шва */
function PlateMarks() {
  return (
    <div aria-hidden="true" className="dir-ai-marks">
      {/* Сетка и рамка растворяются книзу: под заголовком и кнопкой им делать нечего */}
      <span className="dir-ai-lines">
        <span className="dir-ai-grid" />
        <span className="dir-ai-third" style={{ left: '33.333%' }} />
        <span className="dir-ai-third" style={{ left: '66.666%' }} />
        <span className="dir-ai-third dir-ai-third-h" style={{ top: '33.333%' }} />
        <span className="dir-ai-third dir-ai-third-h" style={{ top: '66.666%' }} />
        <span className="dir-ai-safe" />
      </span>
      {CROSSES.map(cross => (
        <Cross key={`${cross.x}-${cross.y}`} x={cross.x} y={cross.y} hide={cross.hide} />
      ))}
    </div>
  )
}

/**
 * Рамки «снять» и «генерация» лежат в потоке первого экрана, между строкой меток и
 * заголовком, и занимают ровно то место, что осталось: заголовок растёт от ширины
 * экрана, и на низком окне рамки сжимаются, а не наезжают на буквы. Срез швом тот же,
 * что у плёнки: левее шва рамки есть, правее — нет.
 */
function PlateBoxes() {
  return (
    <div aria-hidden="true" className="dir-ai-boxzone">
      <span className="dir-ai-box dir-ai-box-keep">
        <span className="dir-ai-box-tag type-meta-sm font-mono uppercase">
          Снять<span>продукт · лицо · руки</span>
        </span>
      </span>
      <span className="dir-ai-box dir-ai-box-gen">
        <span className="dir-ai-box-tag type-meta-sm font-mono uppercase">
          Генерация<span>фон · метаморфоза</span>
        </span>
      </span>
      <Cross x={30} y={92} hide />
      <Cross x={64} y={84} />
    </div>
  )
}

/** Пиктограммы «где что»: тонкая линия, красная только деталь, которая решает */
function Glyph({ kind }: { kind: string }) {
  const common = {
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    'aria-hidden': true,
    className: 'dir-ai-glyph',
  } as const
  const red = { stroke: 'var(--accent)' }

  switch (kind) {
    case 'morph':
      return (
        <svg {...common}>
          <rect x="5" y="13" width="54" height="38" />
          <rect x="13" y="25" width="14" height="14" />
          <path d="M31 32h8m-3-3 3 3-3 3" />
          <circle cx="47" cy="32" r="7.5" style={red} />
        </svg>
      )
    case 'overlay':
      return (
        <svg {...common}>
          <rect x="7" y="22" width="36" height="28" />
          <path d="M7 44l10-9 8 6 7-8 11 11" />
          <rect x="21" y="12" width="36" height="28" strokeDasharray="3 3" style={red} />
        </svg>
      )
    case 'previz':
      return (
        <svg {...common}>
          <rect x="4" y="21" width="15" height="21" />
          <rect x="24.5" y="21" width="15" height="21" />
          <rect x="45" y="21" width="15" height="21" style={red} />
          <path d="M19 31.5h5.5m-2-2 2 2-2 2M39.5 31.5H45m-2-2 2 2-2 2" />
          <path d="M7 49h9M27.5 49h9M48 49h9" />
        </svg>
      )
    case 'skin':
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="17" />
          <path d="M32 5v8M32 51v8M5 32h8M51 32h8" />
          <circle cx="26" cy="27" r=".9" fill="currentColor" stroke="none" />
          <circle cx="37" cy="25" r=".9" fill="currentColor" stroke="none" />
          <circle cx="33" cy="35" r=".9" fill="currentColor" stroke="none" />
          <circle cx="25" cy="38" r=".9" fill="currentColor" stroke="none" />
          <circle cx="39" cy="38" r=".9" fill="currentColor" stroke="none" />
          <path d="M26 44q6 4 12 0" style={red} />
        </svg>
      )
    case 'label':
      return (
        <svg {...common}>
          <rect x="15" y="7" width="34" height="50" />
          <path d="M21 18h22M21 24h22M21 30h14" />
          <path d="M21 44h10" style={red} />
          <path d="M6 14V8h6M58 14V8h-6M6 50v6h6M58 50v6h-6" />
        </svg>
      )
    case 'truth':
      return (
        <svg {...common}>
          <path d="M6 18V8h10M58 18V8H48M6 46v10h10M58 46v10H48" />
          <circle cx="32" cy="32" r="14" />
          <circle cx="32" cy="32" r="5" fill="var(--accent)" stroke="none" />
        </svg>
      )
    default:
      return null
  }
}

const FIT_SIZES = '(min-width: 1024px) 36vw, 100vw'
const FIT_GLYPHS = ['morph', 'overlay', 'previz']
const MISFIT_GLYPHS = ['skin', 'label', 'truth']

/* ───────────────────────────── Первый экран: шов ───────────────────────────── */

/**
 * Управление швом без состояния React: значение пишется в CSS-переменную
 * первого экрана из rAF, поэтому кадр не перерисовывает дерево, а двигаются
 * только clip-path, transform и градиент заголовка.
 *
 * Режимы: intro — идёт CSS-вход (до гидрации), ambient — шов качается сам,
 * follow — ведёт курсор, drag — тянут пальцем или мышью, hold — стоит
 * (фокус на ручке, сниженное движение).
 */
function useSeam(heroRef: RefObject<HTMLElement | null>, handleRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const hero = heroRef.current
    const handle = handleRef.current
    if (!hero || !handle) return

    const reduced = window.matchMedia(REDUCED_QUERY).matches
    const tcNodes = hero.querySelectorAll<HTMLElement>('[data-seam-tc]')

    type Mode = 'intro' | 'ambient' | 'follow' | 'drag' | 'hold'
    let mode: Mode = reduced ? 'hold' : 'intro'
    let cur = SEAM_REST
    let target = SEAM_REST
    let raf = 0
    let last = 0
    let inView = true
    let focused = false
    let dragging = false
    let resumeTimer = 0
    let ambientStart = 0
    let ambientPhase = 0
    let ariaAt = 0
    // Эффект в dev запускается дважды, а Promise входа переживает очистку:
    // без флага «хвост» прежнего запуска продолжил бы вести шов вместе с живым
    let disposed = false

    const write = () => {
      hero.style.setProperty('--dir-ai-seam', cur.toFixed(2))
      const tc = timecode(cur)
      tcNodes.forEach(node => {
        if (node.textContent !== tc) node.textContent = tc
      })
    }

    // Значение для скринридера считается от цели, а не от кадра анимации: иначе после
    // стрелки или отпускания пальца он отстаёт от шва, пока тот не доедет
    const announce = (force = false, value = cur) => {
      const now = performance.now()
      if (!force && now - ariaAt < 500) return
      ariaAt = now
      const plate = Math.round(clamp(value, 0, 100))
      handle.setAttribute('aria-valuenow', String(plate))
      handle.setAttribute('aria-valuetext', `Плёнка ${plate} %, финал ${100 - plate} %`)
    }

    const tick = (now: number) => {
      raf = 0
      if (disposed || !inView || document.hidden || mode === 'hold') {
        last = 0
        return
      }
      const dt = last ? Math.min(64, now - last) : 16
      last = now
      if (mode === 'ambient') {
        target = 50 + 17 * Math.sin(ambientPhase + (now - ambientStart) / 1500)
      }
      const tau = mode === 'ambient' ? 380 : mode === 'drag' ? 55 : 170
      cur += (target - cur) * (1 - Math.exp(-dt / tau))
      write()
      announce()
      if (mode === 'ambient' || Math.abs(target - cur) > 0.03) {
        raf = requestAnimationFrame(tick)
      } else {
        cur = target
        write()
        announce(true)
        last = 0
      }
    }

    const kick = () => {
      if (!disposed && !raf && inView && !document.hidden && mode !== 'hold') {
        raf = requestAnimationFrame(tick)
      }
    }

    // Снять CSS-вход и принять его текущее значение: дальше шов ведёт скрипт
    const release = () => {
      if (!hero.classList.contains('dir-ai-live')) {
        const raw = parseFloat(getComputedStyle(hero).getPropertyValue('--dir-ai-seam'))
        cur = target = Number.isFinite(raw) ? raw : SEAM_REST
        hero.classList.add('dir-ai-live')
        write()
      }
    }

    const setMode = (next: Mode) => {
      mode = next
      if (next === 'ambient') {
        ambientStart = performance.now()
        ambientPhase = Math.asin(clamp((cur - 50) / 17, -1, 1))
      }
      kick()
    }

    const resumeAmbient = (ms: number) => {
      window.clearTimeout(resumeTimer)
      if (reduced) return
      resumeTimer = window.setTimeout(() => {
        if (!disposed && !focused && !dragging) setMode('ambient')
      }, ms)
    }

    const toPercent = (clientX: number) => {
      const rect = hero.getBoundingClientRect()
      return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
    }

    const isControl = (node: EventTarget | null) =>
      node instanceof Element && node.closest('a, button, input, textarea, select') !== null

    const moveTo = (value: number, instant: boolean) => {
      target = clamp(value, 0, 100)
      if (instant) {
        cur = target
        write()
        announce()
      } else {
        kick()
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (dragging) {
        moveTo(toPercent(event.clientX), reduced)
        return
      }
      if (event.pointerType !== 'mouse' || reduced || focused) return
      release()
      if (mode !== 'follow') setMode('follow')
      moveTo(toPercent(event.clientX), false)
      resumeAmbient(2600)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || isControl(event.target)) return
      release()
      dragging = true
      window.clearTimeout(resumeTimer)
      try {
        hero.setPointerCapture(event.pointerId)
      } catch {
        // Указатель уже ушёл: перетаскивание просто не начнётся
      }
      mode = reduced ? 'hold' : 'drag'
      moveTo(toPercent(event.clientX), reduced)
      kick()
    }

    const onPointerEnd = (event: PointerEvent) => {
      if (!dragging) return
      dragging = false
      if (hero.hasPointerCapture(event.pointerId)) hero.releasePointerCapture(event.pointerId)
      announce(true, target)
      if (!reduced) {
        setMode('follow')
        resumeAmbient(2600)
      }
    }

    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !dragging) resumeAmbient(1400)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const step = event.shiftKey ? 10 : 2
      // Шаг считается от цели: при быстрых нажатиях шов ещё едет, и отсчёт от кадра терял бы шаги
      const base = target
      let next: number | null = null
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = base - step
      else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = base + step
      else if (event.key === 'PageDown') next = base - 10
      else if (event.key === 'PageUp') next = base + 10
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = 100
      if (next === null) return
      event.preventDefault()
      release()
      window.clearTimeout(resumeTimer)
      if (mode !== 'hold') setMode('follow')
      moveTo(next, reduced)
      announce(true, target)
    }

    // Фокус останавливает качание на месте; стрелки дальше двигают шов плавно
    const onFocus = () => {
      focused = true
      release()
      window.clearTimeout(resumeTimer)
      target = cur
      mode = reduced ? 'hold' : 'follow'
      announce(true)
    }

    const onBlur = () => {
      focused = false
      if (!reduced) {
        mode = 'follow'
        resumeAmbient(1600)
      }
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              if (!entry) return
              inView = entry.isIntersecting
              hero.dataset.live = String(inView)
              if (inView) {
                last = 0
                kick()
              }
            },
            { threshold: 0.05 }
          )
    observer?.observe(hero)

    const onVisibility = () => {
      last = 0
      kick()
    }

    hero.addEventListener('pointermove', onPointerMove)
    hero.addEventListener('pointerdown', onPointerDown)
    hero.addEventListener('pointerup', onPointerEnd)
    hero.addEventListener('pointercancel', onPointerEnd)
    hero.addEventListener('pointerleave', onPointerLeave)
    handle.addEventListener('keydown', onKeyDown)
    handle.addEventListener('focus', onFocus)
    handle.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    announce(true)

    // Ждём конца CSS-входа и продолжаем с того же места: шов не прыгает
    if (!reduced) {
      // Без Web Animations (старый браузер, тестовая среда) входа не ждём: шов сразу ведёт скрипт
      const entrance =
        typeof hero.getAnimations === 'function'
          ? hero
              .getAnimations()
              .filter(animation => (animation as CSSAnimation).animationName === 'dir-ai-seam-in')
          : []
      const begin = () => {
        if (disposed || mode !== 'intro') return
        release()
        setMode('ambient')
      }
      if (entrance.length === 0) begin()
      else Promise.all(entrance.map(animation => animation.finished)).then(begin, () => undefined)
    }

    return () => {
      disposed = true
      window.clearTimeout(resumeTimer)
      if (raf) cancelAnimationFrame(raf)
      observer?.disconnect()
      hero.removeEventListener('pointermove', onPointerMove)
      hero.removeEventListener('pointerdown', onPointerDown)
      hero.removeEventListener('pointerup', onPointerEnd)
      hero.removeEventListener('pointercancel', onPointerEnd)
      hero.removeEventListener('pointerleave', onPointerLeave)
      handle.removeEventListener('keydown', onKeyDown)
      handle.removeEventListener('focus', onFocus)
      handle.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [heroRef, handleRef])
}

function Hero({ frame, portrait }: { frame: SceneFrame | null; portrait: SceneFrame | null }) {
  const sizes = portrait ? '100vw' : COVER_SIZES
  const page = useDirectionPage()
  const heroRef = useRef<HTMLElement>(null)
  const handleRef = useRef<HTMLDivElement>(null)
  useSeam(heroRef, handleRef)

  return (
    <section ref={heroRef} aria-labelledby="ai-title" data-live="true" className="dir-ai-hero">
      {/* Кадр: финал снизу, плёнка сверху обрезана швом */}
      <div aria-hidden="true" className="dir-ai-frames">
        <div className="dir-ai-layer dir-ai-final">
          <div className="dir-ai-photo">
            <Photo frame={frame} tone="final" sizes={sizes} priority adaptive portrait={portrait} />
          </div>
          <span className="dir-ai-light" />
        </div>
        <div className="dir-ai-layer dir-ai-plate">
          <div className="dir-ai-photo">
            {/* То же качество, что у финала: оптимизатор отдаёт один файл, серость делает CSS */}
            <Photo frame={frame} tone="plate" sizes={sizes} adaptive portrait={portrait} />
          </div>
        </div>
        <span className="dir-ai-scrim" />
        {/* Метки лежат над скримом, иначе тускнеют: их срез идёт тем же швом, что и у плёнки */}
        <div className="dir-ai-layer dir-ai-plate">
          <PlateMarks />
        </div>
      </div>

      {/* Три метки на весь экран: рубрика, таймкод шва и подписи «плёнка / финал» у самого шва */}
      <div className="dir-ai-meta dir-kit-meta font-mono uppercase tabular-nums">
        <p className="dir-ai-kicker dir-ai-rise" style={delay(0)}>
          <span aria-hidden="true" className="dir-ai-kicker-rule" />
          <span className="dir-ai-meta-long">
            06 / AI · Санкт-Петербург · Москва · по&nbsp;России
          </span>
          <span className="dir-ai-meta-short">06 / AI · СПб · Москва · Россия</span>
        </p>
        <p className="dir-ai-meta-tc dir-ai-rise" style={delay(80)} aria-hidden="true">
          TC <span data-seam-tc="">{timecode(SEAM_REST)}</span>
        </p>
      </div>

      <div className="dir-ai-top">
        <PlateBoxes />
        <div className="dir-ai-copy">
          {/* H1 — название направления и уточнение через тире; лид лежит отдельным абзацем ниже.
              Тире скрыто визуально (его роль играет красная риска), но остаётся в тексте заголовка */}
          <h1 id="ai-title" className="dir-ai-h1">
            <span className="dir-ai-h1-main dir-ai-rise" style={delay(140)}>
              AI<span className="dir-ai-hy">-</span>видео
            </span>
            <span className="sr-only"> — </span>
            <span className="dir-ai-h1-sub dir-ai-rise" style={delay(260)}>
              гибридный продакшн
            </span>
          </h1>

          <div aria-hidden="true" className="dir-ai-ruler dir-ai-rise" style={delay(320)}>
            <span className="dir-ai-ruler-ticks" />
            <span className="dir-ai-rider">
              <span className="dir-ai-rider-head" />
            </span>
          </div>
        </div>

        {/* Шов. Линия на весь экран, ручка — слайдер для клавиатуры и ассистивных технологий */}
        <div className="dir-ai-seam">
          <span aria-hidden="true" className="dir-ai-seam-line" />
          <span aria-hidden="true" className="dir-ai-seam-tag dir-ai-seam-tag-l">
            <span className="type-meta font-mono uppercase">Плёнка</span>
            <span className="type-meta-sm font-mono uppercase">плоский кадр</span>
          </span>
          <span aria-hidden="true" className="dir-ai-seam-tag dir-ai-seam-tag-r">
            <span className="type-meta font-mono uppercase">Финал</span>
            <span className="type-meta-sm font-mono uppercase">цвет и сведение</span>
          </span>
          <div
            ref={handleRef}
            role="slider"
            tabIndex={0}
            aria-label="Шов между плёнкой и финалом"
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={SEAM_REST}
            aria-valuetext={`Плёнка ${SEAM_REST} %, финал ${100 - SEAM_REST} %`}
            className="dir-ai-handle"
          >
            <span aria-hidden="true" className="dir-ai-ring" />
            <span aria-hidden="true" className="dir-ai-grip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="dir-ai-hero-row dir-ai-pad">
        <p className="dir-ai-lead dir-ai-rise" style={delay(380)}>
          {tidy(
            'Живая съёмка, генерация и постпродакшн в одной работе — без пластиковой картинки.'
          )}
        </p>
        <div className="dir-ai-hero-cta dir-ai-rise" style={delay(460)}>
          <DirectionButton
            label={CTA_LABEL}
            onClick={() => page.openBrief('hero')}
            className="w-full md:w-auto"
          />
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── Слои: закреплённая стопка ───────────────────────────── */

const LAYERS = AI_PAGE.layers
const LAYER_COUNT = LAYERS.length
/** Доля прокрутки на раскрытие стопки; остальное делится между слоями */
const EXPLODE = 0.2

const activeAt = (progress: number) =>
  progress < EXPLODE
    ? -1
    : Math.min(LAYER_COUNT - 1, Math.floor(((progress - EXPLODE) / (1 - EXPLODE)) * LAYER_COUNT))
const middleOf = (index: number) => EXPLODE + ((index + 0.5) / LAYER_COUNT) * (1 - EXPLODE)

function CompGraphic() {
  const handles = [
    [144, 44],
    [130, 72],
    [99, 79],
    [68, 72],
    [54, 44],
    [68, 16],
    [99, 9],
    [130, 16],
  ]
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 96"
      className="absolute inset-0 h-full w-full"
      fill="none"
      strokeWidth="1"
    >
      <path
        d="M0 57.5H160M80 0V96"
        stroke="rgb(255 255 255 / 0.34)"
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="99"
        cy="44"
        rx="45"
        ry="35"
        fill="rgb(255 255 255 / 0.13)"
        stroke="rgb(255 255 255 / 0.92)"
        vectorEffect="non-scaling-stroke"
      />
      <ellipse
        cx="99"
        cy="44"
        rx="54"
        ry="42"
        strokeDasharray="3 4"
        style={{ stroke: 'var(--accent)' }}
        vectorEffect="non-scaling-stroke"
      />
      {handles.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={(x ?? 0) - 1.6}
          y={(y ?? 0) - 1.6}
          width="3.2"
          height="3.2"
          fill="#000"
          stroke="rgb(255 255 255 / 0.9)"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path
        d="M12 70C30 62 40 78 58 70"
        stroke="rgb(255 255 255 / 0.72)"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x="10"
        y="26"
        width="26"
        height="22"
        stroke="rgb(255 255 255 / 0.66)"
        strokeDasharray="2 2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function LayerCard({
  index,
  frame,
  state,
}: {
  index: number
  frame: SceneFrame | null
  /** idle — стопка ещё не раскрыта, выбранного слоя нет */
  state: 'on' | 'off' | 'idle'
}) {
  const layer = LAYERS[index]
  const sizes = '(min-width: 1024px) 36vw, 76vw'
  // Пока стопка собрана, сверху лежит итог: подпись слоя 04 сказала бы «цвет», а не «кадр»
  const top = index === LAYER_COUNT - 1
  const tag =
    top && state === 'idle' ? `Кадр · ${LAYER_COUNT} слоя` : `${layer?.number} · ${layer?.code}`
  return (
    <div
      className="dir-ai-card"
      data-on={state === 'on' ? 'true' : state === 'off' ? 'false' : 'idle'}
      data-layer={index}
      style={vars({ '--k': index })}
    >
      {index === 0 ? (
        <>
          <Photo frame={frame} tone="plate" sizes={sizes} quality={65} />
          <span className="dir-ai-grid" />
          <span className="dir-ai-safe" />
          {[0, 1, 2].map(n => (
            <Cross key={n} x={[16, 41, 68][n] ?? 16} y={[26, 62, 30][n] ?? 26} hide={n === 2} />
          ))}
        </>
      ) : null}
      {index === 1 ? (
        <>
          <span className="dir-ai-hatch" />
          <span className="dir-ai-genregion">
            <Photo frame={frame} tone="final" sizes={sizes} quality={65} />
            <span className="dir-ai-diff" />
          </span>
          <span className="dir-ai-genring" />
        </>
      ) : null}
      {index === 2 ? (
        <>
          <span className="dir-ai-hatch dir-ai-hatch-dense" />
          <CompGraphic />
        </>
      ) : null}
      {index === 3 ? (
        <>
          <Photo frame={frame} tone="final" sizes={sizes} quality={65} />
          <span className="dir-ai-genregion dir-ai-genregion-mark">
            <span className="dir-ai-diff" />
          </span>
          <span className="dir-ai-bars">
            {Array.from({ length: 9 }, (_, n) => (
              <i key={n} style={vars({ '--g': `${n * 12.5}%` })} />
            ))}
            <i className="dir-ai-bars-red" />
          </span>
        </>
      ) : null}
      <span className="dir-ai-card-tag font-mono uppercase tabular-nums">{tag}</span>
    </div>
  )
}

function Layers({ frame, index }: { frame: SceneFrame | null; index: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReduced()
  const [active, setActive] = useState(-1)
  const [diff, setDiff] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const apply = useCallback(
    (progress: number) => {
      const node = ref.current
      if (!node || reduced) return
      node.style.setProperty('--ai-e', smooth(clamp(progress / EXPLODE)).toFixed(3))
      node.style.setProperty('--ai-p', clamp(progress).toFixed(3))
      setActive(activeAt(progress))
    },
    [reduced]
  )

  useMotionValueEvent(scrollYProgress, 'change', apply)
  // Страница могла открыться с восстановленной прокруткой: берём положение сразу
  useEffect(() => {
    const frame = requestAnimationFrame(() => apply(scrollYProgress.get()))
    return () => cancelAnimationFrame(frame)
  }, [apply, scrollYProgress])

  // Без движения стопка раскрыта сразу, а слой выбирают кнопками
  const shown = reduced ? Math.max(active, 0) : active
  const lit = Math.max(shown, 0)

  const goTo = (position: number) => {
    if (reduced) {
      setActive(position)
      return
    }
    const node = ref.current
    if (!node) return
    const top = node.getBoundingClientRect().top + window.scrollY
    const range = Math.max(0, node.offsetHeight - window.innerHeight)
    window.scrollTo({ top: top + range * middleOf(position), behavior: 'smooth' })
  }

  const onKey = (event: ReactKeyboardEvent<HTMLOListElement>) => {
    if (
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowLeft'
    )
      return
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-layer-btn]')
    )
    const at = buttons.findIndex(button => button === document.activeElement)
    if (at < 0) return
    event.preventDefault()
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    buttons[(at + (forward ? 1 : -1) + buttons.length) % buttons.length]?.focus()
  }

  return (
    <section
      ref={ref}
      id="ai-layers"
      aria-labelledby="ai-layers-title"
      data-diff={diff ? 'true' : 'false'}
      className="dir-ai-layers"
    >
      <div className="dir-ai-pin dir-ai-pad">
        <div className="dir-ai-pin-copy">
          <div className="dir-ai-pin-head">
            <Kicker index={index} label="Слои" />
            <h2 id="ai-layers-title" className="dir-ai-h2 dir-ai-h2-layers" data-reveal="">
              Четыре слоя одной работы
            </h2>
          </div>

          <ol className="dir-ai-steps" onKeyDown={onKey}>
            {LAYERS.map((layer, position) => (
              <li
                key={layer.number}
                className="dir-ai-step"
                data-active={shown === position ? 'true' : 'false'}
                data-lit={lit === position ? 'true' : 'false'}
              >
                <button
                  type="button"
                  data-layer-btn=""
                  aria-expanded={lit === position}
                  aria-controls={`ai-layer-${position}`}
                  onClick={() => goTo(position)}
                  className="dir-ai-step-btn"
                >
                  <span className="dir-ai-step-num type-meta font-mono tabular-nums">
                    {layer.number}
                  </span>
                  <span className="dir-ai-step-title">{tidy(layer.title)}</span>
                  <span className="dir-ai-step-tag type-meta-sm font-mono uppercase">
                    {layer.tag}
                  </span>
                </button>
                <div id={`ai-layer-${position}`} className="dir-ai-step-panel">
                  <div>
                    <p aria-hidden="true" className="dir-ai-step-echo">
                      {tidy(layer.title)} · {layer.tag}
                    </p>
                    <p>{tidy(layer.text)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="dir-ai-stage3d">
          <div
            aria-hidden="true"
            className="dir-ai-stage-read type-meta font-mono uppercase tabular-nums"
          >
            <span>
              {shown < 0 ? (
                <>
                  Кадр собран
                  <span className="dir-ai-stage-more"> · {LAYER_COUNT} слоя</span>
                </>
              ) : (
                `Слой ${pad2(shown + 1)} / ${pad2(LAYER_COUNT)}`
              )}
            </span>
            <span className="dir-ai-stage-hint">Листайте: слои расходятся</span>
          </div>
          <div aria-hidden="true" className="dir-ai-deck">
            {LAYERS.map((layer, position) => (
              <LayerCard
                key={layer.number}
                index={position}
                frame={frame}
                state={shown < 0 ? 'idle' : shown === position ? 'on' : 'off'}
              />
            ))}
          </div>
          <div className="dir-ai-diff-row">
            <button
              type="button"
              aria-pressed={diff}
              onClick={() => setDiff(value => !value)}
              className="dir-ai-diff-btn type-meta font-mono uppercase"
            >
              <span aria-hidden="true" className="dir-ai-switch" />
              Показать разницу
            </button>
            {/* Что значит «разница»: без подписи красная штриховка на тёмном кадре читалась как сбой */}
            <p
              aria-hidden="true"
              data-on={diff ? 'true' : 'false'}
              className="dir-ai-diff-note type-meta-sm font-mono uppercase"
            >
              <i />
              {tidy('Красное — сгенерировано, серое — снято')}
            </p>
          </div>
          <p className="dir-ai-stage-note type-meta-sm font-mono uppercase">
            {tidy('Схема слоёв, а не разбор конкретного кадра.')}
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── Где что: разрез по шву ───────────────────────────── */

function FitRow({
  glyph,
  code,
  title,
  text,
  position,
}: {
  glyph: string
  code: string
  title: string
  text: string
  position: number
}) {
  return (
    <li className="dir-ai-row" data-reveal="" style={delay(position * 70)}>
      <span className="dir-ai-row-glyph">
        <Glyph kind={glyph} />
      </span>
      <div className="dir-ai-row-body">
        <p className="dir-ai-row-code type-meta font-mono uppercase tabular-nums">{code}</p>
        <h3 className="dir-ai-row-title">{tieShort(title)}</h3>
        <p className="dir-ai-row-text">{tidy(text)}</p>
      </div>
    </li>
  )
}

/** Кадр над колонкой: справа плоская плёнка с метками, слева тот же кадр с красным кольцом генерации */
function FitFrame({
  frame,
  tone,
  label,
}: {
  frame: SceneFrame | null
  tone: 'final' | 'plate'
  label: string
}) {
  const plate = tone === 'plate'
  return (
    <div aria-hidden="true" className="dir-ai-fit-frame" data-tone={tone}>
      <Photo frame={frame} tone={tone} sizes={FIT_SIZES} quality={65} />
      <span className="dir-ai-fit-veil" />
      {plate ? (
        <>
          <span className="dir-ai-grid" />
          <span className="dir-ai-safe" />
          <Cross x={24} y={38} />
          <Cross x={62} y={58} />
        </>
      ) : (
        <span className="dir-ai-genring dir-ai-fit-ring" />
      )}
      <span className="dir-ai-frame-tag dir-ai-fit-tag type-meta-sm font-mono uppercase tabular-nums">
        {label}
      </span>
    </div>
  )
}

function Fit({
  index,
  genFrame,
  camFrame,
}: {
  index: string
  /** Левая колонка: то, что нельзя снять, — кадр с красным кольцом генерации */
  genFrame: SceneFrame | null
  /** Правая колонка: то, что лучше снять камерой, — лицо и кожа на плёнке */
  camFrame: SceneFrame | null
}) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })

  return (
    <section
      ref={ref}
      id="ai-fit"
      aria-labelledby="ai-fit-title"
      className="dir-ai-fit dir-ai-pad relative"
    >
      <header data-sticky-hide="desktop" className="dir-ai-fit-head">
        <Kicker index={index} label="Где что" />
        <h2 id="ai-fit-title" data-reveal="" className="dir-ai-fit-title">
          <span className="dir-ai-fit-a">{tidy('Где AI даёт преимущество,')}</span>{' '}
          <span className="dir-ai-fit-b">{tidy('а где нет')}</span>
        </h2>
      </header>

      <div className="dir-ai-fit-grid">
        <span aria-hidden="true" className="dir-ai-fit-seam">
          <motion.span className="dir-ai-fit-seam-fill" style={{ scaleY: scrollYProgress }} />
        </span>

        <div className="dir-ai-fit-col dir-ai-fit-gen">
          <FitFrame frame={genFrame} tone="final" label="Слой 02 · генерация" />
          <p className="dir-ai-fit-label type-meta font-mono uppercase tabular-nums">
            <span aria-hidden="true" className="dir-ai-fit-dot" />
            Подходит
            <span aria-hidden="true" className="dir-ai-fit-count">
              → Слой 02
            </span>
          </p>
          <ul role="list">
            {AI_PAGE.fits.map((item, position) => (
              <FitRow
                key={item.title}
                glyph={FIT_GLYPHS[position] ?? 'morph'}
                code={`Ген ${pad2(position + 1)}`}
                title={item.title}
                text={item.text}
                position={position}
              />
            ))}
          </ul>
        </div>

        <div className="dir-ai-fit-col dir-ai-fit-cam">
          <FitFrame frame={camFrame} tone="plate" label="Слой 01 · плёнка" />
          <p className="dir-ai-fit-label type-meta font-mono uppercase tabular-nums">
            <span aria-hidden="true" className="dir-ai-fit-dot" />
            Лучше снять камерой
            <span aria-hidden="true" className="dir-ai-fit-count">
              → Слой 01
            </span>
          </p>
          <ul role="list">
            {AI_PAGE.misfits.map((item, position) => (
              <FitRow
                key={item.title}
                glyph={MISFIT_GLYPHS[position] ?? 'skin'}
                code={`Кам ${pad2(position + 1)}`}
                title={item.title}
                text={item.text}
                position={position}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── Лента кадров: шов на каждом ───────────────────────────── */

/**
 * Шесть кадров, у каждого свой шов: слева плоская плёнка, справа цвет. Тот же жест, что на
 * первом экране, но на разных кадрах: видно, что шов — приём постпродакшна, а не один
 * удачный кадр. Лента декоративная: подписей, клиентов и ссылок на кейсы здесь нет.
 */
const REEL_SIZES = '(min-width: 1024px) 17vw, 60vw'

function Reel({ frames }: { frames: { frame: SceneFrame; seam: number }[] }) {
  return (
    <section aria-hidden="true" className="dir-ai-reel">
      <div className="dir-ai-pad dir-ai-reel-head type-meta font-mono uppercase tabular-nums">
        <span>Шов на каждом кадре</span>
        <span className="dir-ai-reel-rule" />
        <span>Плёнка → финал</span>
      </div>
      <ul role="presentation" className="dir-ai-reel-track">
        {frames.map(({ frame, seam }, index) => (
          <li key={frame.key} className="dir-ai-reel-tile" style={vars({ '--seam': `${seam}%` })}>
            <div className="dir-ai-reel-photo">
              <Photo frame={frame} tone="final" sizes={REEL_SIZES} quality={65} />
            </div>
            <div className="dir-ai-reel-plate">
              <Photo frame={frame} tone="plate" sizes={REEL_SIZES} quality={65} />
            </div>
            <span className="dir-ai-reel-seam" />
            <span className="dir-ai-frame-tag dir-ai-reel-tag type-meta-sm font-mono uppercase tabular-nums">
              Ген {pad2(index + 1)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ───────────────────────────── Работы ───────────────────────────── */

function Works({ works, index }: { works: DirectionPageWork[]; index: string }) {
  const page = useDirectionPage()

  return (
    <section aria-labelledby="ai-works-title" className="dir-ai-works dir-ai-pad">
      <header className="dir-ai-works-head">
        <div>
          <Kicker index={index} label="Работы" />
          <h2 id="ai-works-title" data-reveal="" className="dir-ai-h2 dir-ai-h2-works">
            AI и гибрид в работах
          </h2>
        </div>
        <p className="dir-ai-note type-meta font-mono uppercase">Проекты с генерацией</p>
      </header>

      <ul role="list" className="dir-ai-works-list">
        {works.map((work, position) => {
          const shots =
            work.stills.length > 0 ? work.stills : work.posterUrl ? [work.posterUrl] : []
          const [lead, ...rest] = shots
          const note = AI_PAGE.workNotes[work.slug]
          return (
            <li
              key={work.slug}
              data-reveal=""
              data-flip={position % 2 === 1 ? 'true' : 'false'}
              className="dir-ai-work"
            >
              <Link
                href={`/projects/${work.slug}`}
                prefetch={false}
                onClick={() => page.openCase(work.slug)}
                className="dir-ai-work-link"
              >
                <div className="dir-ai-work-frame">
                  {lead ? (
                    <Still
                      src={lead}
                      alt=""
                      sizes="(min-width: 1024px) 62vw, 100vw"
                      quality={65}
                      className="absolute inset-0 h-full w-full"
                      imgClassName="dir-ai-work-img"
                    />
                  ) : (
                    <Scene tone="final" />
                  )}
                  <span aria-hidden="true" className="dir-ai-corner dir-ai-corner-a" />
                  <span aria-hidden="true" className="dir-ai-corner dir-ai-corner-b" />
                  <span
                    aria-hidden="true"
                    className="dir-ai-frame-tag type-meta-sm font-mono uppercase tabular-nums"
                  >
                    Кадр 01{work.year ? ` · ${work.year}` : ''}
                  </span>
                </div>

                <div className="dir-ai-work-info">
                  {/* Строка тайм-кода вместо гигантской призрачной цифры: номер работы на линейке */}
                  <span
                    aria-hidden="true"
                    className="dir-ai-work-idx type-meta font-mono tabular-nums"
                  >
                    <span className="dir-ai-work-idx-now">{pad2(position + 1)}</span>
                    <span
                      className="dir-ai-work-idx-ticks"
                      style={vars({ '--at': works.length > 1 ? position / (works.length - 1) : 0 })}
                    />
                    <span>{pad2(works.length)}</span>
                  </span>
                  <div className="dir-ai-work-text">
                    <h3 className="dir-ai-work-client">{work.client}</h3>
                    <p className="dir-ai-work-title">{tidy(work.title)}</p>
                    {note ? (
                      <p className="dir-ai-work-note">
                        <span className="type-meta-sm font-mono uppercase">Роль AI</span>
                        {tidy(note)}
                      </p>
                    ) : null}
                    <span className="dir-ai-work-go type-meta font-mono uppercase">
                      Смотреть работу
                      <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                {rest.length > 0 ? (
                  <div aria-hidden="true" className="dir-ai-work-strip">
                    {rest.slice(0, 3).map((src, n) => (
                      <div key={src} className="dir-ai-work-thumb">
                        <Still
                          src={src}
                          alt=""
                          sizes="(min-width: 1024px) 20vw, 30vw"
                          quality={50}
                          className="absolute inset-0 h-full w-full"
                          imgClassName="dir-ai-work-img"
                        />
                        <span className="dir-ai-thumb-tag type-meta-sm font-mono uppercase tabular-nums">
                          {pad2(n + 2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ───────────────────────────── CTA: два смысловых ───────────────────────────── */

/**
 * Мини-шов: тот же жест, что на первом экране, только маленький и медленный.
 * Ход стоит, пока блок вне кадра (useLive), и снимается при сниженном движении.
 */
function SeamMini({ className }: { className?: string }) {
  const liveRef = useLive<HTMLDivElement>()
  return (
    <div ref={liveRef} data-live="true" aria-hidden="true" className={cn('dir-ai-mini', className)}>
      <div className="dir-ai-mini-final">
        <Scene tone="final" />
      </div>
      <div className="dir-ai-mini-plate">
        <Scene tone="plate" />
        <span className="dir-ai-grid" />
        <Cross x={22} y={34} />
        <Cross x={46} y={66} />
      </div>
      <span className="dir-ai-mini-seam">
        <span />
      </span>
    </div>
  )
}

/** После работ: светлая «плёнка» — единственная светлая секция страницы, общий токен бумаги */
function PlateCta({ cta, where }: { cta: AiCta; where: string }) {
  const page = useDirectionPage()
  return (
    <section
      data-sticky-hide="all"
      aria-labelledby="ai-cta-proof-title"
      className="dir-ai-slab dir-paper-section dir-ai-pad"
    >
      {/* Штриховка плёнки лежит своим слоем: у самой секции overflow не ставим, иначе обрежется кромка бумаги */}
      <span aria-hidden="true" className="dir-ai-slab-hatch" />
      <div className="dir-ai-slab-main">
        <Kicker tone="paper" label={cta.kicker} />
        <h2 id="ai-cta-proof-title" data-reveal="" className="dir-ai-slab-title">
          {tidy(cta.title)}
        </h2>
        <p data-reveal="" style={delay(80)} className="dir-ai-slab-text">
          {tidy(cta.text)}
        </p>
        <div data-reveal="" style={delay(160)}>
          <DirectionButton
            label={cta.label}
            onClick={() => page.openBrief(where)}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="dir-ai-slab-side">
        <SeamMini />
        <ol aria-hidden="true" className="dir-ai-slab-layers">
          {LAYERS.map((layer, position) => (
            <li key={layer.number} data-reveal="" style={delay(position * 70)}>
              <span className="type-meta font-mono uppercase tabular-nums">{layer.number}</span>
              <span className="dir-ai-slab-bar" data-kind={position} />
              <span className="type-meta font-mono uppercase">{layer.tag}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** После процесса: кнопка — клип на дорожке между метками IN и OUT, у красной головки */
function ClipCta({ cta, where }: { cta: AiCta; where: string }) {
  const page = useDirectionPage()
  return (
    <section
      data-sticky-hide="all"
      aria-labelledby="ai-cta-process-title"
      className="dir-ai-clipcta dir-ai-pad"
    >
      <div className="dir-ai-clipcta-head">
        <Kicker label={cta.kicker} />
        <h2 id="ai-cta-process-title" data-reveal="" className="dir-ai-clipcta-title">
          {tidy(cta.title)}
        </h2>
      </div>
      <p data-reveal="" style={delay(80)} className="dir-ai-clipcta-text">
        {tidy(cta.text)}
      </p>

      <div data-reveal="" style={delay(140)} className="dir-ai-clipcta-track">
        <span aria-hidden="true" className="dir-ai-clip-io type-meta-sm font-mono uppercase">
          IN
        </span>
        <div className="dir-ai-clip-lane">
          {/* Пустые клипы дорожки: кнопка — первый в очереди, дальше место под ваши материалы */}
          <span
            aria-hidden="true"
            className="dir-ai-clip-empty"
            style={vars({ '--s': 0, '--w': 0.42 })}
          />
          <span
            aria-hidden="true"
            className="dir-ai-clip-empty"
            style={vars({ '--s': 0.48, '--w': 0.52 })}
          />
          <DirectionButton
            label={cta.label}
            onClick={() => page.openBrief(where)}
            className="w-full md:max-w-[26rem]"
          />
        </div>
        <span aria-hidden="true" className="dir-ai-clip-io type-meta-sm font-mono uppercase">
          OUT
        </span>
      </div>
    </section>
  )
}

/* ───────────────────────────── Процесс: монтажные дорожки ───────────────────────────── */

/** Положение и длина клипа на дорожке, % ширины: схема последовательности, не сроки */
const CLIPS = [
  { start: 0, width: 27 },
  { start: 15, width: 33 },
  { start: 31, width: 33 },
  { start: 52, width: 27 },
  { start: 70, width: 30 },
]

type ClipState = 'todo' | 'live' | 'done'

function Process({ index }: { index: string }) {
  const listRef = useRef<HTMLOListElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const reduced = useReduced()
  const [states, setStates] = useState<ClipState[]>(() => CLIPS.map(() => 'todo'))
  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start 72%', 'end 45%'],
  })

  const setAll = useCallback((next: ClipState[]) => {
    setStates(prev => (prev.every((value, position) => value === next[position]) ? prev : next))
  }, [])

  // Головка идёт за прокруткой; клип загорается, когда головка внутри него
  const follow = useCallback(
    (progress: number) => {
      const node = wrapRef.current
      if (!node || reduced) return
      const at = clamp(progress) * 100
      node.style.setProperty('--ai-tl', at.toFixed(2))
      if (!window.matchMedia('(min-width: 64rem)').matches) return
      setAll(
        CLIPS.map(clip => {
          if (progress <= 0) return 'todo'
          if (at >= clip.start + clip.width) return 'done'
          return at >= clip.start ? 'live' : 'todo'
        })
      )
    },
    [reduced, setAll]
  )

  useMotionValueEvent(scrollYProgress, 'change', follow)
  useEffect(() => {
    const frame = requestAnimationFrame(() => follow(scrollYProgress.get()))
    return () => cancelAnimationFrame(frame)
  }, [follow, scrollYProgress])

  // Телефон: дорожки свои у каждого этапа, клип горит у строки в середине экрана
  useEffect(() => {
    const list = listRef.current
    if (reduced || !list || typeof IntersectionObserver === 'undefined') return
    const narrow = window.matchMedia('(max-width: 63.99rem)')
    let observer: IntersectionObserver | null = null
    const seen: ClipState[] = CLIPS.map(() => 'todo')

    const connect = () => {
      observer?.disconnect()
      observer = null
      if (!narrow.matches) return
      const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-row]'))
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            const position = rows.indexOf(entry.target as HTMLElement)
            if (position < 0) continue
            seen[position] = entry.isIntersecting
              ? 'live'
              : entry.boundingClientRect.top < 0
                ? 'done'
                : 'todo'
          }
          setAll([...seen])
        },
        { rootMargin: '-38% 0px -38% 0px', threshold: 0 }
      )
      rows.forEach(row => observer?.observe(row))
    }

    connect()
    narrow.addEventListener('change', connect)
    return () => {
      narrow.removeEventListener('change', connect)
      observer?.disconnect()
    }
  }, [reduced, setAll])

  return (
    <section aria-labelledby="ai-process-title" className="dir-ai-process dir-ai-pad">
      <header className="dir-ai-process-head">
        <Kicker index={index} label="Процесс" />
        <h2 id="ai-process-title" data-reveal="" className="dir-ai-h2 dir-ai-h2-process">
          Как строится гибридная работа
        </h2>
        <p data-reveal="" style={delay(80)} className="dir-ai-process-lead">
          {tidy('Начинаем с задачи, а не с нейросети.')}
        </p>
      </header>

      <div
        ref={wrapRef}
        data-sticky-hide="desktop"
        className="dir-ai-tl"
        data-reduced={reduced ? 'true' : 'false'}
      >
        <div aria-hidden="true" className="dir-ai-tl-ruler type-meta-sm font-mono uppercase">
          <span>IN</span>
          <span className="dir-ai-tl-ticks" />
          <span>OUT</span>
        </div>
        <div aria-hidden="true" className="dir-ai-head-lane">
          <span className="dir-ai-head">
            <span className="dir-ai-head-line" />
          </span>
        </div>

        <ol ref={listRef} role="list" className="dir-ai-tracks">
          {AI_PAGE.process.map((step, position) => {
            const clip = CLIPS[position] ?? CLIPS[CLIPS.length - 1]
            return (
              <li
                key={step.number}
                data-row=""
                data-state={reduced ? 'done' : (states[position] ?? 'todo')}
                className="dir-ai-track-row"
              >
                <div className="dir-ai-track-text">
                  <span aria-hidden="true" className="dir-ai-track-num tabular-nums">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="dir-ai-track-title">{tidy(step.title)}</h3>
                    <p className="dir-ai-track-desc">{tidy(step.text)}</p>
                  </div>
                </div>
                <div
                  aria-hidden="true"
                  className="dir-ai-track"
                  style={vars({ '--s': clip?.start ?? 0, '--w': clip?.width ?? 30 })}
                >
                  <span className="dir-ai-track-label type-meta-sm font-mono uppercase tabular-nums">
                    V{position + 1}
                  </span>
                  <span className="dir-ai-clipbar">
                    <span className="type-meta-sm font-mono uppercase tabular-nums">
                      {step.number}
                    </span>
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/* ───────────────────────────── Страница ───────────────────────────── */

/**
 * Кадры сцены по местам. Горизонталь и вертикаль подобраны под форму слота:
 * первый экран и выход на телефоне получают вертикальный кадр той же сцены.
 * Кадры от портфолио не зависят.
 *
 *  - шов первого экрана и стопка слоёв — лебедь в зале и в накидке: «кадр, который нельзя снять»;
 *  - «Где что»: слева генерация, справа макро кожи — то, что лучше снять камерой;
 *  - лента: шесть разных съёмок, на каждой свой шов.
 */
const FRAME = {
  hero: sceneFrame('swan-hall'),
  heroPhone: sceneFrame('swan-red-wall'),
  layers: sceneFrame('swan-cape-wide'),
  fitGen: sceneFrame('swan-red-wall-wide'),
  fitCam: sceneFrame('skin-eyes-wide'),
  closing: sceneFrame('swan-embrace'),
  // У swan-cape лицо стояло под заголовком «Что нельзя снять»; у swan-wing оно над ним
  closingPhone: sceneFrame('swan-wing'),
}

const REEL_FRAMES = [
  { frame: sceneFrame('redhead-lowkey'), seam: 46 },
  { frame: sceneFrame('burgundy-hall'), seam: 62 },
  { frame: sceneFrame('redhead-leaf'), seam: 38 },
  { frame: sceneFrame('swan-wing'), seam: 55 },
  { frame: sceneFrame('helmet'), seam: 70 },
  { frame: sceneFrame('redhead-dunes'), seam: 42 },
]

/** Лицо на выходе уходит левее: правая часть кадра светлая, там его и видно */
const CLOSING_POSITION = '15% 20%'

export function AiPage({ works }: AiPageProps) {
  const { closing, closingPhone } = FRAME
  const hasWorks = works.length > 0

  // Нумерация разделов не должна оставлять дыру, если работ нет
  let counter = 0
  const next = () => pad2(++counter)
  const layersIndex = next()
  const fitIndex = next()
  const worksIndex = hasWorks ? next() : ''
  const processIndex = next()
  const faqIndex = next()

  return (
    <DirectionShell id="ai" stickyLabel={AI_PAGE.stickyLabel}>
      <div className="dir-ai">
        <Hero frame={FRAME.hero} portrait={FRAME.heroPhone} />
        <Cut from="Склейка 01" to="00:00:08:12" />
        <Layers frame={FRAME.layers} index={layersIndex} />
        <Fit index={fitIndex} genFrame={FRAME.fitGen} camFrame={FRAME.fitCam} />
        <Reel frames={REEL_FRAMES} />
        {hasWorks ? (
          <>
            <Cut from="Склейка 02" to="00:00:21:04" tone="deep" />
            <Works works={works} index={worksIndex} />
          </>
        ) : null}
        <PlateCta cta={AI_PAGE.ctas.proof} where="proof" />
        <Process index={processIndex} />
        <ClipCta cta={AI_PAGE.ctas.process} where="process" />
        <DirectionFaq index={faqIndex} title="Вопросы об AI-видео" items={FAQ_ITEMS} />
        <OtherDirections current="ai" reading={DIRECTION_READING['ai']} />
        <DirectionEnd
          lines={AI_PAGE.end.lines}
          ctaLabel={CTA_LABEL}
          note={tidy(AI_PAGE.end.note)}
          frame={{
            src: closing.src,
            position: CLOSING_POSITION,
            portrait: { src: closingPhone.src, objectPosition: closingPhone.position },
          }}
          aside={<SeamMini className="dir-ai-mini-end" />}
        />
      </div>
    </DirectionShell>
  )
}
