/**
 * /content-production — «МОНТАЖНЫЙ ЛИСТ».
 *
 * Метафора: съёмка как проект в монтажной программе. Один мастер-кадр режется
 * на выдачи, выдачи ложатся на линейку квартала, а руководитель маркетинга за
 * десять секунд понимает, что получит. Самая «инженерная» из шести страниц:
 * сетка, метки, тайм-коды, дорожки V1/V2/A1.
 *
 * Композиция (у каждой секции свой масштаб и плотность):
 *   1. Первый экран — мастер-кадр распадается на нарезки 9:16, 16:9, 1:1 и
 *      4:5; линия развёртки идёт по кадру сама, нарезки реагируют на курсор и
 *      на скролл, а нажатие выбирает нарезку (то же на телефоне).
 *   2. Линейка квартала — sticky-сцена: скролл ведёт линию воспроизведения по
 *      13 неделям, монитор показывает, какой кусок мастер-кадра выходит сейчас.
 *   3. Состав выдачи — мозаика карточек с настоящими нарезками.
 *   4. Кому подходит — три схемы: каталог, площадки, ритм.
 *   5. Работы, призыв, процесс, призыв, вопросы — общий кит и два смысловых CTA.
 *
 * Все нарезки — один и тот же мастер-кадр, сдвинутый в окне нарезки
 * (registered crop): картинка грузится один раз, нарезки не расходятся с
 * мастером ни на пиксель. Если работ из портфолио нет, вместо кадра везде
 * стоит поверхность «листа» — сетка и свет, — а вёрстка и смысл остаются.
 *
 * Движение — transform, clip-path и opacity декора. Всё, что идёт по кругу,
 * стоит вне экрана и выключено при prefers-reduced-motion; текст, кнопки и
 * заголовки на первом кадре стоят на месте.
 */
'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'

import {
  CONTENT_HERO_CUTS,
  CONTENT_PAGE,
  CONTENT_PLAN,
  CONTENT_TRACKS,
  CONTENT_WEEKS,
  type CropRect,
  type OutputPlan,
} from '@/lib/services/pages/content/content-production'
import {
  interleaveFrames,
  type DirectionPageWork,
  type SceneFrame,
} from '@/lib/services/pages/resolve'
import { cn } from '@/lib/utils'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionCredits } from '../direction-credits'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import { KIT_KICKER, KIT_TITLE, KIT_TITLE_SIZE, setTitle, typo } from '../direction-kit'
import { DirectionProcess } from '../direction-process'
import { DIRECTION_READING } from '@/lib/services/pages'
import { OtherDirections } from '../other-directions'
import { Still } from '../still'
import './content-page.css'

export interface ContentPageProps {
  works: DirectionPageWork[]
}

/** Кадр сцены: у работы может не быть ни одного, тогда вместо него поверхность листа */
type Frame = SceneFrame | null

/**
 * Одна строка sizes на весь мастер-кадр: первый экран, монитор и карточки
 * выбирают из srcset один и тот же файл, и картинка скачивается один раз.
 */
const MASTER_SIZES = '(min-width: 1024px) 58vw, 100vw'
const FULL_RECT: CropRect = { x: 0, y: 0, w: 100, h: 100 }

const pad = (value: number) => String(value).padStart(2, '0')
const delay = (ms: number) => ({ '--dc-d': `${ms}ms` }) as CSSProperties

/** Тайм-код на 24 кадрах в секунду: ЧЧ:ММ:СС:КК */
function timecode(frames: number) {
  const seconds = Math.floor(frames / 24)
  return [
    pad(Math.floor(seconds / 3600)),
    pad(Math.floor(seconds / 60) % 60),
    pad(seconds % 60),
    pad(frames % 24),
  ].join(':')
}

/** Недели выдачи: «03–04» или «07» */
const weekRange = (plan: OutputPlan) =>
  plan.span > 1 ? `${pad(plan.week)}–${pad(plan.week + plan.span - 1)}` : pad(plan.week)

const clipOf = (rect: CropRect) =>
  `inset(${rect.y}% ${100 - rect.x - rect.w}% ${100 - rect.y - rect.h}% ${rect.x}%)`

/** Выдачи в порядке выхода: по ним линейка находит, что показывает монитор */
const ORDER = [...CONTENT_PLAN].sort((a, b) => a.week - b.week) as [OutputPlan, ...OutputPlan[]]
const EMPTY_OUTPUT = { label: '', text: '' }
const outputAt = (index: number) => CONTENT_PAGE.outputs[index] ?? EMPTY_OUTPUT
const WEEK_NUMBERS = Array.from({ length: CONTENT_WEEKS }, (_, index) => index + 1)
/** Доля скролла сцены, на которой линия стоит в начале и в конце квартала */
const PHASE_FROM = 0.05
const PHASE_TO = 0.95

/**
 * Круг, пока секция на экране: data-live снимает паузу с CSS-анимаций,
 * rAF-циклы слушают тот же признак.
 */
function useLive<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        node.dataset.live = String(entry?.isIntersecting ?? true)
      },
      { rootMargin: '10% 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
}

/**
 * Появление декора: до гидрации и без JS блок стоит в конечном состоянии.
 * Хук взводит data-armed и снимает его data-in, когда блок входит в экран.
 * Текст в такие блоки не кладём — он виден всегда.
 */
function useArrival<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    node.dataset.armed = 'true'
    const observer = new IntersectionObserver(
      ([entry], self) => {
        if (!entry?.isIntersecting) return
        node.dataset.in = 'true'
        self.disconnect()
      },
      { rootMargin: '0px 0px -8% 0px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
}

/**
 * Прогресс секции по скроллу, 0…1. Собственный, а не useScroll({ target }):
 * тот в режиме разработки ругается на статичный <html> как на контейнер
 * прокрутки. Читаем один раз на кадр и только пока секция рядом с экраном.
 *
 * pinned — секция с sticky-сценой: 0, когда её верх у верха экрана, и 1, когда
 * низ у низа. Без pinned — «уход»: 0 у верха экрана, 1, когда секция ушла вверх.
 */
function useSectionProgress<T extends HTMLElement>(ref: RefObject<T | null>, pinned: boolean) {
  const progress = useMotionValue(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    let raf = 0
    let near = true
    const read = () => {
      raf = 0
      const rect = node.getBoundingClientRect()
      const range = pinned ? rect.height - window.innerHeight : rect.height
      const value = range > 0 ? -rect.top / range : 0
      progress.set(Math.min(1, Math.max(0, value)))
    }
    const schedule = () => {
      if (near && !raf) raf = requestAnimationFrame(read)
    }
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          near = entry?.isIntersecting ?? true
          if (near) schedule()
        },
        { rootMargin: '20% 0px' }
      )
      observer.observe(node)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    read()
    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, pinned, progress])
  return progress
}

function Plate({ lit = false }: { lit?: boolean }) {
  return <span aria-hidden="true" data-lit={lit} className="dir-content-plate" />
}

/**
 * Участок мастер-кадра: слой размером с весь мастер, сдвинутый так, что в окне
 * остаётся только rect. Картинка та же, что в мастере, — нарезки не плывут.
 */
function Registered({
  frame,
  rect,
  lit = false,
  priority = false,
}: {
  frame: Frame
  rect: CropRect
  lit?: boolean
  priority?: boolean
}) {
  const style: CSSProperties = {
    left: `${(-rect.x / rect.w) * 100}%`,
    top: `${(-rect.y / rect.h) * 100}%`,
    width: `${(100 / rect.w) * 100}%`,
    height: `${(100 / rect.h) * 100}%`,
  }
  return (
    <span aria-hidden="true" className="dir-content-reg" style={style}>
      {frame ? (
        <Still
          src={frame.src}
          alt=""
          sizes={MASTER_SIZES}
          priority={priority}
          className="h-full w-full"
        />
      ) : (
        <Plate lit={lit} />
      )}
    </span>
  )
}

/* ─────────────────────────── 1. Первый экран ─────────────────────────── */

function Hero({ frame }: { frame: Frame }) {
  const page = useDirectionPage()
  const hero = CONTENT_PAGE.hero
  const heroRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  // По умолчанию выбран главный ролик: строка под кадром не пустая с первого кадра
  const [picked, setPicked] = useState(1)
  useLive(stageRef)

  // Скролл продолжает распад: нарезки расходятся дальше, пока экран уезжает.
  // Работает и с пальцем, и с колесом; в CSS при сниженном движении переменная игнорируется
  const scrollYProgress = useSectionProgress(heroRef, false)
  useMotionValueEvent(scrollYProgress, 'change', value => {
    stageRef.current?.style.setProperty('--dc-spread', value.toFixed(3))
  })

  // Живой тайм-код развёртки: один rAF, запись прямо в узел, пауза вне экрана
  useEffect(() => {
    const stage = stageRef.current
    const node = tcRef.current
    if (!stage || !node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let last = 0
    let elapsed = 0
    let shown = -1
    const tick = (now: number) => {
      if (last) elapsed += now - last
      last = now
      const frames = Math.floor((elapsed / 1000) * 24)
      if (frames !== shown) {
        shown = frames
        node.textContent = timecode(frames)
      }
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      if (raf) return
      last = 0
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    if (typeof IntersectionObserver === 'undefined') {
      start()
      return stop
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) start()
      else stop()
    })
    observer.observe(stage)
    return () => {
      observer.disconnect()
      stop()
    }
  }, [])

  // Курсор чуть сдвигает нарезки, каждую на свою глубину. Только там, где курсор
  // есть; на телефоне ту же роль играет скролл (--dc-spread) и выбор нарезки нажатием
  useEffect(() => {
    const root = heroRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || calm.matches) return

    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let raf = 0
    const frame = () => {
      cx += (tx - cx) * 0.085
      cy += (ty - cy) * 0.085
      stage.style.setProperty('--dc-px', cx.toFixed(3))
      stage.style.setProperty('--dc-py', cy.toFixed(3))
      const settled = Math.abs(tx - cx) < 0.002 && Math.abs(ty - cy) < 0.002
      raf = settled ? 0 : requestAnimationFrame(frame)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    const onMove = (event: PointerEvent) => {
      if (stage.dataset.live === 'false') return
      tx = (event.clientX / window.innerWidth - 0.5) * 2
      ty = (event.clientY / window.innerHeight - 0.5) * 2
      kick()
    }
    const onLeave = () => {
      tx = 0
      ty = 0
      kick()
    }
    root.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('pointerleave', onLeave)
    return () => {
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const cut = CONTENT_HERO_CUTS[picked] ?? CONTENT_HERO_CUTS[0]

  return (
    <section
      ref={heroRef}
      className="relative isolate flex min-h-[100svh] flex-col overflow-x-clip bg-[#000000]"
    >
      <div aria-hidden="true" className="dir-content-paper" />

      <div className="grid flex-1 items-center gap-x-10 gap-y-9 px-6 pb-10 pt-24 md:px-10 lg:grid-cols-12 lg:px-20 lg:pb-12 lg:pt-28">
        <div className="lg:col-span-5">
          <p
            className="dir-content-rise type-meta font-mono uppercase tabular-nums text-white/60"
            style={delay(0)}
          >
            {hero.meta}
            <span aria-hidden="true" className="mx-2.5 text-accent">
              /
            </span>
            {hero.places}
          </p>

          <h1 className="mt-6 font-stage text-[clamp(2.1rem,9.3vw,5.25rem)] uppercase leading-[0.94] tracking-[-0.04em] text-white md:mt-8 lg:text-[clamp(3.4rem,6.3vw,7.75rem)]">
            <span className="block">
              <span className="dir-content-rise inline-block lg:block" style={delay(80)}>
                Одна
              </span>{' '}
              <span className="dir-content-rise inline-block lg:block" style={delay(160)}>
                съёмка
              </span>
              <span className="sr-only">,</span>
            </span>{' '}
            <span className="block font-brand-hero">
              <span
                className="dir-content-rise inline-block text-accent lg:block"
                style={delay(240)}
              >
                восемь
              </span>{' '}
              <span className="dir-content-rise inline-block lg:block" style={delay(320)}>
                выдач
              </span>
            </span>{' '}
            <span
              className="dir-content-rise mt-6 block max-w-[27rem] font-sans text-base font-light normal-case leading-snug tracking-normal text-white/80 [text-wrap:pretty] md:mt-8 md:text-xl"
              style={delay(420)}
            >
              {typo(hero.lead)}
            </span>
          </h1>

          <div
            className="dir-content-rise mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-8 md:mt-10"
            style={delay(520)}
          >
            <button
              type="button"
              onClick={() => page.openBrief('hero')}
              className="dir-content-btn w-full px-7 py-4 text-base font-medium sm:w-auto"
            >
              <span>{CONTENT_PAGE.ctaLabel}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
            <a href="#sheet" className="dir-content-link text-base">
              Как это работает
              <ArrowDown aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="dir-content-stagebox">
            <div
              aria-hidden="true"
              className="type-meta mb-3 flex items-center justify-between gap-4 font-mono uppercase tabular-nums text-white/60"
            >
              <span className="truncate">Мастер-кадр{frame ? `: ${frame.client}` : ''}</span>
              <span className="shrink-0">
                TC <span ref={tcRef}>00:00:00:00</span>
              </span>
            </div>

            <div ref={stageRef} className="dir-content-stage">
              <span aria-hidden="true" className="dir-content-rim">
                <i />
                <i />
                <i />
                <i />
              </span>
              <div className="dir-content-reveal">
                <div className="dir-content-master">
                  {frame ? (
                    <Still
                      src={frame.src}
                      alt=""
                      priority
                      sizes={MASTER_SIZES}
                      className="absolute inset-0 h-full w-full"
                    />
                  ) : (
                    <Plate lit />
                  )}
                  <span aria-hidden="true" className="dir-content-light" />
                </div>
                <span aria-hidden="true" className="dir-content-dim" />

                {CONTENT_HERO_CUTS.map((item, index) => (
                  <div
                    key={item.key}
                    className="dir-content-cut"
                    data-picked={picked === index}
                    style={
                      {
                        left: `${item.rect.x}%`,
                        top: `${item.rect.y}%`,
                        width: `${item.rect.w}%`,
                        height: `${item.rect.h}%`,
                        '--dx': item.drift.x,
                        '--dy': item.drift.y,
                        '--dc-depth': item.depth,
                        '--i': index,
                        '--t': `${((item.rect.x / 100) * 9).toFixed(2)}s`,
                      } as CSSProperties
                    }
                  >
                    <div className="dir-content-cut-view">
                      <Registered frame={frame} rect={item.rect} lit priority />
                    </div>
                    <span aria-hidden="true" className="dir-content-cut-frame" />
                    <span aria-hidden="true" className="dir-content-cut-tick" />
                    <span
                      aria-hidden="true"
                      className="dir-content-cut-tag type-meta-sm font-mono uppercase tabular-nums"
                    >
                      <b>{item.ratio}</b>
                      <i>{pad(index + 1)}</i>
                    </span>
                    <button
                      type="button"
                      className="dir-content-cut-hit"
                      aria-pressed={picked === index}
                      aria-label={`${item.ratio}, ${item.name}: ${item.text}`}
                      onClick={() => setPicked(index)}
                      onPointerEnter={event => {
                        if (event.pointerType === 'mouse') setPicked(index)
                      }}
                    />
                  </div>
                ))}
              </div>

              <span aria-hidden="true" className="dir-content-sweep" />
            </div>

            <div aria-hidden="true" className="dir-content-readout mt-4">
              <span className="type-meta font-mono uppercase tabular-nums text-white/70">
                {cut.ratio}
                <span className="mx-2 text-accent">/</span>
                {cut.name}
              </span>
              <span
                key={cut.key}
                className="dir-content-swap text-sm leading-snug text-white/80 md:text-base"
              >
                {typo(cut.text)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 lg:px-20">
        <dl
          className="dir-content-rise grid grid-cols-2 gap-y-5 border-t border-white/15 py-5 md:grid-cols-4"
          style={delay(640)}
        >
          {CONTENT_PAGE.spec.map(item => (
            <div key={item.label} className="border-l border-white/15 pl-4 md:pl-6">
              <dt className="type-meta font-mono uppercase text-white/60">{item.label}</dt>
              <dd className="mt-1.5 font-stage text-[clamp(1.1rem,2.1vw,1.75rem)] uppercase leading-none tracking-[-0.02em] text-white">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ─────────────────────────── 2. Линейка квартала ─────────────────────────── */

/** Волна под основным роликом: детерминированная, чтобы сервер и клиент рисовали одно */
function Wave({ seed }: { seed: number }) {
  const path = Array.from({ length: 34 }, (_, index) => {
    const amp = 2.5 + Math.abs(Math.sin(seed * 7.13 + index * 1.7)) * 8.5
    return `M${index * 2 + 1} ${(12 - amp).toFixed(1)}V${(12 + amp).toFixed(1)}`
  }).join('')
  return (
    <svg viewBox="0 0 68 24" preserveAspectRatio="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function Nle({ frame }: { frame: Frame }) {
  const scene = CONTENT_PAGE.scene
  const sectionRef = useRef<HTMLElement>(null)
  const hintRef = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [week, setWeek] = useState(1)
  useLive(hintRef)

  const scrollYProgress = useSectionProgress(sectionRef, true)
  // Линия воспроизведения: 0 — начало первой недели, 1 — конец тринадцатой
  const phase = useTransform(scrollYProgress, [PHASE_FROM, PHASE_TO], [0, 1])
  const playheadX = useTransform(phase, value => `${(value * 100).toFixed(2)}%`)

  // React видит только смену недели и выдачи — не каждый кадр скролла
  useMotionValueEvent(phase, 'change', value => {
    const nextWeek = Math.min(CONTENT_WEEKS, Math.floor(value * CONTENT_WEEKS) + 1)
    setWeek(current => (current === nextWeek ? current : nextWeek))
    let nextActive = 0
    ORDER.forEach((plan, index) => {
      if (plan.week <= nextWeek) nextActive = index
    })
    setActive(current => (current === nextActive ? current : nextActive))
    const hint = hintRef.current
    if (hint) hint.style.opacity = value > 0.02 ? '0' : '1'
  })

  // Нажатие на блок прокручивает сцену к началу этой выдачи: клавиатура и палец
  // получают то же, что колесо
  const jumpTo = useCallback((plan: OutputPlan) => {
    const section = sectionRef.current
    if (!section) return
    const range = section.offsetHeight - window.innerHeight
    const target = (plan.week - 1 + 0.35) / CONTENT_WEEKS
    const top =
      section.getBoundingClientRect().top +
      window.scrollY +
      (PHASE_FROM + target * (PHASE_TO - PHASE_FROM)) * range
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top, behavior: calm ? 'auto' : 'smooth' })
  }, [])

  const current = ORDER[active] ?? ORDER[0]
  const output = outputAt(current.output)
  const stateOf = (index: number) => (index < active ? 'past' : index === active ? 'now' : 'next')

  return (
    <section
      id="sheet"
      ref={sectionRef}
      aria-labelledby="dir-content-scene-title"
      className="relative h-[340svh] bg-[#060606]"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-6 pb-20 pt-[4.75rem] md:px-10 md:pb-14 md:pt-24 lg:px-20">
        <div aria-hidden="true" className="dir-content-paper" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-3 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-6">
          <header className="lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <p className={KIT_KICKER}>
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              01 / Монтажный лист
            </p>
            <h2
              id="dir-content-scene-title"
              className={`${KIT_TITLE} mt-3 max-w-[34ch] text-[clamp(1.3rem,2.9vw,2.75rem)] md:mt-4`}
            >
              {setTitle(scene.title)}
            </h2>
            <p className="type-meta mt-4 hidden max-w-[30rem] font-mono uppercase leading-relaxed tabular-nums text-white/60 md:block">
              {typo(scene.lead)}
            </p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <p
              aria-hidden="true"
              className="type-meta mb-3 flex shrink-0 items-center justify-between gap-4 font-mono uppercase tabular-nums text-white/60"
            >
              <span>
                Монитор
                <span className="mx-2.5 text-accent">/</span>
                Неделя {pad(week)} из {CONTENT_WEEKS}
              </span>
              <span
                ref={hintRef}
                className="dir-content-hint whitespace-nowrap text-white/80 transition-opacity duration-[var(--motion-move)]"
              >
                <i />
                Листайте
              </span>
            </p>
            <div className="dir-content-mon-wrap">
              <div className="dir-content-mon">
                <Registered frame={frame} rect={FULL_RECT} />
                <span aria-hidden="true" className="dir-content-mon-dim" />
                <div
                  aria-hidden="true"
                  className="dir-content-mon-lit"
                  style={{ clipPath: clipOf(current.rect) }}
                >
                  <Registered frame={frame} rect={FULL_RECT} lit />
                </div>
                <span
                  aria-hidden="true"
                  className="dir-content-mon-box"
                  style={{
                    left: `${current.rect.x}%`,
                    top: `${current.rect.y}%`,
                    width: `${current.rect.w}%`,
                    height: `${current.rect.h}%`,
                  }}
                >
                  <span className="dir-content-mon-tag type-meta-sm font-mono uppercase tabular-nums">
                    {pad(current.output + 1)} {output.label}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="flex flex-col justify-end lg:col-span-5 lg:col-start-8 lg:row-start-2"
          >
            <div key={current.output} className="dir-content-swap">
              <p className="type-meta font-mono uppercase tabular-nums text-white/60">
                <span className="text-accent">{pad(current.output + 1)}</span>
                {` / ${pad(CONTENT_PAGE.outputs.length)} · ${current.track} · Н${weekRange(current)}`}
                {current.note ? ` · ${current.note}` : ''}
              </p>
              <p className="mt-2 font-stage text-[clamp(1.75rem,5.4vw,4.75rem)] uppercase leading-[0.92] tracking-[-0.03em] text-white lg:mt-4">
                {output.label}
              </p>
              <p className="mt-2 max-w-[34ch] text-sm leading-snug text-white/75 [text-wrap:pretty] md:mt-4 md:text-lg">
                {typo(output.text)}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-4 md:mt-6">
          <div className="dir-content-tl" style={{ '--dc-week': CONTENT_WEEKS } as CSSProperties}>
            <div aria-hidden="true" className="dir-content-tl-row">
              <span className="dir-content-tl-label">
                <span className="type-meta-sm font-mono uppercase">
                  <span className="md:hidden">Н</span>
                  <span className="hidden md:inline">Неделя</span>
                </span>
              </span>
              <div className="dir-content-tl-weeks type-meta-sm font-mono tabular-nums">
                {WEEK_NUMBERS.map(number => (
                  <span
                    key={number}
                    data-state={number < week ? 'past' : number === week ? 'now' : 'next'}
                  >
                    {pad(number)}
                  </span>
                ))}
              </div>
            </div>

            {CONTENT_TRACKS.map(track => (
              <div key={track.id} className="dir-content-tl-row">
                <span className="dir-content-tl-label">
                  <b className="type-meta font-mono">{track.id}</b>
                  <i className="type-meta-sm font-mono uppercase">{track.note}</i>
                </span>
                <div className="dir-content-tl-lane" data-track={track.id}>
                  {track.id === 'A1'
                    ? ORDER.map((plan, index) =>
                        plan.track === 'V1' ? (
                          <div
                            key={plan.output}
                            aria-hidden="true"
                            className="dir-content-aclip"
                            data-state={stateOf(index)}
                            style={{ gridColumn: `${plan.week} / span ${plan.span}` }}
                          >
                            <Wave seed={plan.output + 1} />
                          </div>
                        ) : null
                      )
                    : ORDER.map((plan, index) =>
                        plan.track === track.id ? (
                          <button
                            key={plan.output}
                            type="button"
                            className="dir-content-clip"
                            data-state={stateOf(index)}
                            aria-current={index === active ? 'true' : undefined}
                            aria-label={`${outputAt(plan.output).label}${
                              plan.note ? `, ${plan.note}` : ''
                            }: выдача ${plan.output + 1}, недели ${weekRange(plan)}`}
                            style={{ gridColumn: `${plan.week} / span ${plan.span}` }}
                            onClick={() => jumpTo(plan)}
                          >
                            <span className="type-meta-sm font-mono tabular-nums">
                              {pad(plan.output + 1)}
                            </span>
                            <span className="dir-content-clip-name type-meta font-mono uppercase">
                              {outputAt(plan.output).label}
                            </span>
                          </button>
                        ) : null
                      )}
                </div>
              </div>
            ))}

            <div aria-hidden="true" className="dir-content-ph-rail">
              <motion.div className="dir-content-ph" style={{ x: playheadX }}>
                <span className="dir-content-ph-flag type-meta-sm font-mono tabular-nums">
                  Н{pad(week)}
                </span>
              </motion.div>
            </div>
          </div>

          <p className="type-meta mt-3 font-mono uppercase leading-relaxed text-white/55">
            {typo(scene.note)}
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Склейка между секциями ─────────────────────────── */

/**
 * Склейка: линия с красной отметкой реза и номерами секций по краям, как
 * переход на монтажной дорожке. Декор, прорисовывается при входе в экран.
 */
function Splice({ from, to }: { from: string; to: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useArrival(ref)
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="flex h-14 items-center gap-4 border-y border-white/10 bg-[#000000] px-6 md:px-10 lg:px-20"
    >
      <span className="type-meta font-mono uppercase tabular-nums text-white/55">CUT {from}</span>
      <span className="dir-content-splice-line h-px flex-1 bg-white/25" />
      <span className="h-5 w-px bg-accent" />
      <span className="dir-content-splice-line h-px flex-1 bg-white/25" />
      <span className="type-meta font-mono uppercase tabular-nums text-white/55">{to}</span>
    </div>
  )
}

/* ─────────────────────────── 3. Состав выдачи ─────────────────────────── */

/** Место карточки в мозаике: a…h по порядку выдач */
const SLOTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

function Outputs({ frame }: { frame: Frame }) {
  const outputs = CONTENT_PAGE.outputs
  return (
    <section
      aria-labelledby="dir-content-outputs-title"
      className="relative overflow-hidden bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="grid gap-x-16 gap-y-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            02 / Состав выдачи
          </p>
          <h2
            id="dir-content-outputs-title"
            data-reveal=""
            className={`${KIT_TITLE} mt-5 text-[clamp(2rem,5.4vw,5.25rem)]`}
          >
            {setTitle('Что получаете с одной съёмки')}
          </h2>
        </div>
        <p
          data-reveal=""
          className="max-w-md text-base leading-relaxed text-white/70 [text-wrap:pretty] lg:col-span-4 md:text-lg"
        >
          {typo(
            'Стандартный набор — восемь материалов. Состав меняем под ваш контент-план: что-то убираем, что-то добавляем.'
          )}
        </p>
      </div>

      <p
        aria-hidden="true"
        className="type-meta mt-12 flex items-center justify-between gap-6 border-t border-white/15 pt-4 font-mono uppercase tabular-nums text-white/55 md:mt-16"
      >
        <span className="whitespace-nowrap">
          Лист 01<span className="mx-2.5 text-accent">/</span>
          {pad(outputs.length)} кадров
        </span>
        <span className="hidden truncate md:block">
          Из одного мастер-кадра{frame ? `: ${frame.client}` : ''}
        </span>
        <span className="whitespace-nowrap text-white/80 md:hidden">Листайте →</span>
      </p>

      <ul role="list" aria-label="Состав выдачи" className="dir-content-grid mt-4" data-reveal="">
        {outputs.map((output, index) => {
          const plan = CONTENT_PLAN.find(item => item.output === index)
          if (!plan) return null
          return (
            <li key={`${output.label}-${index}`} className="dir-content-card" data-k={SLOTS[index]}>
              <div className="type-meta flex items-baseline justify-between gap-3 font-mono uppercase tabular-nums">
                <span className="dir-content-card-idx">{pad(index + 1)}</span>
                <span className="text-white/55">
                  {plan.track} · Н{weekRange(plan)}
                </span>
              </div>

              <div
                aria-hidden="true"
                className="dir-content-card-slot"
                style={{ '--ar': plan.aspect.toFixed(4) } as CSSProperties}
              >
                <div className="dir-content-card-frame">
                  <div className="dir-content-card-zoom">
                    <Registered frame={frame} rect={plan.rect} lit />
                  </div>
                </div>
              </div>

              <h3 className="flex flex-wrap items-baseline gap-x-3 font-stage text-[clamp(1.3rem,2vw,1.85rem)] uppercase leading-none tracking-[-0.02em] text-white">
                {output.label}{' '}
                {plan.note ? (
                  <span className="type-meta font-mono font-normal normal-case tracking-[0.08em] text-white/55">
                    {plan.note}
                  </span>
                ) : null}
              </h3>
              <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-white/70 [text-wrap:pretty] md:text-[0.9375rem]">
                {typo(output.text)}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ─────────────────────────── 4. Кому подходит ─────────────────────────── */

/** Положение четырёх площадок на схеме розницы: проценты кадра схемы */
const RETAIL_OUTS = [
  { left: 62, top: 8, w: 26, h: 19.5 },
  { left: 62, top: 31, w: 32, h: 18.3 },
  { left: 62, top: 52, w: 10.1, h: 24 },
  { left: 62, top: 79, w: 13.5, h: 18 },
] as const

/** Позиции каталога, которые «выходят» в этом квартале: подсвечены красным */
const HOT_TILES = new Set([2, 5, 7, 10])
const RHYTHM_HEIGHTS = [0.55, 0.72, 0.42, 0.64, 0.5, 0.8, 0.46, 0.68] as const

function Diagram({ kind }: { kind: 'catalog' | 'retail' | 'rhythm' }) {
  const ref = useRef<HTMLDivElement>(null)
  useArrival(ref)

  return (
    <div ref={ref} aria-hidden="true" className="dir-content-dg">
      {kind === 'catalog' ? (
        <>
          <span className="dir-content-dg-bracket" />
          <span className="dir-content-dg-cap type-meta-sm left-[9%] top-[5%] font-mono uppercase">
            Одна съёмка
          </span>
          <div className="dir-content-dg-tiles">
            {Array.from({ length: 12 }, (_, index) => (
              <span
                key={index}
                data-hot={HOT_TILES.has(index)}
                style={{ '--i': index } as CSSProperties}
              />
            ))}
          </div>
        </>
      ) : null}

      {kind === 'retail' ? (
        <>
          <span className="dir-content-dg-src" />
          <span className="dir-content-dg-cap type-meta-sm left-[7%] top-[26%] font-mono uppercase">
            Съёмка
          </span>
          <svg className="dir-content-dg-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {RETAIL_OUTS.map((out, index) => {
              const y = out.top + out.h / 2
              return (
                <path
                  key={index}
                  pathLength={1}
                  style={{ '--i': index } as CSSProperties}
                  d={`M31 50 C 46 50, 48 ${y}, ${out.left - 1} ${y}`}
                />
              )
            })}
          </svg>
          {RETAIL_OUTS.map((out, index) => (
            <span
              key={index}
              className="dir-content-dg-out"
              style={
                {
                  left: `${out.left}%`,
                  top: `${out.top}%`,
                  width: `${out.w}%`,
                  height: `${out.h}%`,
                  '--i': index,
                } as CSSProperties
              }
            />
          ))}
        </>
      ) : null}

      {kind === 'rhythm' ? (
        <>
          <span className="dir-content-dg-cap type-meta-sm left-[7%] top-[8%] font-mono uppercase">
            Съёмка
          </span>
          <span className="absolute bottom-[24%] left-[7%] top-[22%] w-[3.5%] bg-accent" />
          <div
            className="dir-content-dg-weeks"
            style={{ left: '15%', '--dc-week': CONTENT_WEEKS } as CSSProperties}
          >
            {ORDER.map((plan, index) => (
              <span
                key={plan.output}
                style={
                  {
                    gridColumn: plan.week,
                    height: `${(RHYTHM_HEIGHTS[index] ?? 0.5) * 100}%`,
                    '--i': index,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div
            className="dir-content-dg-ticks"
            style={{ left: '15%', '--dc-week': CONTENT_WEEKS } as CSSProperties}
          />
          <span className="dir-content-dg-cap type-meta-sm bottom-[4%] right-[7%] font-mono uppercase">
            Неделя 01 — {CONTENT_WEEKS}
          </span>
        </>
      ) : null}
    </div>
  )
}

const DIAGRAM_CAPTIONS = {
  catalog: 'Каталог → одна съёмка',
  retail: 'Одна съёмка → четыре площадки',
  rhythm: 'Квартал → ритм выдач',
} as const

function Audiences() {
  // Колонки ступенькой: каждая следующая ниже, глаз идёт по диагонали
  const steps = ['', 'md:mt-14', 'md:mt-28']
  return (
    <section
      aria-labelledby="dir-content-audiences-title"
      className="relative overflow-hidden bg-[#0a0a0a] px-6 py-20 md:px-10 md:py-32 lg:px-20"
    >
      <div className="lg:max-w-[46rem]">
        <p className={KIT_KICKER}>
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          03 / Кому подходит
        </p>
        <h2
          id="dir-content-audiences-title"
          data-reveal=""
          className={`${KIT_TITLE} ${KIT_TITLE_SIZE} mt-5`}
        >
          {setTitle('Когда один ролик — мало')}
        </h2>
      </div>

      <ul role="list" className="mt-12 grid gap-14 md:mt-16 md:grid-cols-3 md:gap-x-8 lg:gap-x-14">
        {CONTENT_PAGE.audiences.map((item, index) => (
          <li key={item.title} data-reveal="" className={steps[index]}>
            <Diagram kind={item.kind} />
            <p
              aria-hidden="true"
              className="type-meta mt-3 font-mono uppercase tabular-nums text-white/55"
            >
              {DIAGRAM_CAPTIONS[item.kind]}
            </p>
            <h3 className="mt-6 font-stage text-[clamp(1.35rem,2vw,1.85rem)] uppercase leading-[1.04] tracking-[-0.02em] text-white [text-wrap:balance]">
              {typo(item.title)}
            </h3>
            <p className="mt-4 max-w-[36ch] text-[0.9375rem] leading-relaxed text-white/70 [text-wrap:pretty] md:text-base">
              {typo(item.text)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─────────────────────────── Смысловые призывы ─────────────────────────── */

/** После доказательства: панель экспорта — параметры квартала и кнопка */
function ProofCta() {
  const page = useDirectionPage()
  const cta = CONTENT_PAGE.cta.proof
  return (
    <section
      aria-labelledby="dir-content-proof-title"
      className="relative overflow-hidden border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div aria-hidden="true" className="dir-content-paper" />
      <div className="relative grid items-end gap-12 lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-7">
          <p className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            {cta.kicker}
          </p>
          <h2
            id="dir-content-proof-title"
            data-reveal=""
            className={`${KIT_TITLE} mt-5 text-[clamp(1.85rem,4vw,3.9rem)]`}
          >
            {setTitle(cta.title)}
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 [text-wrap:pretty] md:text-lg">
            {typo(cta.text)}
          </p>
        </div>

        <div data-reveal="" className="dir-content-render lg:col-span-5">
          <div className="border border-white/25 bg-[#080808]">
            <p className="type-meta flex items-center justify-between border-b border-white/15 px-5 py-3 font-mono uppercase text-white/60 md:px-6">
              <span>Параметры выдачи</span>
              <span aria-hidden="true" className="flex gap-1.5">
                <i className="h-1.5 w-1.5 bg-white/30" />
                <i className="h-1.5 w-1.5 bg-white/30" />
                <i className="h-1.5 w-1.5 bg-accent" />
              </span>
            </p>
            <div className="px-5 pb-5 pt-2 md:px-6 md:pb-6">
              <dl>
                {cta.rows.map(([label, value]) => (
                  <div key={label} className="dir-content-render-row">
                    <dt className="type-meta font-mono uppercase text-white/60">{label}</dt>
                    <i aria-hidden="true" />
                    <dd className="text-right text-sm text-white md:text-base">{typo(value)}</dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                onClick={() => page.openBrief('proof')}
                className="dir-content-btn mt-4 w-full px-6 py-4 text-base font-medium"
              >
                <span>{cta.label}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
              <div aria-hidden="true" className="dir-content-render-bar" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** После процесса: лента этапов, первый — красный, и кнопка «начнём с него» */
function ProcessCta() {
  const page = useDirectionPage()
  const cta = CONTENT_PAGE.cta.process
  const last = cta.stops.length - 1
  return (
    <section
      aria-labelledby="dir-content-process-cta-title"
      className="dir-content-ribbon border-t border-white/10 bg-[#000000] px-6 py-16 md:px-10 md:py-24 lg:px-20"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <div className="max-w-[44rem]">
          <p className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            {cta.kicker}
          </p>
          <h2
            id="dir-content-process-cta-title"
            data-reveal=""
            className="mt-5 font-brand-hero text-[clamp(2rem,5.6vw,5.25rem)] uppercase leading-[0.92] tracking-[-0.035em] text-white [text-wrap:balance]"
          >
            {typo(cta.title)}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 [text-wrap:pretty] md:text-lg">
            {typo(cta.text)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => page.openBrief('process')}
          className="dir-content-btn w-full shrink-0 px-7 py-4 text-base font-medium lg:w-auto lg:min-w-[19rem]"
        >
          <span>{cta.label}</span>
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div aria-hidden="true" className="mx-1.5 mb-10 mt-14 md:mt-16">
        <div className="dir-content-ribbon-rail">
          {cta.stops.map((stop, index) => (
            <span
              key={stop}
              className="dir-content-ribbon-dot"
              data-first={index === 0}
              style={{ left: `${(index / last) * 100}%` }}
            />
          ))}
        </div>
        <div className="relative mt-5 h-5">
          {cta.stops.map((stop, index) => (
            <span
              key={stop}
              className={cn(
                'type-meta absolute top-0 whitespace-nowrap font-mono uppercase tabular-nums text-white/60',
                index === 0 && 'text-white',
                index === last && '-translate-x-full',
                index > 0 && index < last && '-translate-x-1/2'
              )}
              style={{ left: `${(index / last) * 100}%` }}
            >
              {pad(index + 1)}
              <span className="hidden sm:inline"> {stop}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Страница ─────────────────────────── */

export function ContentPage({ works }: ContentPageProps) {
  const frames = interleaveFrames(works, 6)
  // Мастер-кадр — тот план ведущей работы, который выбран в раскадровке направления
  // (SERVICE_FRAMES), а не просто первый кадр галереи
  const lead = works.find(work => work.posterUrl)
  const master: Frame = lead?.posterUrl
    ? {
        key: `${lead.slug}-master`,
        src: lead.posterUrl,
        slug: lead.slug,
        client: lead.client,
        title: lead.title,
      }
    : (frames[0] ?? null)
  const closing = frames[frames.length - 1]
  // Без работ раздел «Работы» не рисуется, номера следующих разделов сдвигаются
  const hasWorks = works.length > 0
  const end = CONTENT_PAGE.end

  return (
    <DirectionShell id="content-production" stickyLabel={CONTENT_PAGE.stickyLabel}>
      <div className="dir-content">
        <Hero frame={master} />
        <Nle frame={master} />
        <Splice from="01" to="02" />
        <Outputs frame={master} />
        <Splice from="02" to="03" />
        <Audiences />
        {hasWorks ? (
          <DirectionCredits
            index="04"
            title="Съёмки под поток материалов"
            works={works}
            note="Работы, из которых идёт регулярный контент"
          />
        ) : null}
        <ProofCta />
        <DirectionProcess
          index={hasWorks ? '05' : '04'}
          title="Как планируем квартал"
          lead="Главное решение принимается до съёмки: какие материалы нужны и где они будут жить."
          steps={CONTENT_PAGE.process}
        />
        <ProcessCta />
        <DirectionFaq
          index={hasWorks ? '06' : '05'}
          title="Вопросы о регулярном продакшне"
          items={CONTENT_PAGE.faq}
        />
        <OtherDirections
          current="content-production"
          reading={DIRECTION_READING['content-production']}
        />
        <DirectionEnd
          lines={end.lines}
          ctaLabel={end.ctaLabel}
          note={end.note}
          frame={closing ? { src: closing.src, alt: closing.client } : null}
        />
      </div>
    </DirectionShell>
  )
}
