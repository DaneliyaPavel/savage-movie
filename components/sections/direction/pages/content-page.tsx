/**
 * /content-production — «МОНТАЖНЫЙ ЛИСТ».
 *
 * Метафора: съёмка как проект в монтажной программе. Один мастер-кадр режется
 * на выдачи, выдачи ложатся на линейку квартала, а руководитель маркетинга за
 * десять секунд понимает, что получит. Язык листа — сетка, метки, тайм-коды,
 * дорожки V1/V2/A1 — идёт до самого низа, но нижняя половина держится не на
 * схемах, а на кадрах.
 *
 * Композиция (у каждой секции свой масштаб и плотность):
 *   1. Первый экран — мастер-кадр распадается на нарезки 9:16, 16:9, 1:1 и
 *      4:5; линия развёртки идёт по кадру сама, нарезки реагируют на курсор и
 *      на скролл, а нажатие выбирает нарезку (то же на телефоне). H1 короткий
 *      («Регулярный видеопродакшн»), хук «Одна съёмка — восемь выдач» — крупная
 *      визуальная строка под ним.
 *   2. Линейка квартала — sticky-сцена: скролл ведёт линию воспроизведения по
 *      13 неделям, монитор показывает, какой кусок мастер-кадра выходит сейчас.
 *      На телефоне линейка едет под линией по горизонтали, цифры недель ≥ 10px.
 *      На низком окне сцена не закрепляется: те же блоки, но нажатием.
 *   3. Состав выдачи — мозаика: у каждой выдачи свой кадр, кадрирование и тон.
 *   4. Полноэкранный кадр с тезисом — пауза между мозаикой и схемами.
 *   5. Кому подходит — три схемы на светлом листе (--dir-paper); работы;
 *      призыв; процесс — этапы по дорожкам, у каждого свой кадр или схема;
 *      призыв с нарезкой мастер-кадра; вопросы с мини-монитором.
 *
 * Нарезки на первом экране, в мониторе, в призыве процесса и в вопросах — один
 * и тот же мастер-кадр, сдвинутый в окне (registered crop): картинка грузится
 * один раз, нарезки не расходятся с мастером ни на пиксель.
 *
 * Кадры сцены — мастер, мозаика, тезис, этап «съёмка» и финал — не принадлежат
 * ни одной работе: это отобранные кадры направления (lib/services/scene-stills),
 * подписи с клиентом на них нет, и они стоят даже без работ. Настоящие работы
 * только в разделе «Работы»: у каждой карточки клиент и ссылка на проект. Если
 * кадров сцены нет, вместо кадра везде стоит поверхность «листа» — сетка и
 * свет, — а вёрстка и смысл остаются.
 *
 * Движение — transform, clip-path и opacity декора. Всё, что идёт по кругу,
 * стоит вне экрана и выключено при prefers-reduced-motion; текст, кнопки и
 * заголовки на первом кадре стоят на месте.
 */
'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import Link from 'next/link'
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'

import {
  CONTENT_HERO_CUTS,
  CONTENT_LOOKS,
  CONTENT_PAGE,
  CONTENT_PLAN,
  CONTENT_STAGE_LANES,
  CONTENT_TRACKS,
  CONTENT_WEEKS,
  type CropRect,
  type OutputPlan,
} from '@/lib/services/pages/content/content-production'
import {
  firstSentence,
  isCredited,
  type DirectionPageWork,
  type SceneFrame,
} from '@/lib/services/pages/resolve'
import { sceneFramesFor } from '@/lib/services/scene-stills'
import type { FaqItem, ProcessStep } from '@/lib/services/pages/types'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionEnd } from '../direction-end'
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
import './content-page.css'

export interface ContentPageProps {
  works: DirectionPageWork[]
}

/** Кадр сцены: если у направления кадров нет, вместо него поверхность листа */
type Frame = SceneFrame | null

/**
 * Кадры сцены не зависят от работ: порядок задан в DIRECTION_SCENES. Первый —
 * мастер (первый экран, монитор, нарезки), последний — финал, середина — пул
 * мозаики, тезиса и этапа «съёмка».
 */
const SCENE = sceneFramesFor('content-production')
const MASTER: Frame = SCENE[0] ?? null
const CLOSING: Frame = SCENE.length > 1 ? (SCENE[SCENE.length - 1] ?? null) : null
const POOL = SCENE.slice(1, -1)
const THESIS_FRAME: Frame = POOL.length > 0 ? (POOL[8 % POOL.length] ?? MASTER) : MASTER
const SHOT_FRAME: Frame = POOL.length > 0 ? (POOL[9 % POOL.length] ?? MASTER) : MASTER

/**
 * Одна строка sizes на весь мастер-кадр: первый экран, монитор и карточки
 * выбирают из srcset один и тот же файл, и картинка скачивается один раз.
 */
const MASTER_SIZES = '(min-width: 1024px) 58vw, 100vw'
const FULL_RECT: CropRect = { x: 0, y: 0, w: 100, h: 100 }

const pad = (value: number) => String(value).padStart(2, '0')
const delay = (ms: number) => ({ '--dc-d': `${ms}ms` }) as CSSProperties
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
/** Точка над «Ё» и скобка «Й» выше капители: такой строке нужен воздух сверху */
const hasDiacritic = (word: string) => /[ёй]/i.test(word)

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

/** Выдачи уже лежат в порядке выхода: по ним линейка находит, что показывает монитор */
const ORDER = CONTENT_PLAN
const EMPTY_OUTPUT = { label: '', text: '' }
const outputAt = (index: number) => CONTENT_PAGE.outputs[index] ?? EMPTY_OUTPUT
const WEEK_NUMBERS = Array.from({ length: CONTENT_WEEKS }, (_, index) => index + 1)
const trackRow = (id: string) => CONTENT_TRACKS.findIndex(track => track.id === id) + 1
/** Доля скролла сцены, на которой линия стоит в начале и в конце квартала */
const PHASE_FROM = 0.05
const PHASE_TO = 0.95

/**
 * Окна, в которых sticky-сцена не помещается: монитор ужался бы до полоски.
 * Строка та же, что в @media content-page.css (.dir-content-nle).
 */
const FLOW_QUERY =
  '(max-height: 559px), (max-width: 39.99rem) and (max-height: 789px), (min-width: 40rem) and (max-width: 63.99rem) and (max-height: 829px)'

function useMatch(query: string) {
  const [match, setMatch] = useState(false)
  useEffect(() => {
    const list = window.matchMedia(query)
    const sync = () => setMatch(list.matches)
    sync()
    list.addEventListener('change', sync)
    return () => list.removeEventListener('change', sync)
  }, [query])
  return match
}

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
 * 0 — верх секции на высоте `from` экрана (доля высоты), 1 — низ секции на
 * высоте `to`. Пары: (0, 0) — «уход» с первого экрана; (0, 1) — sticky-сцена,
 * верх у верха, низ у низа; (0.86, 0.46) — секция проходит «линию чтения».
 */
function useSectionProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  from: number,
  to: number
) {
  const progress = useMotionValue(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    let raf = 0
    let near = true
    const read = () => {
      raf = 0
      const rect = node.getBoundingClientRect()
      const vh = window.innerHeight
      const range = vh * (from - to) + rect.height
      progress.set(range > 0 ? clamp01((vh * from - rect.top) / range) : 0)
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
  }, [ref, from, to, progress])
  return progress
}

/**
 * Без курсора строку или карточку зажигает положение на экране. Состояние
 * лежит в data-lit, а не в React: карточки не перерисовываются на каждом скролле.
 */
function useTouchLit<T extends HTMLElement>(ref: RefObject<T | null>, count: number) {
  useEffect(() => {
    const list = ref.current
    if (!list || typeof IntersectionObserver === 'undefined') return
    const touch = window.matchMedia('(hover: none)')
    let observer: IntersectionObserver | null = null

    const connect = () => {
      observer?.disconnect()
      observer = null
      const items = list.querySelectorAll<HTMLElement>('[data-lit-item]')
      items.forEach(item => item.removeAttribute('data-lit'))
      if (!touch.matches) return
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            ;(entry.target as HTMLElement).dataset.lit = String(entry.isIntersecting)
          }
        },
        { rootMargin: '-34% 0px -34% 0px', threshold: 0 }
      )
      items.forEach(item => observer?.observe(item))
    }

    connect()
    touch.addEventListener('change', connect)
    return () => {
      touch.removeEventListener('change', connect)
      observer?.disconnect()
    }
  }, [ref, count])
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
          objectPosition={frame.position}
          className="h-full w-full"
        />
      ) : (
        <Plate lit={lit} />
      )}
    </span>
  )
}

/**
 * Монитор: мастер-кадр затемнён, текущая нарезка светлая и в красной рамке с
 * меткой. Размер задаёт обёртка: у сцены — высота окна, у вопросов — колонка.
 */
function MonitorView({ frame, rect, tag }: { frame: Frame; rect: CropRect; tag: string }) {
  return (
    <div className="dir-content-mon">
      <Registered frame={frame} rect={FULL_RECT} />
      <span aria-hidden="true" className="dir-content-mon-dim" />
      <div aria-hidden="true" className="dir-content-mon-lit" style={{ clipPath: clipOf(rect) }}>
        <Registered frame={frame} rect={FULL_RECT} lit />
      </div>
      <span
        aria-hidden="true"
        className="dir-content-mon-box"
        style={{
          left: `${rect.x}%`,
          top: `${rect.y}%`,
          width: `${rect.w}%`,
          height: `${rect.h}%`,
        }}
      >
        <span className="dir-content-mon-tag dir-kit-meta font-mono uppercase tabular-nums">
          {tag}
        </span>
      </span>
    </div>
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
  // Работает и с пальцем, и с колесом; распад заканчивается на ~60% ухода экрана,
  // чтобы на телефоне он был виден за первые же сотни пикселей. В CSS при
  // сниженном движении переменная игнорируется
  const scrollYProgress = useSectionProgress(heroRef, 0, 0)
  useMotionValueEvent(scrollYProgress, 'change', value => {
    stageRef.current?.style.setProperty('--dc-spread', clamp01(value * 1.7).toFixed(3))
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

      <div className="dir-content-herogrid grid flex-1 items-center gap-x-10 gap-y-9 px-6 pb-10 pt-24 md:px-10 lg:grid-cols-12 lg:px-20 lg:pb-12 lg:pt-28">
        <div className="lg:col-span-6 xl:col-span-5">
          <p className={`${KIT_KICKER} dir-content-rise`} style={delay(0)}>
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-accent" />
            <span>
              {hero.meta}
              <span aria-hidden="true" className="mx-2.5 text-accent">
                /
              </span>
              {hero.places.split(' · ').map((place, index) => (
                <span key={place}>
                  {index > 0 ? ' · ' : ''}
                  <span className={place.includes('-') ? 'whitespace-nowrap' : undefined}>
                    {place}
                  </span>
                </span>
              ))}
            </span>
          </p>

          {/* H1 — название направления, коротко и с ключевой фразой; хук ниже — визуальная строка */}
          <h1
            className="dir-content-h1 dir-content-rise mt-6 font-stage text-[clamp(1rem,4.5vw,1.25rem)] uppercase leading-[1.2] tracking-[0.06em] text-white md:mt-8 lg:text-[clamp(1.05rem,1.45vw,1.45rem)]"
            style={delay(40)}
          >
            {hero.title}
          </h1>

          {/* Интерлиньяж 1: точка над «Ё» в «съёмка» не упирается в строку выше */}
          <p className="dir-content-hook mt-4 font-stage text-[clamp(2.6rem,14.6vw,5.25rem)] uppercase leading-[1] tracking-[-0.04em] text-white sm:text-[clamp(2.1rem,9.3vw,5.25rem)] md:mt-5 lg:text-[clamp(3.4rem,min(6.3vw,11svh),7.75rem)]">
            <span className="block">
              {hero.hook[0].map((word, position) => (
                <Fragment key={word}>
                  {position > 0 ? ' ' : null}
                  <span
                    className={`dir-content-rise block sm:inline-block lg:block${
                      hasDiacritic(word) ? ' pt-[0.11em]' : ''
                    }`}
                    style={delay(80 + position * 80)}
                  >
                    {word}
                  </span>
                </Fragment>
              ))}
              <span className="sr-only">,</span>
            </span>{' '}
            <span className="block font-brand-hero">
              {hero.hook[1].map((word, position) => (
                <Fragment key={word}>
                  {position > 0 ? ' ' : null}
                  <span
                    className={`dir-content-rise block sm:inline-block lg:block${
                      position === 0 ? ' text-accent' : ''
                    }${hasDiacritic(word) ? ' pt-[0.11em]' : ''}`}
                    style={delay(240 + position * 80)}
                  >
                    {word}
                  </span>
                </Fragment>
              ))}
            </span>
          </p>

          <p
            className="dir-content-lead dir-content-rise mt-6 max-w-[27rem] font-sans text-base font-light leading-snug text-white/80 [text-wrap:pretty] md:mt-8 md:text-xl"
            style={delay(420)}
          >
            {typo(hero.lead)}
          </p>

          <div
            data-sticky-hide=""
            className="dir-content-rise mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-1 md:mt-10"
            style={delay(520)}
          >
            <DirectionButton
              label={CONTENT_PAGE.ctaLabel}
              onClick={() => page.openBrief('hero')}
              className="w-full sm:w-auto sm:min-w-[19rem]"
            />
            <a href="#sheet" className="dir-content-link whitespace-nowrap text-base">
              Как это работает
              <ArrowDown aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 xl:col-span-7">
          <div className="dir-content-stagebox">
            <div
              aria-hidden="true"
              className="dir-kit-meta mb-3 flex items-center justify-between gap-4 font-mono uppercase tabular-nums text-white/60"
            >
              <span className="truncate">
                Мастер-кадр{isCredited(frame) ? `: ${frame.client}` : ''}
              </span>
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
                      objectPosition={frame.position}
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
                        // Вспышка в момент, когда линия развёртки доходит до левого края
                        // нарезки — уже со сдвигом распада, а не по месту в мастере
                        '--t': `${Math.max(0.12, ((item.rect.x + item.drift.x) / 100) * 9).toFixed(
                          2
                        )}s`,
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
                      className="dir-content-cut-tag dir-kit-meta font-mono uppercase tabular-nums"
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
              <span className="dir-kit-meta font-mono uppercase tabular-nums text-white/70">
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
              <dt className="dir-kit-meta font-mono uppercase text-white/60">{item.label}</dt>
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [week, setWeek] = useState(1)
  const flow = useMatch(FLOW_QUERY)
  const flowRef = useRef(false)
  useLive(hintRef)

  const progress = useSectionProgress(sectionRef, 0, 1)
  // Линия воспроизведения: 0 — начало первой недели, 1 — конец тринадцатой.
  // В закреплённой сцене её ведёт скролл, в свободной (низкое окно) — выбор блока
  const phase = useMotionValue(0)
  const playheadX = useTransform(phase, value => `${(value * 100).toFixed(2)}%`)

  useEffect(() => {
    flowRef.current = flow
    phase.set(flow ? 0 : clamp01((progress.get() - PHASE_FROM) / (PHASE_TO - PHASE_FROM)))
  }, [flow, phase, progress])

  useMotionValueEvent(progress, 'change', value => {
    if (flowRef.current) return
    phase.set(clamp01((value - PHASE_FROM) / (PHASE_TO - PHASE_FROM)))
  })

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
    // На телефоне линейка шире экрана и едет под линией: в начале квартала видны
    // первые недели, в конце — последние, а сама линия проходит видимую часть
    const scroller = scrollRef.current
    if (scroller && scroller.scrollWidth > scroller.clientWidth + 1) {
      scroller.scrollLeft = value * (scroller.scrollWidth - scroller.clientWidth)
    }
  })

  // Нажатие на блок ведёт линию к началу этой выдачи: в закреплённой сцене
  // прокручивает её, в свободной двигает линию. Клавиатура и палец получают
  // то же, что колесо
  const select = useCallback(
    (plan: OutputPlan, instant = false) => {
      const section = sectionRef.current
      if (!section) return
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const target = (plan.week - 1 + 0.35) / CONTENT_WEEKS
      if (flowRef.current) {
        if (calm || instant) phase.set(target)
        else animate(phase, target, { duration: 0.6, ease: [0.16, 1, 0.3, 1] })
        return
      }
      const range = section.offsetHeight - window.innerHeight
      const top =
        section.getBoundingClientRect().top +
        window.scrollY +
        (PHASE_FROM + target * (PHASE_TO - PHASE_FROM)) * range
      window.scrollTo({ top, behavior: calm || instant ? 'auto' : 'smooth' })
    },
    [phase]
  )

  const current = ORDER[active] ?? ORDER[0]
  const output = outputAt(current.output)
  const stateOf = (index: number) => (index < active ? 'past' : index === active ? 'now' : 'next')

  return (
    <section
      id="sheet"
      ref={sectionRef}
      aria-labelledby="dir-content-scene-title"
      className="dir-content-nle"
    >
      <div className="dir-content-nle-stage">
        <div aria-hidden="true" className="dir-content-paper" />

        <div className="dir-content-nle-main">
          <header className="dir-content-nle-head">
            <p className={KIT_KICKER}>
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              01 / Монтажный лист
            </p>
            <h2 id="dir-content-scene-title" className={`${KIT_TITLE} dir-content-nle-title`}>
              {setTitle(scene.title)}
            </h2>
            <p className="dir-content-nle-lead dir-kit-meta font-mono uppercase leading-relaxed tabular-nums text-white/60">
              {typo(scene.lead)}
            </p>
          </header>

          <div className="dir-content-nle-mon">
            <p
              aria-hidden="true"
              className="dir-kit-meta mb-3 flex shrink-0 items-center justify-between gap-4 font-mono uppercase tabular-nums text-white/60"
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
                {flow ? 'Нажмите на блок' : 'Листайте'}
              </span>
            </p>
            <div className="dir-content-mon-wrap">
              <MonitorView
                frame={frame}
                rect={current.rect}
                tag={`${pad(current.output + 1)} ${output.label}`}
              />
            </div>
          </div>

          <div aria-hidden="true" className="dir-content-nle-cap" data-cap="">
            <div key={current.output} className="dir-content-swap">
              <p
                className="dir-kit-meta font-mono uppercase tabular-nums text-white/60"
                data-cap-meta=""
              >
                <span className="text-accent">{pad(current.output + 1)}</span>
                {` / ${pad(CONTENT_PAGE.outputs.length)} · ${current.track} · Н${weekRange(current)}`}
                {current.note ? ` · ${current.note}` : ''}
              </p>
              <p
                className="dir-content-cap-label font-stage uppercase leading-[0.92] tracking-[-0.03em] text-white"
                data-cap-label=""
              >
                {output.label}
              </p>
              <p className="dir-content-cap-text text-white/75 [text-wrap:pretty]" data-cap-text="">
                {typo(output.text)}
              </p>
            </div>
          </div>
        </div>

        <div className="dir-content-nle-foot">
          <div className="dir-content-tl" style={{ '--dc-week': CONTENT_WEEKS } as CSSProperties}>
            <div ref={scrollRef} className="dir-content-tl-scroll">
              <div className="dir-content-tl-inner">
                <div aria-hidden="true" className="dir-content-tl-head">
                  <span className="dir-content-tl-corner dir-kit-meta font-mono uppercase">
                    <span className="md:hidden">Нед.</span>
                    <span className="hidden md:inline">Неделя</span>
                  </span>
                  <div className="dir-content-tl-weeks dir-kit-meta font-mono tabular-nums">
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

                {/* Блоки идут в порядке выхода, а не по дорожкам: так Tab ведёт по времени */}
                <div className="dir-content-tl-body">
                  {CONTENT_TRACKS.map((track, row) => (
                    <Fragment key={track.id}>
                      <span
                        aria-hidden="true"
                        className="dir-content-tl-label"
                        style={{ gridRow: row + 1 }}
                      >
                        <b className="dir-kit-meta font-mono">{track.id}</b>
                        <i className="dir-kit-meta font-mono uppercase">{track.note}</i>
                      </span>
                      <span
                        aria-hidden="true"
                        className="dir-content-tl-lane"
                        data-track={track.id}
                        style={{ gridRow: row + 1 }}
                      />
                    </Fragment>
                  ))}

                  {ORDER.map((plan, index) =>
                    plan.sound ? (
                      <div
                        key={`a-${plan.output}`}
                        aria-hidden="true"
                        className="dir-content-aclip"
                        data-state={stateOf(index)}
                        style={{ gridColumn: `${plan.week + 1} / span ${plan.span}`, gridRow: 3 }}
                      >
                        <Wave seed={plan.output + 1} />
                      </div>
                    ) : null
                  )}

                  {ORDER.map((plan, index) => (
                    <button
                      key={plan.output}
                      type="button"
                      className="dir-content-clip"
                      data-state={stateOf(index)}
                      aria-current={index === active ? 'true' : undefined}
                      aria-label={`${outputAt(plan.output).label}${
                        plan.note ? `, ${plan.note}` : ''
                      }: выдача ${plan.output + 1}, недели ${weekRange(plan)}`}
                      style={{
                        gridColumn: `${plan.week + 1} / span ${plan.span}`,
                        gridRow: trackRow(plan.track),
                      }}
                      onClick={() => select(plan)}
                      onFocus={event => {
                        // Фокус с клавиатуры двигает монитор сразу, не дожидаясь Enter
                        let keyboard = false
                        try {
                          keyboard = event.currentTarget.matches(':focus-visible')
                        } catch {
                          keyboard = false
                        }
                        if (keyboard) select(plan, true)
                      }}
                    >
                      <span className="dir-kit-meta font-mono tabular-nums">
                        {pad(plan.output + 1)}
                      </span>
                      <span className="dir-content-clip-name dir-kit-meta font-mono uppercase">
                        {outputAt(plan.output).label}
                      </span>
                    </button>
                  ))}
                </div>

                <div aria-hidden="true" className="dir-content-ph-rail">
                  <motion.div className="dir-content-ph" style={{ x: playheadX }}>
                    <span className="dir-content-ph-flag dir-kit-meta font-mono tabular-nums">
                      Н{pad(week)}
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          <p data-scene-note="" className="dir-content-tl-note dir-kit-meta font-mono uppercase">
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
    <div ref={ref} aria-hidden="true" className="dir-content-splice">
      <span className="dir-kit-meta font-mono uppercase tabular-nums text-white/55">
        CUT {from}
      </span>
      <span className="dir-content-splice-line" />
      <span className="dir-content-splice-mark" />
      <span className="dir-content-splice-line" />
      <span className="dir-kit-meta font-mono uppercase tabular-nums text-white/55">{to}</span>
    </div>
  )
}

/* ─────────────────────────── 3. Состав выдачи ─────────────────────────── */

/**
 * Кадр карточки мозаики: свой кадр сцены, своё кадрирование и тон (CONTENT_LOOKS).
 * Вертикальные и квадратные карточки уже широких, поэтому им нужен меньший
 * sizes — иначе браузер возьмёт из srcset лишнюю ширину.
 */
const WIDE_SIZES = '(min-width: 1024px) 50vw, (min-width: 640px) 100vw, 82vw'
const NARROW_SIZES = '(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 82vw'

function Outputs({ frame, pool }: { frame: Frame; pool: SceneFrame[] }) {
  const page = useDirectionPage()
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
            className={`${KIT_TITLE} mt-5 text-[clamp(1.5rem,8.2vw,2rem)] sm:text-[clamp(2rem,5.4vw,5.25rem)]`}
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
        className="dir-kit-meta mt-12 flex items-center justify-between gap-6 border-t border-white/15 pt-4 font-mono uppercase tabular-nums text-white/60 md:mt-16"
      >
        <span className="whitespace-nowrap">
          Лист 01<span className="mx-2.5 text-accent">/</span>
          {pad(outputs.length)} кадров
        </span>
        <span className="hidden truncate md:block">Кадры показывают форматы</span>
        <span className="whitespace-nowrap text-white/80 md:hidden">Листайте →</span>
      </p>

      <ul role="list" aria-label="Состав выдачи" className="dir-content-grid mt-4" data-reveal="">
        {outputs.map((output, index) => {
          const plan = CONTENT_PLAN.find(item => item.output === index)
          if (!plan) return null
          const look = CONTENT_LOOKS[index % CONTENT_LOOKS.length] ?? CONTENT_LOOKS[0]
          const shot =
            look?.pick === 'master' || pool.length === 0
              ? frame
              : (pool[(look?.pick ?? 0) % pool.length] ?? frame)
          const narrow = plan.aspect < 1.2
          return (
            <li
              key={`${output.label}-${index}`}
              className="dir-content-card"
              data-k={plan.slot}
              data-tone={look?.tone ?? 'natural'}
              style={{ '--ar': plan.aspect.toFixed(4) } as CSSProperties}
            >
              <div className="dir-content-card-top dir-kit-meta flex items-baseline justify-between gap-3 font-mono uppercase tabular-nums">
                <span className="dir-content-card-idx">{pad(index + 1)}</span>
                <span className="dir-content-card-week">
                  {plan.track} · Н{weekRange(plan)}
                </span>
              </div>

              <div aria-hidden="true" className="dir-content-card-frame">
                <div
                  className="dir-content-card-zoom"
                  style={
                    {
                      '--zoom': look?.zoom ?? 1,
                      transformOrigin: look?.pos ?? '50% 50%',
                    } as CSSProperties
                  }
                >
                  {shot ? (
                    <Still
                      src={shot.src}
                      alt=""
                      sizes={narrow ? NARROW_SIZES : WIDE_SIZES}
                      objectPosition={look?.pos}
                      className="h-full w-full"
                    />
                  ) : (
                    <Plate lit />
                  )}
                </div>
                <span className="dir-content-card-shade" />
              </div>

              <div className="dir-content-card-copy">
                <h3 className="dir-content-card-title flex flex-wrap items-baseline gap-x-3 font-stage uppercase leading-none tracking-[-0.02em] text-white">
                  {output.label}{' '}
                  {plan.note ? (
                    <span className="dir-kit-meta font-mono font-normal normal-case tracking-[0.08em] text-white/70">
                      {plan.note}
                    </span>
                  ) : null}
                </h3>
                <p className="dir-content-card-text mt-3 text-sm leading-relaxed text-white/80 [text-wrap:pretty] md:text-[0.9375rem]">
                  {typo(output.text)}
                </p>
              </div>
            </li>
          )
        })}

        <li className="dir-content-card dir-content-own" data-k="i">
          <div className="dir-content-card-top dir-kit-meta flex items-baseline justify-between gap-3 font-mono uppercase tabular-nums">
            <span className="dir-content-card-idx">{pad(outputs.length + 1)}</span>
            <span className="dir-content-card-week">Ваш формат</span>
          </div>
          <div className="dir-content-own-body">
            <p className="dir-content-own-plus font-stage" aria-hidden="true">
              +
            </p>
            <div className="dir-content-own-copy">
              <p className="max-w-[26ch] text-base leading-snug text-white/80 [text-wrap:pretty] md:text-lg">
                {typo('Другая пропорция, длина или площадка: соберём набор под ваш план.')}
              </p>
              <DirectionButton
                label="Собрать набор"
                variant="ghost"
                onClick={() => page.openBrief('outputs')}
                className="mt-5 w-full sm:w-auto sm:min-w-[15rem]"
              />
            </div>
          </div>
        </li>
      </ul>

      <p className="dir-kit-meta mt-5 max-w-2xl font-mono uppercase leading-relaxed text-white/60">
        {typo(
          'Кадры показывают форматы, а не один заказ. Недели в карточках — схема порядка выдачи, не график. Даты фиксируем до съёмки.'
        )}
      </p>
    </section>
  )
}

/* ─────────────────────────── Тезис: полноэкранный кадр ─────────────────────────── */

/** Тайм-код тезиса идёт по скроллу от 00:00:00:00 до восьми секунд на выходе секции */
const THESIS_FRAMES = 8 * 24

/**
 * Пауза между мозаикой и схемами: один кадр на весь экран и тезис страницы.
 * Кадр медленно сдвигается и приближается вместе со скроллом (translate и scale
 * слоя, не размер), тайм-код в углу идёт с 00:00:00:00. Текст и подложка стоят
 * на месте: читаются на любом кадре, светлом и тёмном.
 */
function Thesis({ frame }: { frame: Frame }) {
  const thesis = CONTENT_PAGE.thesis
  const ref = useRef<HTMLElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  const progress = useSectionProgress(ref, 1, 0)
  useMotionValueEvent(progress, 'change', value => {
    ref.current?.style.setProperty('--dc-p', value.toFixed(3))
    if (tcRef.current) tcRef.current.textContent = timecode(Math.round(value * THESIS_FRAMES))
  })

  return (
    <section
      ref={ref}
      aria-labelledby="dir-content-thesis-title"
      className="dir-content-th relative isolate flex items-end overflow-hidden bg-[#000000] px-6 pb-14 pt-36 md:px-10 md:pb-20 lg:px-20"
    >
      <div aria-hidden="true" className="dir-content-th-img">
        {frame ? (
          <Still
            src={frame.src}
            alt=""
            sizes="100vw"
            quality={65}
            objectPosition={frame.position ?? '50% 38%'}
            className="h-full w-full"
          />
        ) : (
          <Plate lit />
        )}
      </div>
      <span aria-hidden="true" className="dir-content-th-shade" />
      <span aria-hidden="true" className="dir-content-th-corners">
        <i />
        <i />
        <i />
        <i />
      </span>
      <p
        aria-hidden="true"
        className="dir-content-th-meta dir-kit-meta font-mono uppercase tabular-nums text-white/80"
      >
        <span>
          TC <span ref={tcRef}>00:00:00:00</span>
        </span>
        <span>16:9</span>
      </p>

      <div className="dir-content-th-copy relative">
        <p className={KIT_KICKER}>
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          {thesis.kicker}
        </p>
        <h2
          id="dir-content-thesis-title"
          className="dir-content-th-title mt-5 font-stage uppercase leading-[1.02] tracking-[-0.035em] text-white [text-wrap:balance]"
        >
          <span data-reveal="" className="block">
            {typo(thesis.lines[0])}
          </span>{' '}
          <span
            data-reveal=""
            style={{ '--reveal-delay': '120ms' } as CSSProperties}
            className="block font-brand-hero text-accent"
          >
            {typo(thesis.lines[1])}
          </span>
        </h2>
        <p
          data-reveal=""
          style={{ '--reveal-delay': '240ms' } as CSSProperties}
          className="mt-6 max-w-[34rem] text-base leading-relaxed text-white/85 [text-wrap:pretty] md:text-lg"
        >
          {typo(thesis.text)}
        </p>
      </div>
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
          <span className="dir-content-dg-cap dir-kit-meta left-[9%] top-[5%] font-mono uppercase">
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
          <span className="dir-content-dg-cap dir-kit-meta left-[7%] top-[26%] font-mono uppercase">
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
          <span className="dir-content-dg-cap dir-kit-meta left-[7%] top-[8%] font-mono uppercase">
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
          <span className="dir-content-dg-cap dir-kit-meta bottom-[4%] right-[7%] font-mono uppercase">
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

/**
 * Светлый лист между чёрными сценами (--dir-paper): схемы читаются как чертёж
 * на бумаге, а не как ещё один экран интерфейса. Overflow на самой секции не
 * ставим — мягкая кромка бумаги рисуется снаружи.
 */
function Audiences() {
  // Колонки ступенькой: каждая следующая ниже, глаз идёт по диагонали
  const steps = ['', 'md:mt-14', 'md:mt-28']
  return (
    <section
      aria-labelledby="dir-content-audiences-title"
      className="dir-paper-section dir-content-aud relative px-6 py-20 md:px-10 md:py-32 lg:px-20"
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

      <ul role="list" className="mt-12 grid gap-14 md:mt-16 md:grid-cols-3 md:gap-x-6 lg:gap-x-14">
        {CONTENT_PAGE.audiences.map((item, index) => (
          <li key={item.title} data-reveal="" className={steps[index]}>
            <Diagram kind={item.kind} />
            <p
              aria-hidden="true"
              className="dir-kit-meta dir-content-aud-cap mt-3 font-mono uppercase tabular-nums"
            >
              {DIAGRAM_CAPTIONS[item.kind]}
            </p>
            <h3 className="dir-content-aud-h3 mt-6 font-stage text-[1.35rem] uppercase leading-[1.04] tracking-[-0.02em] [text-wrap:balance] md:text-[clamp(1.125rem,1.95vw,1.85rem)]">
              {setTitle(item.title)}
            </h3>
            <p className="dir-content-aud-text mt-4 max-w-[36ch] text-[0.9375rem] leading-relaxed [text-wrap:pretty] md:text-base">
              {typo(item.text)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─────────────────────────── 5. Кадры из работ ─────────────────────────── */

/**
 * Работы студии контактным листом: у каждой свой кадр, клиент крупно, номер
 * клипа. Кадр приглушён и «зажигается» у карточки под курсором или фокусом, а
 * на телефоне — у карточки, которая проходит через середину экрана.
 */
function Reel({ index, works }: { index: string; works: DirectionPageWork[] }) {
  const page = useDirectionPage()
  const listRef = useRef<HTMLUListElement>(null)
  useTouchLit(listRef, works.length)

  return (
    <section
      aria-labelledby="dir-content-reel-title"
      className="relative overflow-hidden border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div aria-hidden="true" className="dir-content-paper" />
      <div className="relative flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div>
          <p className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            {index} / Работы
          </p>
          <h2
            id="dir-content-reel-title"
            data-reveal=""
            className={`${KIT_TITLE} ${KIT_TITLE_SIZE} mt-5`}
          >
            {setTitle('Кадры из работ')}
          </h2>
        </div>
        <p className="dir-kit-meta max-w-xs font-mono uppercase leading-relaxed text-white/60">
          Работы студии
        </p>
      </div>

      <ul ref={listRef} role="list" className="dir-content-reel relative mt-10 md:mt-14">
        {works.map((work, position) => {
          const excerpt = firstSentence(work.description)
          return (
            <li key={work.slug} data-reveal="" data-count={works.length}>
              <Link
                href={`/projects/${work.slug}`}
                prefetch={false}
                data-lit-item=""
                onClick={() => page.openCase(work.slug)}
                className="dir-content-rc"
              >
                <span
                  aria-hidden="true"
                  className="dir-content-rc-meta dir-kit-meta font-mono uppercase tabular-nums"
                >
                  <span>Клип {pad(position + 1)}</span>
                  <span>{work.year ?? ''}</span>
                </span>
                <span aria-hidden="true" className="dir-content-rc-frame">
                  {work.posterUrl ? (
                    <Still
                      src={work.posterUrl}
                      alt=""
                      sizes={position === 0 ? MASTER_SIZES : '(min-width: 1024px) 34vw, 100vw'}
                      className="absolute inset-0 h-full w-full"
                    />
                  ) : (
                    <Plate lit />
                  )}
                  <span className="dir-content-rc-dim" />
                  <span className="dir-content-rc-open dir-kit-meta font-mono uppercase">
                    Открыть проект
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </span>
                <span className="dir-content-rc-name font-stage uppercase">{work.client}</span>
                <span className="dir-content-rc-title">{typo(work.title)}</span>
                {excerpt ? (
                  <span className="dir-content-rc-note [text-wrap:pretty]">{typo(excerpt)}</span>
                ) : null}
              </Link>
            </li>
          )
        })}
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
      data-sticky-hide=""
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
            className={`${KIT_TITLE} mt-5 text-[clamp(1.4rem,7.2vw,3.9rem)] lg:text-[clamp(2.2rem,4vw,3.9rem)]`}
          >
            {setTitle(cta.title)}
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 [text-wrap:pretty] md:text-lg">
            {typo(cta.text)}
          </p>
        </div>

        <div data-reveal="" className="dir-content-render lg:col-span-5">
          <div className="border border-white/25 bg-[#080808]">
            <p className="dir-kit-meta flex items-center justify-between border-b border-white/15 px-5 py-3 font-mono uppercase text-white/60 md:px-6">
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
                    <dt className="dir-kit-meta font-mono uppercase text-white/60">{label}</dt>
                    <i aria-hidden="true" />
                    <dd className="text-right text-sm text-white md:text-base">{typo(value)}</dd>
                  </div>
                ))}
              </dl>
              <DirectionButton
                label={cta.label}
                onClick={() => page.openBrief('proof')}
                className="mt-4 w-full"
              />
              <div aria-hidden="true" className="dir-content-render-bar" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Нарезка мастер-кадра под призывом процесса: крупная, в рамке с метками */
const PCTA_RECT: CropRect = { x: 14, y: 12, w: 72, h: 62 }

/** После процесса: крупная нарезка мастер-кадра и кнопка «начнём с плана» */
function ProcessCta({ frame }: { frame: Frame }) {
  const page = useDirectionPage()
  const cta = CONTENT_PAGE.cta.process
  const ref = useRef<HTMLElement>(null)
  useArrival(ref)
  return (
    <section
      ref={ref}
      aria-labelledby="dir-content-process-cta-title"
      data-sticky-hide=""
      className="dir-content-pcta relative overflow-hidden border-t border-white/10 bg-[#000000] px-6 py-16 md:px-10 md:py-24 lg:px-20"
    >
      <div aria-hidden="true" className="dir-content-paper" />
      <div className="relative grid items-center gap-10 lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-7">
          <p className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            {cta.kicker}
          </p>
          <h2
            id="dir-content-process-cta-title"
            data-reveal=""
            className="dir-content-pcta-title mt-5 font-brand-hero text-[clamp(2rem,9.5vw,4.25rem)] uppercase leading-[1] tracking-[-0.035em] text-white [text-wrap:balance] lg:text-[clamp(2.4rem,4.3vw,4.6rem)]"
          >
            {typo(cta.title)}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 [text-wrap:pretty] md:text-lg">
            {typo(cta.text)}
          </p>
          <DirectionButton
            label={cta.label}
            onClick={() => page.openBrief('process')}
            className="mt-8 w-full md:mt-10 lg:w-auto lg:min-w-[20rem]"
          />
        </div>

        <div
          aria-hidden="true"
          className="dir-content-pcta-crop order-first lg:order-none lg:col-span-5"
        >
          <div className="dir-content-pcta-frame">
            <Registered frame={frame} rect={PCTA_RECT} lit />
            <span className="dir-content-pcta-shade" />
            <span className="dir-content-pcta-corners">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="dir-content-pcta-tag dir-kit-meta font-mono uppercase tabular-nums">
              Мастер-кадр
              <b>{CONTENT_PAGE.outputs.length} нарезок</b>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── 6. Процесс ─────────────────────────── */

/** Высоты столбиков недель в схеме плана: ритм выдач, а не данные */
const PLAN_BARS = [0.55, 0.85, 0.42, 0.7, 0.5, 0.92, 0.46, 0.76] as const

/**
 * Маленький кадр или схема этапа: пять одинаковых карточек процесса получили
 * каждая свой образ. План — ритм выдач по неделям; раскадровка — мастер-кадр с
 * четырьмя нарезками; съёмка — кадр в видоискателе; монтаж — мини-линейка из
 * плана квартала; передача — восемь выдач в своих пропорциях. Декор: текст
 * этапа уже в заголовке и абзаце.
 */
function StepArt({ position, master, still }: { position: number; master: Frame; still: Frame }) {
  if (position === 0) {
    return (
      <>
        <span className="dir-content-art-bars">
          {ORDER.map((plan, index) => (
            <i
              key={plan.output}
              style={
                {
                  gridColumn: plan.week,
                  height: `${(PLAN_BARS[index] ?? 0.5) * 100}%`,
                } as CSSProperties
              }
            />
          ))}
        </span>
        <span className="dir-content-art-ticks" />
        <span className="dir-content-art-cap dir-kit-meta font-mono uppercase">
          Неделя 01 — {CONTENT_WEEKS}
        </span>
      </>
    )
  }

  if (position === 1) {
    return (
      <span className="dir-content-art-board">
        <Registered frame={master} rect={FULL_RECT} />
        <span className="dir-content-art-dim" />
        {CONTENT_HERO_CUTS.map(cut => (
          <span
            key={cut.key}
            className="dir-content-art-cut"
            style={{
              left: `${cut.rect.x}%`,
              top: `${cut.rect.y}%`,
              width: `${cut.rect.w}%`,
              height: `${cut.rect.h}%`,
            }}
          >
            <Registered frame={master} rect={cut.rect} lit />
          </span>
        ))}
      </span>
    )
  }

  if (position === 2) {
    return (
      <span className="dir-content-art-shot">
        {still ? (
          <Still
            src={still.src}
            alt=""
            sizes="(min-width: 1024px) 20vw, 50vw"
            objectPosition={still.position}
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <Plate lit />
        )}
        <span className="dir-content-art-shade" />
        <span className="dir-content-pcta-corners">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="dir-content-art-reticle" />
      </span>
    )
  }

  if (position === 3) {
    return (
      <span className="dir-content-art-nle">
        {ORDER.map(plan => (
          <i
            key={plan.output}
            data-track={plan.track}
            style={{
              gridColumn: `${plan.week} / span ${plan.span}`,
              gridRow: plan.track === 'V2' ? 1 : 2,
            }}
          />
        ))}
        {ORDER.filter(plan => plan.sound).map(plan => (
          <b
            key={plan.output}
            style={{ gridColumn: `${plan.week} / span ${plan.span}`, gridRow: 3 }}
          />
        ))}
        <em />
      </span>
    )
  }

  // Две строки: в каждой кадры встают в одну высоту сами, по своим пропорциям
  return (
    <span className="dir-content-art-out">
      {[ORDER.slice(0, 4), ORDER.slice(4)].map((row, rowIndex) => (
        <span key={rowIndex} className="dir-content-art-row">
          {row.map(plan => (
            <i key={plan.output} style={{ '--ar': plan.aspect.toFixed(4) } as CSSProperties}>
              {plan.aspect >= 0.75 ? (
                <b className="dir-kit-meta font-mono tabular-nums">{pad(plan.output + 1)}</b>
              ) : null}
            </i>
          ))}
        </span>
      ))}
    </span>
  )
}

/**
 * Этапы процесса на дорожках: подготовка делит одну дорожку, дальше каждый
 * этап спускается ниже, как блоки на линейке. Красная линия идёт по этапам
 * вместе со скроллом, текущий этап зажигается. Это порядок, не сроки.
 * На узком экране дорожки складываются в ступенчатый список.
 */
function Sequence({
  steps,
  stops,
  master,
  still,
}: {
  steps: ProcessStep[]
  stops: string[]
  master: Frame
  still: Frame
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastIndex = useRef(-2)
  const progress = useSectionProgress(ref, 0.86, 0.46)

  const apply = useCallback(
    (value: number) => {
      const node = ref.current
      if (!node) return
      const count = steps.length
      const index = value <= 0.001 ? -1 : Math.min(count - 1, Math.floor(value * count))
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      // Сниженное движение: линия не ползёт, а встаёт на середину текущего этапа
      const place = calm ? Math.max(0, (index + 0.5) / count) : value
      node.style.setProperty('--p', place.toFixed(4))
      if (index === lastIndex.current) return
      lastIndex.current = index
      node.querySelectorAll<HTMLElement>('[data-step]').forEach((item, position) => {
        item.dataset.state = position < index ? 'done' : position === index ? 'now' : 'todo'
      })
    },
    [steps.length]
  )

  useMotionValueEvent(progress, 'change', apply)
  useEffect(() => apply(progress.get()), [apply, progress])

  return (
    <div ref={ref} className="dir-content-seq" style={{ '--n': steps.length } as CSSProperties}>
      <div aria-hidden="true" className="dir-content-seq-lanes">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div aria-hidden="true" className="dir-content-seq-ph">
        <i />
      </div>
      <ol role="list" className="dir-content-seq-list">
        {steps.map((step, position) => (
          <li
            key={step.number}
            data-step=""
            className="dir-content-seq-step"
            style={
              { '--lane': CONTENT_STAGE_LANES[position] ?? 0, '--i': position } as CSSProperties
            }
          >
            <span
              aria-hidden="true"
              className="dir-content-seq-clip dir-kit-meta font-mono uppercase tabular-nums"
            >
              <b>{step.number}</b>
              <span>{stops[position] ?? ''}</span>
            </span>
            <div aria-hidden="true" className="dir-content-seq-art" data-art={position}>
              <StepArt position={position} master={master} still={still} />
            </div>
            <h3 className="dir-content-seq-title">{typo(step.title)}</h3>
            <p className="dir-content-seq-text [text-wrap:pretty]">{typo(step.text)}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Process({
  index,
  title,
  lead,
  master,
  still,
}: {
  index: string
  title: string
  lead: string
  master: Frame
  still: Frame
}) {
  return (
    <section
      aria-labelledby="dir-content-process-title"
      className="relative overflow-hidden border-t border-white/10 bg-[#060606] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div aria-hidden="true" className="dir-content-paper" />
      <div className="relative grid gap-x-16 gap-y-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            {index} / Процесс
          </p>
          <h2
            id="dir-content-process-title"
            data-reveal=""
            className={`${KIT_TITLE} ${KIT_TITLE_SIZE} mt-5`}
          >
            {setTitle(title)}
          </h2>
        </div>
        <p
          data-reveal=""
          className="max-w-md text-base leading-relaxed text-white/70 [text-wrap:pretty] md:text-lg lg:col-span-5"
        >
          {typo(lead)}
        </p>
      </div>

      <div className="relative mt-12 md:mt-16">
        <Sequence
          steps={CONTENT_PAGE.process}
          stops={CONTENT_PAGE.cta.process.stops}
          master={master}
          still={still}
        />
      </div>
    </section>
  )
}

/* ─────────────────────────── 7. Вопросы ─────────────────────────── */

/**
 * Вопросы с мини-монитором: открытый вопрос подсвечивает свой кусок мастер-кадра.
 * Аккордеон по APG (стрелки, Home, End), ответы лежат в DOM целиком. Классы
 * разметки общие с китом направлений, тот же текст уходит в FAQPage.
 */
function Faq({
  index,
  title,
  items,
  frame,
}: {
  index: string
  title: string
  items: FaqItem[]
  frame: Frame
}) {
  const page = useDirectionPage()
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]))
  const [focused, setFocused] = useState(0)

  const toggle = (position: number) => {
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(position)) next.delete(position)
      else next.add(position)
      return next
    })
    setFocused(position)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, position: number) => {
    const triggers = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-faq-trigger]')
    if (!triggers || triggers.length === 0) return
    const last = triggers.length - 1
    const target =
      event.key === 'ArrowDown'
        ? position === last
          ? 0
          : position + 1
        : event.key === 'ArrowUp'
          ? position === 0
            ? last
            : position - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (target === null) return
    event.preventDefault()
    triggers[target]?.focus()
  }

  const plan = CONTENT_PLAN[focused % CONTENT_PLAN.length] ?? CONTENT_PLAN[0]

  return (
    <section
      aria-labelledby="dir-content-faq-title"
      className="relative overflow-hidden border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="relative grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <p className={KIT_KICKER}>
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              {index} / Вопросы
            </p>
            <h2
              id="dir-content-faq-title"
              data-reveal=""
              className={`${KIT_TITLE} mt-5 text-[clamp(1.5rem,2.7vw,2.75rem)]`}
            >
              {setTitle(title)}
            </h2>

            <div aria-hidden="true" className="dir-content-faqmon">
              <p className="dir-kit-meta mb-3 flex items-center justify-between gap-4 font-mono uppercase tabular-nums text-white/60">
                <span>
                  Вопрос {pad(focused + 1)}
                  <span className="mx-2.5 text-accent">/</span>
                  {pad(items.length)}
                </span>
                <span>Мастер-кадр</span>
              </p>
              <MonitorView frame={frame} rect={plan.rect} tag={`Q${pad(focused + 1)}`} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div ref={listRef} data-sticky-hide="desktop">
            {items.map((item, position) => {
              const isOpen = open.has(position)
              const triggerId = `${baseId}-q${position}`
              const panelId = `${baseId}-a${position}`
              return (
                <div key={item.question} data-open={isOpen} className="dir-kit-faq-item">
                  <h3 className="m-0 text-inherit font-inherit">
                    <button
                      type="button"
                      id={triggerId}
                      data-faq-trigger=""
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(position)}
                      onKeyDown={event => onKeyDown(event, position)}
                      className="dir-kit-faq-trigger"
                    >
                      <span
                        aria-hidden="true"
                        className="dir-kit-faq-idx dir-kit-meta font-mono uppercase tabular-nums"
                      >
                        {pad(position + 1)}
                      </span>{' '}
                      <span className="dir-kit-faq-q text-[clamp(1.125rem,1.7vw,1.5rem)] leading-[1.25] tracking-[-0.005em] [text-wrap:balance]">
                        {typo(item.question)}
                      </span>
                      <span aria-hidden="true" className="dir-kit-faq-icon">
                        <span className="dir-kit-faq-glyph" />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    className="dir-kit-faq-panel"
                  >
                    <div>
                      <p className="max-w-[40rem] pb-8 pl-[2.5rem] pr-12 text-[clamp(1rem,1.25vw,1.1875rem)] leading-[1.65] text-white/75 [text-wrap:pretty] md:pb-10 md:pl-[3.75rem] md:pr-16">
                        {typo(item.answer)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-10 md:pl-[3.75rem]">
            <p className="text-sm text-white/60 md:text-base">
              {typo('Нет вашего вопроса? Задайте его в брифе.')}
            </p>
            <button
              type="button"
              onClick={() => page.openBrief('faq')}
              className="group dir-kit-meta inline-flex min-h-11 items-center gap-3 font-mono uppercase text-white underline decoration-white/30 underline-offset-[6px] transition-colors duration-[var(--motion-state)] hover:text-accent hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              К брифу
              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────── Страница ─────────────────────────── */

/**
 * Знак сцены в финале: линейка квартала с восемью выдачами и линией
 * воспроизведения в конце. Декор, стоит на месте: финал не должен двигаться
 * рядом с главной кнопкой.
 */
function EndSign() {
  return (
    <div className="dir-content-end-sign" style={{ '--dc-week': CONTENT_WEEKS } as CSSProperties}>
      <p className="dir-kit-meta flex justify-between font-mono uppercase tabular-nums text-white/70">
        <span>Неделя 01</span>
        <span>{pad(CONTENT_WEEKS)}</span>
      </p>
      <div className="dir-content-end-rule">
        {ORDER.map(plan => (
          <i
            key={plan.output}
            data-track={plan.track}
            style={{
              gridColumn: `${plan.week} / span ${plan.span}`,
              gridRow: plan.track === 'V2' ? 1 : 2,
            }}
          />
        ))}
        <em />
      </div>
    </div>
  )
}

export function ContentPage({ works }: ContentPageProps) {
  // Кадры сцены от работ не зависят (см. SCENE); работы нужны только разделу «Работы».
  // Без работ он не рисуется, номера следующих разделов сдвигаются
  const hasWorks = works.length > 0
  const end = CONTENT_PAGE.end
  const processNo = hasWorks ? '05' : '04'
  const faqNo = hasWorks ? '06' : '05'

  return (
    <DirectionShell id="content-production" stickyLabel={CONTENT_PAGE.stickyLabel}>
      <div className="dir-content">
        <Hero frame={MASTER} />
        <Nle frame={MASTER} />
        <Splice from="01" to="02" />
        <Outputs frame={MASTER} pool={POOL} />
        <Thesis frame={THESIS_FRAME} />
        <Audiences />
        {hasWorks ? <Reel index="04" works={works} /> : null}
        <ProofCta />
        <Splice from={hasWorks ? '04' : '03'} to={processNo} />
        <Process
          index={processNo}
          title="Как планируем квартал"
          lead="Главное решение принимается до съёмки: какие материалы нужны и где они будут жить."
          master={MASTER}
          still={SHOT_FRAME}
        />
        <ProcessCta frame={MASTER} />
        <Splice from={processNo} to={faqNo} />
        <Faq
          index={faqNo}
          title="Вопросы о регулярном продакшне"
          items={CONTENT_PAGE.faq}
          frame={MASTER}
        />
        <OtherDirections
          current="content-production"
          reading={DIRECTION_READING['content-production']}
        />
        <DirectionEnd
          lines={end.lines}
          ctaLabel={end.ctaLabel}
          note={typo(end.note)}
          frame={CLOSING ? { src: CLOSING.src, position: CLOSING.position } : null}
          aside={<EndSign />}
        />
      </div>
    </DirectionShell>
  )
}
