/**
 * /beauty-video — «МАКРО».
 *
 * Метафора: линза. Страница — это один долгий наезд камеры: от расфокуса к
 * резкому кадру и обратно к предмету, вокруг которого ходит свет. Единственный
 * цвет, кроме чёрного, белого и красного акцента, — тёплый блик на коже.
 *
 * Композиция (каждая секция со своим масштабом и плотностью):
 *   1. Hero — кадр в расфокусе, линза ведёт резкий кадр; удержание — ближе.
 *   2. Наезд — sticky-сцена: круг раскрывается до кадра, слова и шкала ×8 → ×1.
 *   3. Материалы — липкий видоискатель слева, крупные строки справа; у каждой
 *      строки своя линейка крупности ×1…×8.
 *   4. Предмет — световой объект в рамке видоискателя, свет обходит его по
 *      орбите, под ним линейка угла света 000°…360°.
 *   5. Работы и единственный промежуточный CTA с диском-линзой.
 *   6. Процесс — своя шкала ×1…×5: цифры растут, красная линия идёт за скроллом.
 *   7. Вопросы (прицел сбоку), отъезд к общему плану, финал.
 *
 * Производительность: всё, что движется каждый кадр (линза, свет у предмета),
 * пишет transform напрямую в узел, без состояния React; циклы стоят, пока
 * секция вне экрана (IntersectionObserver). При prefers-reduced-motion циклов
 * нет: линза и свет остаются в выбранном положении, вёрстка не меняется.
 *
 * Если работ из портфолио нет, каждая секция остаётся целой: кадры заменяет
 * «макро-поверхность» — свет, блик и кольца без единой картинки.
 */
'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { ArrowDown } from 'lucide-react'

import { BEAUTY_PAGE, type BeautyMaterial } from '@/lib/services/pages/content/beauty'
import type { FaqItem, ProcessStep } from '@/lib/services/pages/types'
import {
  interleaveFrames,
  type DirectionPageWork,
  type SceneFrame,
} from '@/lib/services/pages/resolve'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionCredits } from '../direction-credits'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import {
  DirectionButton,
  KIT_KICKER,
  KIT_TITLE,
  KIT_TITLE_SIZE,
  setTitle,
  typo,
} from '../direction-kit'
import { DIRECTION_READING } from '@/lib/services/pages'
import { OtherDirections } from '../other-directions'
import { Still } from '../still'
import './beauty-page.css'

export interface BeautyPageProps {
  works: DirectionPageWork[]
}

/** Кадр сцены: у работы может не быть ни одного, тогда вместо него макро-поверхность */
type Frame = SceneFrame | null

const pad = (value: number) => String(value).padStart(2, '0')
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const delay = (ms: number) => ({ '--bd': `${ms}ms` }) as CSSProperties

/** Шкала крупности ×1…×8: одна на всю страницу — линза, наезд, материалы */
const MACRO_MAX = 8
/** Кратность, с которой на самом деле увеличивается кадр при отметке ×8 */
const macroZoom = (macro: number) => 1 + (macro - 1) * 0.2

/**
 * Сниженное движение, известное только после монтирования. Сервер и первый
 * клиентский кадр обязаны совпадать, иначе гидрация видит другой style
 * (круг наезда уже раскрыт, хотя сервер нарисовал его малым). Поэтому и
 * значение для motion-цепочек, и флаг для вёрстки переключаются в эффекте.
 */
const CALM_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeCalm(notify: () => void) {
  const query = window.matchMedia(CALM_QUERY)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}

function useCalm() {
  const on = useSyncExternalStore(
    subscribeCalm,
    () => window.matchMedia(CALM_QUERY).matches,
    () => false
  )
  const value = useMotionValue(0)
  useEffect(() => {
    value.set(on ? 1 : 0)
  }, [on, value])
  return { on, value }
}

/**
 * Круг в слое сцены ставит и гасит цикл по положению на экране: пока секции
 * не видно, CSS-анимации стоят (data-live), а rAF-циклы слушают тот же признак.
 */
function useLive<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        node.dataset.live = String(entry?.isIntersecting ?? true)
      },
      { rootMargin: '12% 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
}

/**
 * Макро-поверхность вместо кадра: тёмный градиент, тёплый блик, резкий
 * белый отсвет и тонкие кольца вокруг точки фокуса. Без картинки и без blur.
 */
function MacroSurface({
  x = 62,
  y = 38,
  className,
}: {
  /** Точка фокуса в процентах: к ней стягиваются блик и кольца */
  x?: number
  y?: number
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`dir-beauty-surface ${className ?? ''}`}
      style={{ '--mx': `${x}%`, '--my': `${y}%` } as CSSProperties}
    />
  )
}

/** Кадр или, если кадра нет, макро-поверхность той же геометрии */
function Plate({
  frame,
  x,
  y,
  sizes = '100vw',
  priority = false,
  quality,
}: {
  frame: Frame
  x?: number
  y?: number
  sizes?: string
  priority?: boolean
  quality?: 50 | 65 | 75
}) {
  return frame ? (
    <Still
      src={frame.src}
      alt=""
      sizes={sizes}
      priority={priority}
      quality={quality}
      className="h-full w-full"
    />
  ) : (
    <MacroSurface x={x} y={y} className="absolute inset-0" />
  )
}

/* ───────────────────────────────── 1. Hero ───────────────────────────────── */

function Hero({ frame, hasWorks }: { frame: Frame; hasWorks: boolean }) {
  const page = useDirectionPage()
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const zoneRef = useRef<HTMLDivElement>(null)

  useLive(sectionRef)

  /*
   * Линза. Круг — отдельный узел со своим кадром внутри: круг двигается
   * transform, а кадр внутри него смещается в обратную сторону, поэтому
   * резкое изображение стоит на месте относительно расфокусированного.
   * Маску и её переменные не перерисовываем — только композитные слои.
   *
   * Без ввода линза плывёт по медленной фигуре и «дышит» кратностью; курсор
   * (или палец по горизонтали) уводит её за собой; удержание доводит кратность
   * до ×8; скролл по hero раскрывает круг шире и подводит ближе — это
   * начало наезда, который продолжает следующая секция.
   */
  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const lens = lensRef.current
    const inner = innerRef.current
    const tag = tagRef.current
    const readout = readoutRef.current
    const badge = badgeRef.current
    const content = contentRef.current
    const zone = zoneRef.current
    if (!section || !stage || !lens || !inner || !tag || !readout || !badge || !content || !zone) {
      return
    }

    let w = 1
    let h = 1
    let tagW = 140
    // Середина свободной зоны над текстом: на телефоне линза живёт там, а не под заголовком.
    // Зона — настоящий элемент вёрстки с минимальной высотой, а не остаток экрана: на коротких
    // телефонах hero становится чуть выше экрана, но линза не ложится на строки
    let zoneY = 0
    let zoneR = 0
    let r = 120
    let x = 0
    let y = 0
    let k = 1
    let m = 3
    let tx = 0
    let ty = 0
    let tm = 3
    let lastMove = -10_000
    let pressed = false
    let shown = ''
    let raf = 0
    let visible = true
    let last = 0
    let placed = false

    const compact = () => w < 768

    const measure = () => {
      const rect = stage.getBoundingClientRect()
      w = Math.max(1, rect.width)
      h = Math.max(1, rect.height)
      tagW = tag.offsetWidth
      if (compact()) {
        const area = zone.getBoundingClientRect()
        const top = area.top - rect.top + 4
        const bottom = area.bottom - rect.top - 6
        zoneY = (top + bottom) / 2
        zoneR = Math.max(0, (bottom - top) / 2)
        r = clamp(zoneR, 52, Math.min(w, h) * 0.27)
      } else {
        r = Math.max(84, Math.min(w, h) * 0.25)
      }
      stage.style.setProperty('--lens-d', `${(r * 2).toFixed(0)}px`)
      stage.style.setProperty('--stage-w', `${w.toFixed(0)}px`)
      stage.style.setProperty('--stage-h', `${h.toFixed(0)}px`)
    }

    const ambient = (t: number) => {
      if (compact()) {
        tx = w * (0.5 + Math.sin(t * 0.42) * 0.2)
        ty = zoneY + Math.cos(t * 0.3) * Math.max(0, zoneR - r) * 0.8
      } else {
        tx = w * (0.67 + Math.sin(t * 0.42) * 0.12)
        ty = h * (0.47 + Math.cos(t * 0.3) * 0.12)
      }
      tm = 3 + Math.sin(t * 0.7) * 1.7
    }

    const paint = () => {
      const s = macroZoom(m)
      const q = s / k
      lens.style.transform = `translate3d(${(x - r).toFixed(1)}px, ${(y - r).toFixed(1)}px, 0) scale(${k.toFixed(3)})`
      inner.style.transform = `matrix(${q.toFixed(3)}, 0, 0, ${q.toFixed(3)}, ${(r - x * q).toFixed(1)}, ${(r - y * q).toFixed(1)})`
      const off = r * k * 0.7071
      const tagX = Math.min(x + off + 14, w - tagW - 16)
      tag.style.transform = `translate3d(${Math.max(12, tagX).toFixed(1)}px, ${(y + off + 6).toFixed(1)}px, 0)`
      const text = `×${m.toFixed(1)}`
      if (text !== shown) {
        shown = text
        readout.textContent = text
        badge.textContent = text
      }
      if (!placed) {
        placed = true
        lens.dataset.ready = 'true'
        tag.dataset.ready = 'true'
      }
    }

    measure()

    // Без движения линза стоит в выбранном положении: кадр читается сразу
    if (reduced) {
      const rest = () => {
        x = w * (compact() ? 0.5 : 0.7)
        y = compact() ? zoneY : h * 0.48
      }
      rest()
      k = 1.1
      m = 4
      paint()
      const onResize = () => {
        measure()
        rest()
        paint()
      }
      window.addEventListener('resize', onResize)
      // Шрифт или перенос строк меняют высоту текста — свободная зона над ним тоже
      const fit = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize)
      fit?.observe(content)
      fit?.observe(zone)
      return () => {
        window.removeEventListener('resize', onResize)
        fit?.disconnect()
      }
    }

    x = tx = w * 0.7
    y = ty = compact() ? zoneY : h * 0.5

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(64, now - (last || now))
      last = now
      const scroll = clamp(window.scrollY / h, 0, 1)

      if (now - lastMove > 2400 && !pressed) {
        ambient(now / 1000)
      } else {
        tm = pressed ? MACRO_MAX : 3.4
      }
      tm = Math.min(MACRO_MAX, tm + scroll * 2)
      const tk = 1 + scroll * 0.55

      const a = 1 - Math.exp(-dt / 150)
      x += (tx - x) * a
      y += (ty - y) * a
      m += (tm - m) * (1 - Math.exp(-dt / 320))
      k += (tk - k) * (1 - Math.exp(-dt / 200))
      paint()
    }

    const start = () => {
      if (raf || !visible) return
      last = 0
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' && !pressed) return
      const rect = stage.getBoundingClientRect()
      tx = clamp(event.clientX - rect.left, 0, w)
      ty = clamp(event.clientY - rect.top, 0, h)
      lastMove = performance.now()
    }
    const onDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).closest('a, button')) return
      pressed = true
      if (event.pointerType === 'touch') {
        const rect = stage.getBoundingClientRect()
        tx = clamp(event.clientX - rect.left, 0, w)
        ty = clamp(event.clientY - rect.top, 0, h)
      }
      lastMove = performance.now()
    }
    const onUp = () => {
      pressed = false
      lastMove = performance.now()
    }
    const onLeave = () => {
      lastMove = -10_000
    }
    const onResize = () => {
      measure()
      x = clamp(x, 0, w)
      y = clamp(y, 0, h)
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? true
            if (visible) start()
            else stop()
          })
    observer?.observe(section)
    const fit = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize)
    fit?.observe(content)
    fit?.observe(zone)

    // Долгое нажатие пальцем — это жест «ближе», а не системное меню картинки или текста
    const coarse = window.matchMedia('(pointer: coarse)')
    const onMenu = (event: Event) => {
      if (coarse.matches && !(event.target as HTMLElement).closest('a, button')) {
        event.preventDefault()
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    section.addEventListener('contextmenu', onMenu)
    section.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize)
    start()

    return () => {
      stop()
      observer?.disconnect()
      fit?.disconnect()
      window.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerdown', onDown)
      section.removeEventListener('contextmenu', onMenu)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [reduced])

  const { hero } = BEAUTY_PAGE

  return (
    <section
      ref={sectionRef}
      data-live="true"
      className="dir-beauty-hero relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#000000] px-6 pb-16 pt-[5.25rem] md:flex-row md:items-end md:px-10 md:pb-24 md:pt-28 lg:px-20"
    >
      <div ref={stageRef} aria-hidden="true" className="dir-beauty-stage absolute inset-0 z-0">
        {/* Расфокус: тот же кадр, размытый и притушенный; один статичный слой */}
        <div className="dir-beauty-base absolute inset-0">
          <div className="dir-beauty-base-blur absolute inset-0">
            <Plate frame={frame} priority sizes="100vw" />
          </div>
        </div>
        <span className="dir-beauty-bloom" />
        <span className="dir-beauty-scrim" />

        <div ref={lensRef} className="dir-beauty-lens">
          <div ref={innerRef} className="dir-beauty-lens-inner">
            <Plate frame={frame} sizes="100vw" />
          </div>
          <span className="dir-beauty-lens-glint" />
          <span className="dir-beauty-lens-rim" />
          <span className="dir-beauty-lens-badge dir-kit-meta font-mono uppercase tabular-nums">
            Макро <span ref={badgeRef}>×3.0</span>
          </span>
        </div>
        <div
          ref={tagRef}
          className="dir-beauty-lens-tag dir-kit-meta font-mono uppercase tabular-nums"
        >
          <span className="dir-beauty-lens-tag-line" />
          Макро <span ref={readoutRef}>×3.0</span>
        </div>

        <span className="dir-beauty-veil" />
        <span className="dir-beauty-sweep" />
      </div>

      {/* Свободное место для линзы на телефоне: растёт вместе с экраном, но не меньше 7,25 rem */}
      <div ref={zoneRef} aria-hidden="true" className="dir-beauty-zone md:hidden" />

      <div ref={contentRef} className="dir-beauty-copy relative z-10 w-full">
        <p
          style={delay(140)}
          className="dir-beauty-rise dir-beauty-kicker dir-kit-meta font-mono uppercase text-white/70"
        >
          <span aria-hidden="true" className="dir-beauty-kicker-dash bg-accent" />
          <span className="[text-wrap:balance]">
            {hero.kicker.split(' · ').map((part, position, parts) => (
              <span key={part}>
                {position > 0 ? ' ' : null}
                <span className="whitespace-nowrap">
                  {typo(part)}
                  {position < parts.length - 1 ? ' ·' : null}
                </span>
              </span>
            ))}
          </span>
        </p>

        {/* H1 — только название: лид лежит отдельным абзацем и не попадает в заголовок */}
        <h1 className="dir-beauty-h1 font-stage uppercase text-white">
          <span
            style={delay(200)}
            className="dir-beauty-focus dir-beauty-title block w-min leading-[0.86] tracking-[-0.01em]"
          >
            Beauty<span className="text-accent">-</span>
            {/* Без <wbr> Blink не рвёт строку после дефиса, стоящего в своём span */}
            <wbr />
            видео
          </span>
        </h1>

        <p
          style={delay(520)}
          className="dir-beauty-rise dir-beauty-sub max-w-[30rem] font-light text-white/85 [text-wrap:balance]"
        >
          {typo(hero.sub)}
        </p>

        <p
          style={delay(640)}
          className="dir-beauty-rise dir-beauty-lede max-w-[34rem] text-white/70 [text-wrap:pretty]"
        >
          {typo(hero.lede)}
        </p>

        <div
          style={delay(760)}
          data-sticky-hide=""
          className="dir-beauty-rise dir-beauty-actions flex flex-col gap-x-8 gap-y-2 sm:flex-row sm:items-center"
        >
          <DirectionButton
            label={BEAUTY_PAGE.ctaLabel}
            onClick={() => page.openBrief('hero')}
            className="w-full sm:w-auto"
          />

          {hasWorks ? (
            <a href="#beauty-works" className="dir-beauty-link dir-kit-meta font-mono uppercase">
              Смотреть работы
              <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>

        {/* Подсказка жеста: глагол белым, остальное тише; одна строка */}
        <p
          style={delay(900)}
          className="dir-beauty-rise dir-beauty-hint dir-beauty-hero-hint font-mono uppercase"
        >
          <span className="dir-beauty-hint-pointer">
            <span className="dir-beauty-hint-key">Ведите курсором</span> — линза следует ·
            удерживайте — ближе
          </span>
          <span className="dir-beauty-hint-touch">
            <span className="dir-beauty-hint-key">Удерживайте</span> — ближе · линза плывёт сама
          </span>
        </p>
      </div>

      {/* Указатель прокрутки: линия с бегущей точкой, только там, где есть место */}
      <div aria-hidden="true" className="dir-beauty-cue dir-kit-meta font-mono uppercase">
        <span className="dir-beauty-cue-line">
          <span className="dir-beauty-cue-dot" />
        </span>
        Наезд
      </div>

      {/* Линейка по нижней кромке: начало шкалы, которую продолжает следующая секция */}
      <span aria-hidden="true" className="dir-beauty-hero-ruler" />
    </section>
  )
}

/* ─────────────────────────────── 2. Наезд (sticky) ───────────────────────────── */

const ZOOM_WORDS = BEAUTY_PAGE.words
/** Доля скролла, за которую круг раскрывается до кадра; остаток — выдержка на полном кадре */
const ZOOM_OPEN = 0.82
/** Конечный радиус круга в долях диагонали сцены: круг выходит за края кадра */
const ZOOM_FULL = 0.56

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

function Zoom({ frame }: { frame: Frame }) {
  const ref = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const calm = useCalm()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // Размер сцены нужен кругу в пикселях, чтобы линия кольца и обрезка кадра совпадали
  const vmin = useMotionValue(900)
  const diag = useMotionValue(1700)
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const { width, height } = stage.getBoundingClientRect()
      vmin.set(Math.min(width, height))
      diag.set(Math.hypot(width, height))
      // Слой «опоры диска» нарисован сразу на полный радиус и только масштабируется
      stage.style.setProperty('--zr', `${(Math.hypot(width, height) * ZOOM_FULL).toFixed(0)}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [vmin, diag])

  const radius = useTransform(
    [scrollYProgress, vmin, diag, calm.value],
    ([p, vm, dg, still]: number[]) => {
      const from = (vm ?? 900) * 0.16
      const to = (dg ?? 1700) * ZOOM_FULL
      return still ? to : from + (to - from) * easeInOut(clamp((p ?? 0) / ZOOM_OPEN, 0, 1))
    }
  )
  const ringOuter = useTransform(radius, value => value + 14)
  // Собственная «опора» диска: светлая кромка, блик и подъём чёрного не зависят от кадра.
  // Слой нарисован на полный радиус, а масштабируется transform — композитно, без перерисовки
  const lit = useTransform([radius, diag], ([r, dg]: number[]) =>
    clamp((r ?? 0) / ((dg ?? 1700) * ZOOM_FULL), 0.05, 1)
  )
  // К концу наезда диск вырос до кадра: подъём чёрного уходит, кадр остаётся собой
  const litFade = useTransform(scrollYProgress, [0, ZOOM_OPEN, 1], [1, 0.5, 0.5])
  const dash = useTransform(scrollYProgress, value => value * -360)
  const clip = useMotionTemplate`circle(${radius}px at 50% 50%)`
  const scale = useTransform([scrollYProgress, calm.value], ([p, still]: number[]) =>
    still ? 1 : 1.9 - 0.9 * clamp((p ?? 0) / ZOOM_OPEN, 0, 1)
  )

  const last = ZOOM_WORDS.length - 1
  const [word, setWord] = useState(0)
  const [scrolled, setScrolled] = useState(MACRO_MAX)
  useMotionValueEvent(scrollYProgress, 'change', value => {
    const open = clamp(value / ZOOM_OPEN, 0, 1)
    setWord(Math.min(last, Math.floor(open * ZOOM_WORDS.length)))
    setScrolled(MACRO_MAX - Math.round(open * (MACRO_MAX - 1)))
  })
  // Без движения сцена стоит на полном кадре: кратность ×1, все слова списком
  const level = calm.on ? 1 : scrolled

  return (
    <section
      ref={ref}
      aria-labelledby="beauty-zoom-title"
      className="dir-beauty-zoom relative bg-[#000000]"
    >
      <h2 id="beauty-zoom-title" className="sr-only">
        Наезд на продукт: текстура, свет, кожа, вода
      </h2>
      <div ref={stageRef} data-sticky-hide="desktop" className="dir-beauty-zoom-stage">
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.16]">
          <Plate frame={frame} x={50} y={50} />
        </div>

        <motion.div aria-hidden="true" style={{ clipPath: clip }} className="absolute inset-0">
          <motion.div style={{ scale }} className="h-full w-full">
            <Plate frame={frame} x={50} y={50} />
          </motion.div>
          <span className="dir-beauty-zoom-veil" />
          <motion.span style={{ opacity: litFade }} className="dir-beauty-zoom-lift">
            <motion.span style={{ scale: lit }} className="dir-beauty-zoom-lit" />
          </motion.span>
          <span className="dir-beauty-zoom-grain" />
        </motion.div>

        <span aria-hidden="true" className="dir-beauty-zoom-scrim" />

        <svg aria-hidden="true" className="dir-beauty-zoom-ring" focusable="false">
          <motion.circle cx="50%" cy="50%" r={radius} className="dir-beauty-zoom-ring-line" />
          <motion.circle
            cx="50%"
            cy="50%"
            r={ringOuter}
            strokeDashoffset={dash}
            className="dir-beauty-zoom-ring-dash"
          />
        </svg>

        <div className="dir-beauty-zoom-ui">
          <div className="flex items-start justify-between gap-6">
            <p aria-hidden="true" className={KIT_KICKER}>
              <span className="h-px w-8 bg-accent" />
              04 / Наезд
            </p>
            <p
              aria-hidden="true"
              className="dir-beauty-zoom-mobile-level dir-kit-meta font-mono uppercase tabular-nums"
            >
              Макро ×{level}
            </p>
            <ol
              aria-hidden="true"
              className="dir-beauty-zoom-steps dir-kit-meta font-mono uppercase"
            >
              {ZOOM_WORDS.map((item, index) => (
                <li key={item.word} data-state={index === word ? 'on' : 'off'}>
                  <span className="tabular-nums">{pad(index + 1)}</span> {item.word}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-end justify-between gap-6">
            <div>
              {/* Слова лежат в разметке все: скринридер читает список, глаз видит одно слово за раз */}
              <ul role="list" className="dir-beauty-zoom-copy">
                {ZOOM_WORDS.map((item, index) => (
                  <li
                    key={item.word}
                    data-pos={index < word ? 'past' : index === word ? 'now' : 'next'}
                    className="dir-beauty-zoom-item"
                  >
                    <span className="dir-beauty-zoom-wordclip">
                      <span className="dir-beauty-zoom-word font-stage uppercase">{item.word}</span>
                    </span>
                    <span className="dir-beauty-zoom-noteclip">
                      <span className="dir-beauty-zoom-note">{typo(item.note)}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div aria-hidden="true" className="dir-beauty-zoom-bar">
                {ZOOM_WORDS.map((item, index) => (
                  <span key={item.word} data-on={index <= word} />
                ))}
              </div>
            </div>

            <div aria-hidden="true" className="dir-beauty-zoom-readout">
              <p className="dir-kit-meta font-mono uppercase text-white/85">Макро</p>
              <p className="font-brand-hero tabular-nums leading-[0.82] tracking-[-0.04em] text-white">
                <span key={level}>×{level}</span>
              </p>
              <ul className="dir-beauty-zoom-ticks">
                {Array.from({ length: MACRO_MAX }, (_, index) => (
                  <li key={index} data-on={MACRO_MAX - index === level} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────── Склейка: шкала крупности ─────────────────────────── */

/**
 * Линейка между секциями. Красная линия по ней идёт за скроллом, а отметка
 * справа считает крупность ×1…×8: переход между сценами — это смена кратности.
 * Перед финалом (reverse) линия бежит справа налево, а кратность падает до ×1:
 * камера отъезжает к общему плану, и страница возвращается к соседним направлениям.
 */
function Seam({ label, reverse = false }: { label: string; reverse?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 92%', 'end 40%'] })
  const [level, setLevel] = useState(reverse ? MACRO_MAX : 1)
  useMotionValueEvent(scrollYProgress, 'change', value => {
    const steps = Math.round(value * (MACRO_MAX - 1))
    setLevel(clamp(reverse ? MACRO_MAX - steps : 1 + steps, 1, MACRO_MAX))
  })

  return (
    <div ref={ref} aria-hidden="true" data-reverse={reverse} className="dir-beauty-seam relative">
      <div className="dir-beauty-seam-row dir-kit-meta font-mono uppercase">
        <span>{label}</span>
        <span className="tabular-nums">Макро ×{level}</span>
      </div>
      <div className="dir-beauty-seam-ruler">
        <motion.span className="dir-beauty-seam-fill" style={{ scaleX: scrollYProgress }} />
      </div>
    </div>
  )
}

/* ───────────────────────── 3. Материалы: видоискатель и строки ─────────────────────── */

/** Точка фокуса кадра в видоискателе для каждого материала */
const FOCUS: { x: number; y: number }[] = [
  { x: 62, y: 38 },
  { x: 36, y: 46 },
  { x: 54, y: 66 },
  { x: 70, y: 56 },
]

function Viewer({
  materials,
  frames,
  active,
}: {
  materials: BeautyMaterial[]
  frames: Frame[]
  active: number
}) {
  const reduced = useReducedMotion()
  const markRef = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  // Отметка «×1 → ×N» считается от единицы каждый раз, когда кадр меняется:
  // видно, как объектив подходит ближе, а не просто выбирает другой план
  useEffect(() => {
    const node = markRef.current
    const target = materials[active]?.macro ?? 1
    if (!node) return
    if (first.current || reduced) {
      first.current = false
      node.textContent = `×${target}`
      return
    }
    const began = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = clamp((now - began) / 900, 0, 1)
      const eased = 1 - (1 - t) ** 3
      node.textContent = `×${Math.round(1 + (target - 1) * eased)}`
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [active, materials, reduced])

  return (
    <div className="dir-beauty-viewer" role="presentation" aria-hidden="true">
      {materials.map((material, index) => {
        const focus = FOCUS[index % FOCUS.length] ?? { x: 50, y: 50 }
        const zoom = 1.12 + (material.macro - 1) * 0.07
        return (
          <div
            key={material.index}
            data-on={index === active}
            className="dir-beauty-layer"
            style={
              {
                '--fx': `${focus.x}%`,
                '--fy': `${focus.y}%`,
                '--zoom': zoom,
              } as CSSProperties
            }
          >
            <div className="dir-beauty-layer-img">
              <Plate
                frame={frames[index] ?? null}
                x={focus.x}
                y={focus.y}
                sizes="(min-width: 1024px) 42vw, 100vw"
                quality={65}
              />
            </div>
            <span className="dir-beauty-focus-point">
              <span className="dir-beauty-focus-ring" />
              <span className="dir-beauty-focus-dot" />
            </span>
          </div>
        )
      })}

      <span className="dir-beauty-viewer-shade" />
      <span className="dir-beauty-corner" data-at="tl" />
      <span className="dir-beauty-corner" data-at="tr" />
      <span className="dir-beauty-corner" data-at="bl" />
      <span className="dir-beauty-corner" data-at="br" />

      <p className="dir-beauty-viewer-top dir-kit-meta font-mono uppercase tabular-nums">
        <span>
          {pad(active + 1)} / {pad(materials.length)}
        </span>
        <span>{materials[active]?.tag}</span>
      </p>
      <p className="dir-beauty-viewer-bottom dir-kit-meta font-mono uppercase tabular-nums">
        <span>
          Макро <span ref={markRef}>×{materials[0]?.macro ?? 1}</span>
        </span>
        <span className="dir-beauty-viewer-pips">
          {materials.map((material, index) => (
            <span key={material.index} data-on={index === active} />
          ))}
        </span>
      </p>
    </div>
  )
}

function Materials({ frames }: { frames: Frame[] }) {
  const materials = BEAUTY_PAGE.materials
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLOListElement>(null)

  // Кадр следует за чтением: активна строка, которая проходит полосу экрана.
  // Та же механика работает и без курсора, на телефоне; наведение её дополняет
  useEffect(() => {
    const list = listRef.current
    if (!list || typeof IntersectionObserver === 'undefined') return
    const wide = window.matchMedia('(min-width: 1024px)')
    let observer: IntersectionObserver | null = null

    const connect = () => {
      observer?.disconnect()
      const rows = list.querySelectorAll<HTMLElement>('[data-material]')
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index))
          }
        },
        { rootMargin: wide.matches ? '-44% 0px -44% 0px' : '-60% 0px -30% 0px' }
      )
      rows.forEach(row => observer?.observe(row))
    }

    connect()
    wide.addEventListener('change', connect)
    return () => {
      wide.removeEventListener('change', connect)
      observer?.disconnect()
    }
  }, [])

  const hover = (index: number) => (event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse') setActive(index)
  }

  return (
    <section
      aria-labelledby="beauty-materials-title"
      className="dir-beauty-materials relative border-t border-white/10 bg-[#000000] px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24 lg:px-20"
    >
      <p className={KIT_KICKER}>
        <span aria-hidden="true" className="h-px w-8 bg-accent" />
        05 / Материалы 01–04
      </p>
      <h2
        id="beauty-materials-title"
        data-reveal=""
        className="mt-5 max-w-[16ch] font-stage text-[clamp(2rem,5.4vw,4.75rem)] uppercase leading-[0.92] tracking-[-0.03em] text-white text-balance"
      >
        {setTitle('Пять материалов крупного плана')}
      </h2>

      <div className="mt-12 lg:mt-16 lg:grid lg:grid-cols-12 lg:gap-x-12">
        <div className="dir-beauty-viewer-wrap lg:col-span-5">
          <Viewer materials={materials} frames={frames} active={active} />
        </div>

        <ol ref={listRef} role="list" className="mt-2 lg:col-span-7 lg:col-start-6 lg:mt-0">
          {materials.map((material, index) => (
            <li
              key={material.index}
              data-material=""
              data-index={index}
              data-on={index === active}
              onPointerEnter={hover(index)}
              className="dir-beauty-row"
            >
              <span className="dir-beauty-row-line" aria-hidden="true" />
              <div className="dir-beauty-row-head dir-kit-meta font-mono uppercase tabular-nums">
                <span className="dir-beauty-row-idx">{material.index}</span>
                <span className="dir-beauty-row-tag">
                  {material.tag} · макро ×{material.macro}
                </span>
              </div>
              <h3 className="dir-beauty-row-title font-stage text-[clamp(1.6rem,3.6vw,3.25rem)] uppercase leading-[0.95] tracking-[-0.025em] text-balance">
                {typo(material.title)}
              </h3>
              <p className="dir-beauty-row-text max-w-[34rem] text-[0.9375rem] leading-[1.65] [text-wrap:pretty] md:text-base">
                {typo(material.text)}
              </p>
              {/* Линейка крупности вместо гигантского номера за текстом: красная линия доходит до отметки кадра */}
              <span
                aria-hidden="true"
                style={{ '--m': material.macro / MACRO_MAX } as CSSProperties}
                className="dir-beauty-row-scale"
              >
                <span className="dir-beauty-row-scale-ruler">
                  <span className="dir-beauty-row-scale-fill" />
                </span>
                <span className="dir-beauty-row-scale-ends dir-kit-meta font-mono tabular-nums">
                  <span>×1</span>
                  <span>×{MACRO_MAX}</span>
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ─────────────────────────── 4. Предмет: световой объект и орбита света ──────────────────────── */

const pad3 = (value: number) => String(value).padStart(3, '0')

/**
 * Предмета на сцене нет: в рамке видоискателя стоит абстрактный световой объект,
 * а подпись «Ваш продукт» говорит, чьё это место. Свет обходит объект по орбите.
 * Угол света — в градусах по часовой от верха: совпадает с началом конического
 * градиента кромки, поэтому блик и терминатор идут ровно туда, куда смотрит точка
 * на орбите. Под сценой линейка 000°…360°: красная линия и цифры ведёт тот же угол.
 */
function ObjectScene() {
  const scene = BEAUTY_PAGE.object
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const vesselRef = useRef<HTMLDivElement>(null)
  const rimRef = useRef<HTMLSpanElement>(null)
  const litRef = useRef<HTMLSpanElement>(null)
  const specRef = useRef<HTMLSpanElement>(null)
  const haloRef = useRef<HTMLSpanElement>(null)
  const orbitRef = useRef<HTMLSpanElement>(null)
  const dotRef = useRef<HTMLSpanElement>(null)
  const floorRef = useRef<HTMLSpanElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)

  useLive(sectionRef)

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const vessel = vesselRef.current
    const rim = rimRef.current
    const lit = litRef.current
    const spec = specRef.current
    const halo = haloRef.current
    const orbit = orbitRef.current
    const dot = dotRef.current
    const floor = floorRef.current
    const readout = readoutRef.current
    const fill = fillRef.current
    if (
      !section ||
      !stage ||
      !vessel ||
      !rim ||
      !lit ||
      !spec ||
      !halo ||
      !orbit ||
      !dot ||
      !floor ||
      !readout ||
      !fill
    ) {
      return
    }

    // Выноски рисуются, когда сцена показалась: до этого линии убраны, после — на месте
    stage.dataset.armed = 'true'
    const reveal =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              if (!entry?.isIntersecting) return
              stage.dataset.in = 'true'
              reveal?.disconnect()
            },
            { threshold: 0.4 }
          )
    if (reveal) reveal.observe(stage)
    else stage.dataset.in = 'true'

    let angle = 38
    let target = 38
    let lastMove = -10_000
    let rx = 1
    let ry = 1
    let unit = 1
    let raf = 0
    let last = 0
    let visible = true
    let shown = ''

    const measure = () => {
      const ring = orbit.getBoundingClientRect()
      rx = ring.width / 2
      ry = ring.height / 2
      unit = vessel.getBoundingClientRect().width
    }

    const paint = () => {
      const rad = (angle * Math.PI) / 180
      const dx = Math.sin(rad)
      const dy = -Math.cos(rad)
      rim.style.transform = `translate(-50%, -50%) rotate(${angle.toFixed(2)}deg)`
      dot.style.transform = `translate3d(${(dx * rx).toFixed(1)}px, ${(dy * ry).toFixed(1)}px, 0)`
      // Свет ложится на освещённую сторону шара, блик идёт к кромке и лежит вдоль неё
      lit.style.transform = `translate3d(${(dx * unit * 0.34).toFixed(1)}px, ${(dy * unit * 0.34).toFixed(1)}px, 0)`
      spec.style.transform = `translate3d(${(dx * unit * 0.3).toFixed(1)}px, ${(dy * unit * 0.3).toFixed(1)}px, 0) rotate(${angle.toFixed(1)}deg)`
      halo.style.transform = `translate3d(${(dx * unit * 0.9).toFixed(1)}px, ${(dy * unit * 1.1).toFixed(1)}px, 0)`
      // Пятно света на столе уходит от источника
      floor.style.transform = `translate3d(${(-dx * unit * 0.5).toFixed(1)}px, 0, 0) scaleX(${(1 + Math.abs(dx) * 0.25).toFixed(3)})`
      const turn = ((angle % 360) + 360) % 360
      fill.style.transform = `scaleX(${(turn / 360).toFixed(4)})`
      const text = `${pad3(Math.round(turn) % 360)}°`
      if (text !== shown) {
        shown = text
        readout.textContent = text
      }
    }

    if (reduced) {
      measure()
      paint()
      const onResize = () => {
        measure()
        paint()
      }
      window.addEventListener('resize', onResize)
      return () => {
        reveal?.disconnect()
        window.removeEventListener('resize', onResize)
      }
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(64, now - (last || now))
      last = now
      if (now - lastMove > 2600) {
        // Без ввода свет делает полный круг за тридцать секунд
        target += dt * 0.012
      }
      const diff = ((((target - angle) % 360) + 540) % 360) - 180
      angle += diff * (1 - Math.exp(-dt / 180))
      paint()
    }

    const start = () => {
      if (raf || !visible) return
      last = 0
      measure()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const onMove = (event: PointerEvent) => {
      // Центр читаем заново: между движениями страница успевает проскроллиться
      const rect = vessel.getBoundingClientRect()
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      if (dx === 0 && dy === 0) return
      target = (Math.atan2(dx, -dy) * 180) / Math.PI
      lastMove = performance.now()
    }
    const onLeave = () => {
      lastMove = -10_000
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? true
            if (visible) start()
            else stop()
          })
    observer?.observe(section)

    section.addEventListener('pointermove', onMove, { passive: true })
    section.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', measure)
    start()

    return () => {
      stop()
      reveal?.disconnect()
      observer?.disconnect()
      section.removeEventListener('pointermove', onMove)
      section.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', measure)
    }
  }, [reduced])

  return (
    <section
      ref={sectionRef}
      data-live="true"
      aria-labelledby="beauty-object-title"
      className="dir-beauty-object relative isolate overflow-hidden px-6 py-16 md:px-10 md:py-20 lg:px-20"
    >
      {/* Абзац стоит наверху, рядом с заголовком: справа снизу экрана живёт плавающая кнопка.
          Две колонки только от xl: на 768–1279 крупный заголовок не помещается рядом с абзацем */}
      <div className="relative z-10 grid gap-x-16 gap-y-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] xl:items-end">
        <div>
          <p className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            06 / Предмет · материал {scene.index}
          </p>
          <h2
            id="beauty-object-title"
            data-reveal=""
            className="mt-5 font-stage text-[clamp(2rem,5.4vw,4.75rem)] uppercase leading-[0.92] tracking-[-0.03em] text-white text-balance"
          >
            {setTitle(scene.title)}
          </h2>
        </div>
        <p
          data-reveal=""
          style={{ '--reveal-delay': '90ms' } as CSSProperties}
          className="max-w-[27rem] text-base leading-[1.65] text-white/80 [text-wrap:pretty] md:text-lg xl:pb-2"
        >
          {typo(scene.text)}
        </p>
      </div>

      <div ref={stageRef} className="dir-beauty-object-stage">
        <span ref={haloRef} aria-hidden="true" className="dir-beauty-halo" />
        <span ref={orbitRef} aria-hidden="true" className="dir-beauty-orbit">
          <span ref={dotRef} className="dir-beauty-orbit-dot" />
        </span>

        <div ref={vesselRef} aria-hidden="true" className="dir-beauty-orb-wrap">
          <span className="dir-beauty-orb">
            <span ref={rimRef} className="dir-beauty-orb-rim" />
            <span className="dir-beauty-orb-fill">
              <span ref={litRef} className="dir-beauty-orb-lit" />
              <span ref={specRef} className="dir-beauty-orb-spec" />
            </span>
          </span>
          {(['tl', 'tr', 'bl', 'br'] as const).map(at => (
            <span key={at} className="dir-beauty-orb-corner" data-at={at} />
          ))}
          <span className="dir-beauty-orb-caption dir-kit-meta font-mono uppercase">
            {scene.caption}
          </span>
        </div>
        <span ref={floorRef} aria-hidden="true" className="dir-beauty-floor" />

        {scene.marks.map((mark, index) => (
          <span
            key={mark}
            aria-hidden="true"
            data-side={index % 2 === 0 ? 'l' : 'r'}
            data-row={Math.floor(index / 2)}
            className="dir-beauty-callout dir-kit-meta font-mono uppercase"
          >
            <span className="tabular-nums">{pad(index + 1)}</span>
            <span className="dir-beauty-callout-text">{mark}</span>
            <span className="dir-beauty-callout-line" />
          </span>
        ))}
      </div>

      {/* Линейка угла света вместо призрачного слова за предметом */}
      <div aria-hidden="true" data-sticky-hide="desktop" className="dir-beauty-object-scale">
        <p className="dir-beauty-object-scale-row dir-kit-meta font-mono uppercase tabular-nums">
          <span>
            Свет{' '}
            <span ref={readoutRef} className="text-white">
              038°
            </span>
          </span>
          <span className="dir-beauty-hint dir-beauty-object-hint">
            <span className="dir-beauty-hint-pointer">Ведите курсором — свет идёт следом</span>
            <span className="dir-beauty-hint-touch">Свет обходит предмет сам</span>
          </span>
        </p>
        <div className="dir-beauty-object-ruler">
          <span ref={fillRef} className="dir-beauty-object-ruler-fill" />
        </div>
        <p className="dir-beauty-object-ruler-ends dir-kit-meta font-mono tabular-nums">
          <span>000°</span>
          <span>090°</span>
          <span>180°</span>
          <span>270°</span>
          <span>360°</span>
        </p>
      </div>

      {/* На телефоне выносок нет места: те же слова строкой; скринридеру список нужен везде */}
      <ul className="dir-beauty-marks dir-kit-meta font-mono uppercase" aria-label="Что в кадре">
        {scene.marks.map(mark => (
          <li key={mark}>{mark}</li>
        ))}
      </ul>
    </section>
  )
}

/* ───────────────────────────────── CTA после работ ─────────────────────────────── */

function ProofCta({ frame }: { frame: Frame }) {
  const page = useDirectionPage()
  const ref = useRef<HTMLElement>(null)
  const [hot, setHot] = useState(false)
  const cta = BEAUTY_PAGE.proofCta
  useLive(ref)

  return (
    <section
      ref={ref}
      data-live="true"
      data-hot={hot}
      aria-labelledby="beauty-proof-cta-title"
      className="dir-beauty-proof relative isolate overflow-hidden border-t border-white/10 bg-[#000000] px-6 pb-[calc(var(--pd)*0.8+2.5rem)] pt-24 md:px-10 md:pt-32 lg:px-20 lg:pb-32"
    >
      <div aria-hidden="true" className="dir-beauty-proof-lens">
        <div className="dir-beauty-proof-disc">
          <div className="dir-beauty-proof-frame">
            <Plate
              frame={frame}
              x={58}
              y={40}
              sizes="(min-width: 1024px) 34rem, 80vw"
              quality={65}
            />
          </div>
          <span className="dir-beauty-proof-veil" />
          <span className="dir-beauty-proof-lit" />
          <span className="dir-beauty-proof-glint" />
          <span className="dir-beauty-proof-grain" />
        </div>
        <span className="dir-beauty-proof-ring" />
        <span className="dir-beauty-proof-dash" />
        <p className="dir-beauty-proof-mark dir-kit-meta font-mono uppercase tabular-nums">
          Макро ×{MACRO_MAX}
        </p>
      </div>

      {/* Колонка не заходит под диск: ширина экрана минус диск, его отступ и поля */}
      <div className="relative z-10 max-w-[38rem] lg:max-w-[min(46rem,calc(100vw-min(40rem,42vw)-5vw-9rem))]">
        <p className={KIT_KICKER}>
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          {cta.kicker}
        </p>
        <h2
          id="beauty-proof-cta-title"
          data-reveal=""
          className="mt-6 font-stage text-[clamp(2.1rem,5vw,4.5rem)] uppercase leading-[0.94] tracking-[-0.03em] text-white text-balance"
        >
          {setTitle(cta.title)}
        </h2>
        <p
          data-reveal=""
          style={{ '--reveal-delay': '90ms' } as CSSProperties}
          className="mt-6 max-w-[30rem] text-base leading-[1.65] text-white/75 [text-wrap:pretty] md:text-lg"
        >
          {typo(cta.text)}
        </p>
        {/* Обёртка ловит наведение и фокус: диск «загорается» вместе с кнопкой */}
        <div
          data-sticky-hide=""
          onPointerEnter={() => setHot(true)}
          onPointerLeave={() => setHot(false)}
          onFocus={() => setHot(true)}
          onBlur={() => setHot(false)}
          className="mt-9 w-fit"
        >
          <DirectionButton label={cta.label} onClick={() => page.openBrief('proof')} />
        </div>
      </div>
    </section>
  )
}

/* ──────────────────────────── Процесс: шкала крупности ×1…×5 ──────────────────────────── */

/** Формат версии: один и тот же кадр, по-разному скадрированный */
function Format({ frame, ratio, tag }: { frame: Frame; ratio: '9:16' | '16:9'; tag: string }) {
  return (
    <div aria-hidden="true" data-ratio={ratio} className="dir-beauty-format">
      <span className="dir-beauty-format-frame">
        <span className="absolute inset-0 block">
          <Plate frame={frame} x={58} y={40} sizes="10rem" quality={50} />
        </span>
        <span className="dir-beauty-format-shade" />
      </span>
      <span className="dir-beauty-format-cap dir-kit-meta font-mono uppercase tabular-nums">
        {ratio}
        <span>{tag}</span>
      </span>
    </div>
  )
}

/**
 * Шаги как наезд: цифра шага — это кратность, ×1 → ×5, и каждая следующая
 * крупнее предыдущей. На широком экране шаги стоят в ряд «лестницей», на
 * телефоне — столбцом вдоль вертикальной линейки; красная линия идёт за
 * скроллом и зажигает шаг, до которого дошла. Без движения все шаги горят.
 */
function Process({
  title,
  lead,
  steps,
  frame,
}: {
  title: string
  lead: string
  steps: ProcessStep[]
  frame: Frame
}) {
  const calm = useCalm()
  const listRef = useRef<HTMLDivElement>(null)
  // Положение каждого маркера вдоль шкалы, доля 0…1: меряем при изменении размера, не на скролле
  const marks = useRef<number[]>([])
  // -1 — линия ещё не дошла до первого шага
  const [active, setActive] = useState(-1)
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 72%', 'end 58%'] })

  const activeAt = useCallback((progress: number) => {
    if (progress <= 0) return -1
    let found = 0
    marks.current.forEach((mark, position) => {
      if (mark <= progress) found = position
    })
    return found
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', value => setActive(activeAt(value)))

  useEffect(() => {
    const list = listRef.current
    if (!list || typeof ResizeObserver === 'undefined') return
    const wide = window.matchMedia('(min-width: 80rem)')
    const measure = () => {
      const nodes = list.querySelectorAll<HTMLElement>('[data-step]')
      const row = wide.matches
      const size = Math.max(1, row ? list.offsetWidth : list.offsetHeight)
      // Маркер стоит у левой кромки шага в ряду и на 28px ниже верхней кромки в столбце
      marks.current = Array.from(nodes, node =>
        row ? node.offsetLeft / size : (node.offsetTop + 28) / size
      )
      setActive(activeAt(scrollYProgress.get()))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    wide.addEventListener('change', measure)
    return () => {
      observer.disconnect()
      wide.removeEventListener('change', measure)
    }
  }, [activeAt, scrollYProgress])

  const current = calm.on ? steps.length : active
  const stateOf = (position: number) =>
    position < current ? 'done' : position === current ? 'active' : 'todo'

  return (
    <section
      aria-labelledby="beauty-process-title"
      className="dir-beauty-process relative isolate overflow-hidden border-t border-white/10 bg-[#0d0d0d] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <span aria-hidden="true" className="dir-beauty-process-rings" />

      <div className="relative max-w-3xl">
        <p className={KIT_KICKER}>
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          08 / Процесс
        </p>
        <h2
          id="beauty-process-title"
          data-reveal=""
          className={`${KIT_TITLE} ${KIT_TITLE_SIZE} mt-5`}
        >
          {setTitle(title)}
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 [text-wrap:pretty] md:text-lg">
          {typo(lead)}
        </p>
      </div>

      <div ref={listRef} data-calm={calm.on} className="dir-beauty-steps relative mt-14 md:mt-20">
        <span aria-hidden="true" className="dir-beauty-steps-rail" data-axis="y">
          <motion.span className="dir-beauty-steps-fill" style={{ scaleY: scrollYProgress }} />
        </span>
        <span aria-hidden="true" className="dir-beauty-steps-rail" data-axis="x">
          <motion.span className="dir-beauty-steps-fill" style={{ scaleX: scrollYProgress }} />
        </span>

        <ol role="list" className="dir-beauty-steps-list">
          {steps.map((step, index) => (
            <li
              key={step.number}
              data-step=""
              data-state={stateOf(index)}
              style={{ '--i': index } as CSSProperties}
              className="dir-beauty-step"
            >
              <span aria-hidden="true" className="dir-beauty-step-num font-brand-hero tabular-nums">
                ×{index + 1}
              </span>
              <span aria-hidden="true" className="dir-beauty-step-node" />
              <div className="dir-beauty-step-body">
                <p className="dir-beauty-step-label dir-kit-meta font-mono uppercase tabular-nums">
                  Шаг {step.number}
                </p>
                <h3 className="dir-beauty-step-title font-stage uppercase">{typo(step.title)}</h3>
                <p className="dir-beauty-step-text">{typo(step.text)}</p>
                {/* Шаг про версии показывает их: вертикаль и горизонталь из одного кадра */}
                {/верси/i.test(step.title) ? (
                  <div aria-hidden="true" className="dir-beauty-formats">
                    <Format frame={frame} ratio="9:16" tag="Вертикаль" />
                    <Format frame={frame} ratio="16:9" tag="Горизонталь" />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ───────────────────────────────── Вопросы: прицел сбоку ─────────────────────────────── */

// Набор применяется на выходе: разметка FAQPage строится из исходных строк, без неразрывных пробелов
const FAQ_ITEMS: FaqItem[] = BEAUTY_PAGE.faq.map(item => ({
  question: typo(item.question),
  answer: typo(item.answer),
}))

/**
 * Аккордеон кита стоит как есть; в левой липкой колонке под заголовком, в слоте
 * aside, висит прицел: кольцо с делениями поворачивается за скроллом, кратность
 * растёт. Слот виден с lg и сам остаётся в колонке, поэтому прицел не заходит на
 * вопросы ни при какой высоте окна.
 */
function FaqBlock() {
  const calm = useCalm()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 35%'] })
  const turn = useTransform([scrollYProgress, calm.value], ([p, still]: number[]) =>
    still ? 0 : (p ?? 0) * 140
  )
  const [level, setLevel] = useState(1)
  useMotionValueEvent(scrollYProgress, 'change', value =>
    setLevel(clamp(Math.round(1 + value * (MACRO_MAX - 1)), 1, MACRO_MAX))
  )

  return (
    <div ref={ref} className="dir-beauty-faq relative">
      <DirectionFaq
        index="09"
        title="Вопросы о beauty-видео"
        items={FAQ_ITEMS}
        aside={
          <div aria-hidden="true" className="dir-beauty-faq-dial">
            <motion.span className="dir-beauty-faq-ticks" style={{ rotate: turn }} />
            <span className="dir-beauty-faq-ring" />
            <span className="dir-beauty-faq-cross" />
            <span className="dir-beauty-faq-glint" />
            <p className="dir-beauty-faq-mark dir-kit-meta font-mono uppercase tabular-nums">
              Макро ×{level}
            </p>
          </div>
        }
      />
    </div>
  )
}

/* ─────────────────────────────────── Знак финала ─────────────────────────────────── */

/**
 * Камера отъехала: на шкале ×1 прицел пуст и стоит ровно. Знак живёт в слоте
 * aside финала (декор, только от lg) и замыкает шкалу, которую страница начала
 * в hero.
 */
function EndSign() {
  return (
    <span className="dir-beauty-end-sign">
      <span className="dir-beauty-end-ring" />
      <span className="dir-beauty-end-cross" />
      <span className="dir-beauty-end-dot" />
      <span className="dir-beauty-end-label dir-kit-meta font-mono uppercase tabular-nums">
        Макро ×1 · общий план
      </span>
    </span>
  )
}

/* ──────────────────────────────────── Страница ─────────────────────────────────── */

/**
 * Набор кадров сцены. Сначала кадры, выбранные в раскадровке направления
 * (постеры работ), потом остальные кадры галерей по кругу: соседние секции
 * получают разные кадры, а не один и тот же постер.
 */
function sceneFrames(works: DirectionPageWork[]): SceneFrame[] {
  const seen = new Set<string>()
  const pool: SceneFrame[] = []
  const add = (frame: SceneFrame) => {
    if (seen.has(frame.src)) return
    seen.add(frame.src)
    pool.push(frame)
  }
  for (const work of works) {
    if (!work.posterUrl) continue
    add({
      key: `${work.slug}-poster`,
      src: work.posterUrl,
      slug: work.slug,
      client: work.client,
      title: work.title,
    })
  }
  interleaveFrames(works, 16).forEach(add)
  return pool
}

export function BeautyPage({ works }: BeautyPageProps) {
  const pool = sceneFrames(works)
  const hasWorks = works.length > 0
  const at = (index: number): Frame =>
    pool.length > 0 ? (pool[index % pool.length] ?? null) : null
  // Материалы берут кадры из второй половины набора: hero и наезд уже заняли первые
  const offset = pool.length >= 8 ? 4 : 0
  const materialFrames: Frame[] = BEAUTY_PAGE.materials.map((_, index) => at(offset + index))
  const closing = at(1)

  return (
    <DirectionShell
      id="beauty"
      stickyLabel={BEAUTY_PAGE.stickyLabel}
      className="dir-beauty min-h-screen bg-[#000000] pb-20 md:pb-0"
    >
      <Hero frame={at(0)} hasWorks={hasWorks} />
      <Zoom frame={at(3)} />
      <Seam label="Шкала крупности" />
      <Materials frames={materialFrames} />
      <ObjectScene />
      {/* Без работ «доказательства» нет: ни склейки, ни якоря «Смотреть работы» */}
      {hasWorks ? (
        <>
          <Seam label="Кадр — доказательство" />
          <div id="beauty-works" className="scroll-mt-0">
            <DirectionCredits
              index="07"
              title="Крупный план в работах"
              works={works}
              note="Beauty-работы студии"
            />
          </div>
        </>
      ) : null}
      <ProofCta frame={at(2)} />
      <Process
        title="От продукта до версий"
        lead="Пять шагов: что в продукте видит камера и как это превратить в ролик."
        steps={BEAUTY_PAGE.process}
        frame={at(5)}
      />
      <Seam label="Вопросы — в фокусе" />
      <FaqBlock />
      <Seam label="Отъезд — общий план" reverse />
      <div className="dir-beauty-others">
        <OtherDirections current="beauty" reading={DIRECTION_READING['beauty']} />
      </div>
      <DirectionEnd
        lines={BEAUTY_PAGE.end.lines}
        ctaLabel={BEAUTY_PAGE.ctaLabel}
        note={typo(BEAUTY_PAGE.end.note)}
        frame={closing ? { src: closing.src, alt: closing.client } : null}
        aside={<EndSign />}
      />
    </DirectionShell>
  )
}
