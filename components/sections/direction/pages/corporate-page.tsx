/**
 * /corporate-video — «ГЛАВЫ».
 *
 * Метафора: документальный фильм о компании, собранный из четырёх глав. Это
 * самый медленный и спокойный язык из шести страниц: корпоративный заказчик
 * покупает ясность и предсказуемость, а не эффект.
 *
 * Первый экран — открывающие титры. Кадр раскрывается из линии леттербокса,
 * строки названия приходят ступенями, по нижней линейке сам идёт плейхед с
 * тайм-кодом и на границах глав жёстко меняет кадр. Курсор над главой (или
 * фокус с клавиатуры) перематывает кадр, касание ведёт к главе; колёсико и
 * палец двигают кадр по скроллу.
 *
 * Дальше: вступление, которое «проявляется» слово за словом; главы на
 * закреплённой сцене (кадр, крупный номер и линейка меняются с прокруткой,
 * текст читается всегда); переключатель «для кого фильм» с живой сменой
 * кадра, текста и монтажной дорожки; работы тремя разными разворотами;
 * призыв-«хлопушка»; лист согласований на бумаге; этапы на одной дорожке,
 * которая дорисовывается до кнопки; плёнка из стопкадров; вопросы с кадром.
 *
 * Движение: только transform, clip-path и opacity декора. Текст физически
 * в разметке и виден с первого кадра (вход — сдвиг на десяток пикселей).
 * Бесконечные вещи — наезд кадра и ход плейхеда — стоят, пока первый экран
 * вне экрана, и выключены при prefers-reduced-motion; бегущий титр финала
 * общего блока ждёт своего появления на экране (см. EndGuard).
 *
 * Если работ из портфолио нет, каждая секция остаётся целой: вместо кадров —
 * чертёжная плашка с сеткой и крупным номером главы.
 */
'use client'

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'

import { useMenu } from '@/components/ui/menu-context'
import { cn } from '@/lib/utils'
import { DIRECTION_READING } from '@/lib/services/pages'
import { CORPORATE_PAGE } from '@/lib/services/pages/content/corporate'
import {
  firstSentence,
  interleaveFrames,
  type DirectionPageWork,
} from '@/lib/services/pages/resolve'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionEnd } from '../direction-end'
import { KIT_TITLE, KIT_TITLE_SIZE, typo } from '../direction-kit'
import { OtherDirections } from '../other-directions'
import { Still } from '../still'
import '../direction-kit.css'
import './corporate-page.css'

export interface CorporatePageProps {
  works: DirectionPageWork[]
}

const pad = (value: number) => String(value).padStart(2, '0')
const delay = (ms: number) => ({ '--dc-d': `${ms}ms` }) as CSSProperties

const NBSP = '\u00A0'
// Слово до трёх букв не остаётся последним в строке. typo() из кита склеивает
// только каждое второе слово цепочки («тон и состав» — «и» повисает), поэтому
// связка идёт по словам: короткое всегда держится за следующим
const SHORT_WORD = /^[«("'—–]*[A-Za-zА-Яа-яЁё]{1,3},?$/

function tidy(text: string): string {
  const words = text.split(' ')
  const tied = words
    .map((word, position) => {
      if (position === words.length - 1) return word
      return SHORT_WORD.test(word) ? `${word}${NBSP}` : `${word} `
    })
    .join('')
  return typo(tied)
}

/** Заголовок раздела: слова с дефисом не рвутся, короткие слова держатся за соседом */
function headline(text: string): ReactNode {
  return tidy(text)
    .split(' ')
    .map((word, position) => (
      <span key={`${word}-${position}`}>
        {position > 0 ? ' ' : ''}
        {word.includes('-') ? <span className="whitespace-nowrap">{word}</span> : word}
      </span>
    ))
}

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Сниженное движение без расхождения с серверной разметкой: на сервере и в
 * первом проходе гидрации — false, настоящее значение приходит следующим
 * рендером. Разметка от настройки не зависит, меняются лишь диапазоны
 * motion-значений и работа таймера.
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

/* ───────────────────────────── Данные глав ───────────────────────────── */

type Chapter = (typeof CORPORATE_PAGE.chapters)[number] & {
  /** Кадр главы из портфолио; null — работы нет, остаётся чертёжная плашка */
  src: string | null
  client: string | null
}

function resolveChapters(works: DirectionPageWork[]): Chapter[] {
  const bySlug = new Map(works.map(work => [work.slug, work]))
  return CORPORATE_PAGE.chapters.map(chapter => {
    const work = bySlug.get(chapter.slug)
    const src = work?.stills[chapter.still ?? 0] ?? work?.stills[0] ?? work?.posterUrl ?? null
    return { ...chapter, src, client: src ? (work?.client ?? null) : null }
  })
}

/** Кадр из портфолио; crop — вариант перекадровки, когда свежих кадров не хватает */
interface Shot {
  src: string
  client: string
  crop: number
}

/** Перекадровка повторного кадра: увеличение с другой опорной точкой, зеркала нет */
const CROPS: { scale: number; origin: string }[] = [
  { scale: 1, origin: '50% 50%' },
  { scale: 1.55, origin: '18% 34%' },
  { scale: 1.55, origin: '84% 66%' },
  { scale: 2.1, origin: '52% 22%' },
]

type WorkLayout = 'trio' | 'pano' | 'duo'
const WORK_LAYOUTS: WorkLayout[] = ['trio', 'pano', 'duo']
const WORK_NEED: Record<WorkLayout, number> = { trio: 3, pano: 1, duo: 2 }

interface ShotPlan {
  /** Кадры каждой работы под её разворот, в порядке works */
  rows: Shot[][]
  /** Следующие n кадров для сцен вне работ: свежие, а затем повторы с иной перекадровкой */
  extras: (count: number) => Shot[]
}

/**
 * Раздаёт кадры так, чтобы один и тот же не встречался дважды, пока есть свежие:
 * сначала главы, затем развороты работ, затем плёнка, экран аудиторий и вопросы.
 * Когда свежие кончились, кадр возвращается с другой перекадровкой, а не копией.
 */
function planShots(works: DirectionPageWork[], chapterSrcs: ReadonlySet<string>): ShotPlan {
  const used = new Set(chapterSrcs)
  const rows = works.map((work, position) => {
    const need = WORK_NEED[WORK_LAYOUTS[position % WORK_LAYOUTS.length] ?? 'trio']
    const fresh = work.stills.filter(src => !chapterSrcs.has(src)).slice(0, need)
    const list = fresh.length > 0 ? fresh : [work.stills[0] ?? work.posterUrl].filter(Boolean)
    list.forEach(src => src && used.add(src))
    return list.map(src => ({ src: src as string, client: work.client, crop: 0 }))
  })

  const pool = interleaveFrames(works, 60).map(frame => ({
    src: frame.src,
    client: frame.client,
  }))
  const spare = pool.filter(frame => !used.has(frame.src))
  let cursor = 0
  const extras = (count: number): Shot[] => {
    const out: Shot[] = []
    for (let i = 0; i < count; i += 1) {
      const from = cursor + i
      if (from < spare.length) {
        out.push({ ...(spare[from] as { src: string; client: string }), crop: 0 })
      } else if (pool.length > 0) {
        const again = from - spare.length
        const frame = pool[again % pool.length] as { src: string; client: string }
        const crop = 1 + (Math.floor(again / pool.length) % (CROPS.length - 1))
        out.push({ ...frame, crop })
      }
    }
    cursor += count
    return out
  }
  return { rows, extras }
}

/** Кадр с перекадровкой: обёртка масштабирует, сам кадр остаётся обычным Still */
function Reframe({ crop, children }: { crop: number; children: ReactNode }) {
  const frame = CROPS[crop] ?? CROPS[0]
  if (!frame || frame.scale === 1) return <>{children}</>
  return (
    <div
      className="absolute inset-0"
      style={{ transform: `scale(${frame.scale})`, transformOrigin: frame.origin }}
    >
      {children}
    </div>
  )
}

/* ───────────────────────────── Мелочи набора ───────────────────────────── */

/** Строка-метка раздела: красная риска, номер и название, как в остальном киту */
function Kicker({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={cn(
        'type-meta flex items-center gap-3 font-mono uppercase tabular-nums',
        light ? 'text-black/70' : 'text-white/70'
      )}
    >
      <span aria-hidden="true" className="h-px w-8 bg-accent" />
      {children}
    </p>
  )
}

/** Угловые засечки рамки кадра, как на визире камеры */
function Marks() {
  return (
    <>
      <span aria-hidden="true" className="dir-corporate-mark" data-c="tl" />
      <span aria-hidden="true" className="dir-corporate-mark" data-c="tr" />
      <span aria-hidden="true" className="dir-corporate-mark" data-c="bl" />
      <span aria-hidden="true" className="dir-corporate-mark" data-c="br" />
      <span aria-hidden="true" className="dir-corporate-cross" />
    </>
  )
}

/** Стык между разделами: линия рисуется при появлении, красный ромб — монтажный маркер */
function Splice({ label }: { label: string }) {
  return (
    <div
      aria-hidden="true"
      data-reveal=""
      className="dir-corporate-splice bg-black px-6 py-7 md:px-10 lg:px-20"
    >
      <span className="dir-corporate-splice-line" />
      <span className="dir-corporate-splice-node" />
      <span className="type-meta font-mono uppercase text-white/65">{label}</span>
    </div>
  )
}

/* ───────────────────────────── Линейка глав ───────────────────────────── */

interface RulerProps {
  chapters: Chapter[]
  active: number
  /** Метка тайм-кода над головкой: на первом экране есть, в закреплённой сцене нет */
  timecode?: boolean
  onEnter?: (index: number) => void
  onLeave?: () => void
  rulerRef?: React.RefObject<HTMLDivElement | null>
  children: ReactNode
}

/**
 * Линейка в духе монтажного стола: шкала с делениями, четыре главы подписями
 * и головка воспроизведения. Главы — настоящие ссылки на якоря: Enter ведёт к
 * главе, фокус и наведение мыши только перематывают кадр.
 */
function Ruler({
  chapters,
  active,
  timecode = false,
  onEnter,
  onLeave,
  rulerRef,
  children,
}: RulerProps) {
  return (
    <div ref={rulerRef} className="dir-corporate-ruler" data-label={timecode ? 'tc' : 'none'}>
      <span aria-hidden="true" className="dir-corporate-ruler-ticks" />
      <ol role="list" className="dir-corporate-ruler-cells">
        {chapters.map((chapter, index) => (
          <li key={chapter.number}>
            <a
              href={`#chapter-${chapter.number}`}
              data-on={index === active}
              aria-label={`${chapter.number} ${chapter.title}, глава ${index + 1} из ${chapters.length}`}
              onPointerEnter={event => {
                if (event.pointerType === 'mouse') onEnter?.(index)
              }}
              onPointerLeave={event => {
                if (event.pointerType === 'mouse') onLeave?.()
              }}
              onFocus={event => {
                if (event.currentTarget.matches(':focus-visible')) onEnter?.(index)
              }}
              onBlur={() => onLeave?.()}
              className="dir-corporate-cell type-meta font-mono uppercase"
            >
              <span className="dir-corporate-cell-idx">{chapter.number}</span>{' '}
              <span className="dir-corporate-cell-name">{tidy(chapter.title)}</span>
            </a>
          </li>
        ))}
      </ol>
      {children}
    </div>
  )
}

/* ───────────────────────────── Первый экран ───────────────────────────── */

/** Секунд на главу: медленный ход, цикл из четырёх глав — 26 секунд */
const REEL_SECONDS = 6.5

function reelTimecode(seconds: number): string {
  const whole = Math.floor(seconds)
  const frame = Math.floor((seconds - whole) * 25)
  return `00:${pad(Math.floor(whole / 60))}:${pad(whole % 60)}:${pad(frame)}`
}

function Hero({ chapters }: { chapters: Chapter[] }) {
  const page = useDirectionPage()
  const reduced = useReduced()
  const count = chapters.length
  const rootRef = useRef<HTMLElement>(null)
  const rulerRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLSpanElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [armed, setArmed] = useState(false)
  const [live, setLive] = useState(true)
  // Состояние хода живёт в ref: головка и тайм-код двигаются без перерисовки React
  const reel = useRef({ pos: 0, hold: false, visible: true, raf: 0, last: 0, index: 0 })
  const controls = useRef<{ start: () => void; stop: () => void }>({
    start: () => {},
    stop: () => {},
  })

  const paint = useCallback(() => {
    const { pos } = reel.current
    const head = headRef.current
    if (head) {
      head.style.transform = `translate3d(${pos * 100}%, 0, 0)`
      head.dataset.flip = String(pos > 0.84)
    }
    if (tcRef.current) tcRef.current.textContent = reelTimecode(pos * REEL_SECONDS * count)
  }, [count])

  const seek = useCallback(
    (index: number) => {
      const r = reel.current
      r.pos = (index + 0.5) / count
      paint()
      if (r.index !== index) {
        r.index = index
        setActive(index)
      }
    },
    [count, paint]
  )

  const hold = useCallback(
    (index: number) => {
      const r = reel.current
      r.hold = true
      controls.current.stop()
      const ruler = rulerRef.current
      if (ruler) {
        ruler.dataset.hold = 'true'
        // Фиксируем прежнее положение головки, чтобы она доехала плавно, а не прыгнула
        void headRef.current?.offsetWidth
      }
      seek(index)
    },
    [seek]
  )

  const release = useCallback(() => {
    const r = reel.current
    if (!r.hold) return
    r.hold = false
    if (rulerRef.current) rulerRef.current.dataset.hold = 'false'
    controls.current.start()
  }, [])

  // Ход плейхеда: rAF с накоплением времени. Стоит вне экрана, на скрытой
  // вкладке, под курсором и при сниженном движении
  useEffect(() => {
    const r = reel.current
    const step = (now: number) => {
      const dt = r.last ? Math.min(now - r.last, 80) : 0
      r.last = now
      r.pos = (r.pos + dt / 1000 / (REEL_SECONDS * count)) % 1
      paint()
      const index = Math.min(count - 1, Math.floor(r.pos * count))
      if (index !== r.index) {
        r.index = index
        setActive(index)
      }
      r.raf = requestAnimationFrame(step)
    }
    const stop = () => {
      if (r.raf) cancelAnimationFrame(r.raf)
      r.raf = 0
    }
    const start = () => {
      if (reduced || r.raf || r.hold || !r.visible || document.hidden) return
      r.last = 0
      r.raf = requestAnimationFrame(step)
    }
    controls.current = { start, stop }
    paint()

    const root = rootRef.current
    let observer: IntersectionObserver | undefined
    if (root && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        r.visible = Boolean(entry?.isIntersecting)
        setLive(r.visible)
        if (r.visible) {
          start()
        } else {
          // Ушли со страницы по якорю — удержание снимается, иначе ход не вернётся
          r.hold = false
          if (rulerRef.current) rulerRef.current.dataset.hold = 'false'
          stop()
        }
      })
      observer.observe(root)
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVisibility)
    start()
    return () => {
      stop()
      observer?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [count, paint, reduced])

  // Остальные кадры подгружаются, когда браузер свободен: первый кадр — приоритетный,
  // и он не должен делить канал с тремя соседями
  useEffect(() => {
    const arm = () => setArmed(true)
    // Safari не знает requestIdleCallback: там хватит таймера
    const idle = typeof window.requestIdleCallback === 'function'
    const id = idle
      ? window.requestIdleCallback(arm, { timeout: 2500 })
      : window.setTimeout(arm, 1200)
    return () => (idle ? window.cancelIdleCallback(id) : window.clearTimeout(id))
  }, [])

  // Кадр едет медленнее прокрутки, курсор сдвигает его навстречу. На touch курсора
  // нет — остаётся прокрутка и автоматический ход
  const { scrollY } = useScroll()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, { stiffness: 70, damping: 22, mass: 0.6 })
  const springY = useSpring(pointerY, { stiffness: 70, damping: 22, mass: 0.6 })
  const scrollShift = useTransform(scrollY, [0, 800], [0, reduced ? 0 : 28])
  const y = useTransform(
    [scrollShift, springY],
    values => (values[0] as number) + (values[1] as number)
  )
  const scale = useTransform(scrollY, [0, 800], reduced ? [1, 1] : [1.1, 1.16])

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (reduced || event.pointerType !== 'mouse') return
    const box = event.currentTarget.getBoundingClientRect()
    pointerX.set(((event.clientX - box.left) / box.width - 0.5) * -16)
    pointerY.set(((event.clientY - box.top) / box.height - 0.5) * -10)
  }
  const onPointerLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  const current = chapters[active] ?? chapters[0]

  return (
    <section
      ref={rootRef}
      data-live={live}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="dir-corporate-hero"
    >
      <div aria-hidden="true" className="dir-corporate-hero-frame">
        <motion.div style={{ x: springX, y, scale }} className="absolute inset-0">
          <div className="dir-corporate-hero-push">
            {chapters.some(chapter => chapter.src) ? (
              chapters.map((chapter, index) =>
                chapter.src && (index === 0 || armed) ? (
                  <div
                    key={chapter.number}
                    className="dir-corporate-hero-still"
                    data-on={index === active}
                  >
                    <Still
                      src={chapter.src}
                      alt=""
                      priority={index === 0}
                      sizes="100vw"
                      className="h-full w-full"
                    />
                  </div>
                ) : null
              )
            ) : (
              <div className="dir-corporate-stage-plate" />
            )}
          </div>
        </motion.div>
        <span className="dir-corporate-hero-light" />
        <span className="dir-corporate-hero-scrim" />
      </div>
      <span aria-hidden="true" className="dir-corporate-hero-edge" data-side="top" />
      <span aria-hidden="true" className="dir-corporate-hero-edge" data-side="bottom" />

      <div className="dir-corporate-hero-body">
        <div>
          <div
            className="dir-corporate-rise type-meta flex items-center justify-between gap-6 font-mono uppercase text-white/75"
            style={delay(620)}
          >
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="dir-corporate-draw h-px w-8 bg-accent"
                style={delay(520)}
              />
              Savage Movie представляет
            </span>
            <span className="dir-corporate-plate hidden lg:inline">
              05 / Corporate · Санкт-Петербург · Москва · по России
            </span>
          </div>

          <h1 className="mt-6 font-stage uppercase leading-[0.86] tracking-[-0.04em] text-white md:mt-8">
            <span
              className="dir-corporate-rise block text-[min(20vw,5.4rem)] md:text-[clamp(4.5rem,9.4vw,9.75rem)]"
              style={delay(240)}
            >
              Фильм
            </span>{' '}
            <span
              className="dir-corporate-rise block text-[clamp(2.4rem,11.2vw,4.5rem)] md:text-[clamp(4.5rem,9.4vw,9.75rem)]"
              style={delay(370)}
            >
              {tidy('о компании')}
            </span>
          </h1>

          <p
            className="dir-corporate-rise mt-6 max-w-[32rem] text-[1.0625rem] font-light leading-snug text-white/85 [text-wrap:pretty] md:mt-8 md:text-xl"
            style={delay(560)}
          >
            {tidy(
              'Корпоративное видео о производстве, технологиях и людях — для клиентов, партнёров и будущих сотрудников'
            )}
          </p>

          <div
            className="dir-corporate-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8"
            style={delay(700)}
          >
            <button
              type="button"
              onClick={() => page.openBrief('hero')}
              className="dir-corporate-cta inline-flex min-h-14 w-full items-center justify-between gap-6 rounded-sm bg-white px-7 py-4 text-left text-base font-medium text-black sm:w-auto sm:justify-center"
            >
              <span className="dir-corporate-cta-label">{CORPORATE_PAGE.ctaLabel}</span>
              <ArrowRight aria-hidden="true" className="dir-corporate-cta-arrow h-4 w-4 shrink-0" />
              <span aria-hidden="true" className="dir-corporate-cta-curtain" />
            </button>
            <a href="#chapters" className="dir-corporate-link text-base">
              Четыре главы фильма
              <ArrowDown aria-hidden="true" className="dir-corporate-link-icon h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="dir-corporate-hero-caption">
        <p className="dir-corporate-plate hidden md:block">
          Глава {current?.number} · {tidy(current?.title ?? '')}
        </p>
        {current?.client ? (
          <p className="dir-corporate-plate hidden lg:block">
            Кадр из портфолио · {current.client}
          </p>
        ) : null}
      </div>

      <div className="dir-corporate-hero-bar">
        <p aria-hidden="true" className="dir-corporate-now type-meta font-mono uppercase md:hidden">
          <span className="text-accent">Глава {current?.number}</span>
          <span> · {tidy(current?.title ?? '')}</span>
        </p>
        <nav aria-label="Главы фильма">
          <Ruler
            chapters={chapters}
            active={active}
            timecode
            onEnter={hold}
            onLeave={release}
            rulerRef={rulerRef}
          >
            <span ref={headRef} aria-hidden="true" className="dir-corporate-ruler-head">
              <span ref={tcRef} className="dir-corporate-ruler-tc type-meta font-mono">
                00:00:00:00
              </span>
            </span>
          </Ruler>
        </nav>
      </div>
    </section>
  )
}

/* ───────────────────────────── Вступление ───────────────────────────── */

/** Слово проявляется от приглушённого к белому по мере прокрутки; приглушённое — 5:1 на чёрном */
function Word({
  children,
  progress,
  from,
  to,
  still,
}: {
  children: string
  progress: MotionValue<number>
  from: number
  to: number
  still: boolean
}) {
  const opacity = useTransform(progress, [from, to], [0.5, 1])
  // На сервере motion.span уже отдаёт opacity:0.5 в style; при reduced-motion на клиенте
  // framer этот style не снимает, поэтому вместо смены style подменяем сам элемент
  if (still) return <span>{children}</span>
  return <motion.span style={{ opacity }}>{children}</motion.span>
}

function Statement() {
  const reduced = useReduced()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] })
  const ruleScale = useTransform(scrollYProgress, [0, 1], [0, 1])
  const lead = tidy(CORPORATE_PAGE.statement.lead).split(' ')
  const tail = tidy(CORPORATE_PAGE.statement.tail).split(' ')
  const total = lead.length + tail.length

  const words = (list: string[], offset: number) =>
    list.map((word, position) => {
      const from = ((offset + position) / total) * 0.88
      return (
        <Fragment key={`${word}-${position}`}>
          {position > 0 ? ' ' : ''}
          <Word progress={scrollYProgress} from={from} to={from + 0.12} still={reduced}>
            {word}
          </Word>
        </Fragment>
      )
    })

  return (
    <section
      ref={ref}
      aria-label="Принцип работы"
      className="relative bg-black px-6 pb-24 pt-28 md:px-10 md:pb-36 md:pt-44 lg:px-20"
    >
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-2">
          <Kicker>Принцип</Kicker>
          <span aria-hidden="true" className="mt-6 hidden h-32 w-px bg-white/15 lg:block">
            <motion.span
              className="dir-corporate-statement-rule block h-full w-px bg-accent"
              style={{ scaleY: reduced ? 1 : ruleScale }}
            />
          </span>
        </div>
        <div className="lg:col-span-9 lg:col-start-3">
          <p className="font-stage text-[clamp(1.6rem,4.6vw,4.4rem)] uppercase leading-[1.04] tracking-[-0.03em] text-white text-balance">
            {words(lead, 0)}
          </p>
          <p className="mt-10 max-w-xl text-xl font-light leading-snug text-white md:mt-14 md:text-[1.75rem] [text-wrap:pretty]">
            {words(tail, lead.length)}
          </p>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── Главы ───────────────────────────── */

/** Схемы глав — тонкая производственная графика; контур 1px при любом масштабе */
const diamond = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} L${cx + r} ${cy} L${cx} ${cy + r} L${cx - r} ${cy} Z`

function Schematic({ index }: { index: number }) {
  let body: ReactNode
  if (index === 0) {
    // Производство: конвейер, упаковки на ленте, готовая — красная
    const ticks = Array.from({ length: 21 }, (_, i) => `M${i * 24} 98 v6`).join(' ')
    body = (
      <>
        <path data-stroke d="M0 84 H480 M0 92 H480" />
        <path data-stroke d={ticks} />
        <circle data-fill cx="10" cy="88" r="5" />
        <circle data-fill cx="470" cy="88" r="5" />
        <rect data-fill x="36" y="50" width="40" height="34" />
        <rect data-fill x="132" y="50" width="40" height="34" />
        <rect data-accent x="228" y="50" width="40" height="34" />
        <path
          data-stroke
          d="M82 67 H124 M118 63 L124 67 L118 71 M178 67 H220 M214 63 L220 67 L214 71"
        />
        <path data-stroke d="M276 67 H316" strokeDasharray="3 4" />
        <rect data-stroke x="324" y="36" width="60" height="48" strokeDasharray="4 4" />
      </>
    )
  } else if (index === 1) {
    // Технологии: схема с узлами; один узел — точка внимания
    body = (
      <>
        <path data-stroke d="M20 88 H84 V34 H150 H222 V88 H290 H354 V34 H440 M440 34 V88 H468" />
        <path data-stroke d="M84 34 V12 H150 M354 34 V12 H396" strokeDasharray="3 4" />
        <rect data-fill x="14" y="82" width="12" height="12" />
        <rect data-fill x="144" y="28" width="12" height="12" />
        <rect data-accent x="284" y="82" width="12" height="12" />
        <rect data-fill x="434" y="28" width="12" height="12" />
        <circle data-fill cx="84" cy="34" r="3.5" />
        <circle data-fill cx="222" cy="88" r="3.5" />
        <circle data-fill cx="354" cy="34" r="3.5" />
      </>
    )
  } else if (index === 2) {
    // Люди: кадрирование интервью — треть, линия глаз, контур плеч
    body = (
      <>
        <path data-stroke d="M0 60 H140 M340 60 H480" />
        <rect data-stroke x="150" y="8" width="180" height="104" />
        <path
          data-stroke
          d="M210 8 V112 M270 8 V112 M150 43 H330 M150 77 H330"
          strokeDasharray="2 5"
        />
        <ellipse data-stroke cx="210" cy="56" rx="15" ry="19" />
        <path data-stroke d="M174 112 C174 90 190 80 210 80 C230 80 246 90 246 112" />
        <path data-accent d="M196 43 H224" />
        <circle data-accent cx="162" cy="20" r="3" />
      </>
    )
  } else {
    // История: отметки на шкале времени, каждая крупнее предыдущей
    body = (
      <>
        <path data-stroke d="M0 76 H480" />
        <path data-stroke d="M40 76 V96 M140 76 V96 M240 76 V96 M340 76 V96 M440 76 V96" />
        <path data-fill d={diamond(40, 76, 6)} />
        <path data-fill d={diamond(140, 76, 8)} />
        <path data-fill d={diamond(240, 76, 10)} />
        <path data-fill d={diamond(340, 76, 12)} />
        <path data-accent d={diamond(440, 76, 15)} />
        <path data-stroke d="M440 61 V20 H480" />
      </>
    )
  }

  return (
    <div data-reveal="" className="dir-corporate-schematic" aria-hidden="true">
      <svg viewBox="0 0 480 120" focusable="false">
        {body}
      </svg>
    </div>
  )
}

function Chapters({ chapters }: { chapters: Chapter[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLLIElement | null)[]>([])
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)
  const [previous, setPrevious] = useState(-1)
  const count = chapters.length

  const choose = useCallback((next: number) => {
    if (activeRef.current === next) return
    setPrevious(activeRef.current)
    activeRef.current = next
    setActive(next)
  }, [])

  // Активная глава — та, чья панель пересекает середину экрана. Работает и
  // после прыжка по якорю, и без единого события прокрутки
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Number((entry.target as HTMLElement).dataset.chapter)
          if (!Number.isNaN(index)) choose(index)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )
    panelRefs.current.forEach(node => node && observer.observe(node))
    return () => observer.disconnect()
  }, [choose])

  // Головка линейки идёт за прокруткой от центра первой главы до центра последней
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const headX = useTransform(scrollYProgress, value => {
    const clamped = Math.min(1, Math.max(0, value))
    return `${(0.5 / count + clamped * ((count - 1) / count)) * 100}%`
  })

  // Прыжок мимо всей секции (End, перетаскивание ползунка) не задевает ни одну панель:
  // на краях дорожки выбираем крайнюю главу по прогрессу, чтобы линейка не врала
  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (value >= 0.995) choose(count - 1)
    else if (value <= 0.005) choose(0)
  })

  const current = chapters[active] ?? chapters[0]

  return (
    <section
      id="chapters"
      aria-labelledby="dir-corporate-chapters-title"
      className="dir-corporate-chapters"
    >
      <div className="relative z-[1] px-6 pb-14 pt-24 md:px-10 md:pb-20 md:pt-32 lg:px-20">
        <Kicker>02 / Структура фильма</Kicker>
        <h2
          id="dir-corporate-chapters-title"
          data-reveal=""
          className={cn(
            KIT_TITLE,
            'mt-5 max-w-[14ch] text-[clamp(2.1rem,5.6vw,5.25rem)] leading-[0.94]'
          )}
        >
          {headline('Фильм из четырёх глав')}
        </h2>
      </div>

      <div
        ref={trackRef}
        className="relative z-[1] lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
      >
        {/* Закреплённая сцена: только на широком экране, на телефоне кадры в самих главах */}
        <div className="relative hidden lg:block">
          <div className="dir-corporate-stage">
            <div className="dir-corporate-stage-frame">
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.number}
                  aria-hidden="true"
                  className="dir-corporate-stage-layer"
                  data-state={index === active ? 'on' : index === previous ? 'prev' : 'off'}
                >
                  {chapter.src ? (
                    <div className="dir-corporate-stage-still">
                      <Still
                        src={chapter.src}
                        alt=""
                        sizes="(min-width: 1024px) 58vw, 1px"
                        quality={65}
                        className="h-full w-full"
                      />
                    </div>
                  ) : (
                    <div className="dir-corporate-stage-plate" />
                  )}
                </div>
              ))}
              <span aria-hidden="true" className="dir-corporate-stage-shade" />
              <Marks />

              <p
                aria-hidden="true"
                className="dir-corporate-plate absolute left-6 top-6 z-[5] lg:left-20"
              >
                Глава {current?.number} / {pad(count)}
              </p>
              {current?.client ? (
                <p
                  aria-hidden="true"
                  className="dir-corporate-plate absolute right-6 top-6 z-[5] hidden xl:block"
                >
                  Кадр из портфолио · {current.client}
                </p>
              ) : null}

              <div aria-hidden="true" className="dir-corporate-roll">
                <span className="block h-[1em] flex-none">0</span>
                <span className="dir-corporate-roll-col" style={{ '--i': active } as CSSProperties}>
                  {chapters.map(chapter => (
                    <span key={chapter.number}>{chapter.number.slice(-1)}</span>
                  ))}
                </span>
                <span className="dir-corporate-roll-of">/ {pad(count)}</span>
              </div>
            </div>

            <nav aria-label="Главы: положение в сцене" className="dir-corporate-stage-nav">
              <Ruler chapters={chapters} active={active}>
                <motion.span
                  aria-hidden="true"
                  className="dir-corporate-ruler-head"
                  style={{ x: headX }}
                />
              </Ruler>
            </nav>
          </div>
        </div>

        <ol role="list" className="px-6 md:px-10 lg:pl-12 lg:pr-12 xl:pl-16 xl:pr-20">
          {chapters.map((chapter, index) => (
            <li
              key={chapter.number}
              id={`chapter-${chapter.number}`}
              data-chapter={index}
              data-state={index === active ? 'on' : 'off'}
              ref={node => {
                panelRefs.current[index] = node
              }}
              className="dir-corporate-panel"
            >
              {/* Кадр главы на телефоне: на всю ширину, номер накладывается на нижнюю кромку */}
              <div
                aria-hidden="true"
                data-reveal=""
                data-plate={chapter.src ? undefined : 'true'}
                className="dir-corporate-mframe relative -mx-6 aspect-[4/5] overflow-hidden bg-[#0b0b0b] sm:aspect-[16/11] md:-mx-10 lg:hidden"
              >
                {chapter.src ? (
                  <Still
                    src={chapter.src}
                    alt=""
                    sizes="(min-width: 1024px) 1px, 100vw"
                    quality={65}
                    className="absolute inset-0 h-full w-full"
                  />
                ) : (
                  <div className="dir-corporate-stage-plate" />
                )}
                <span className="dir-corporate-stage-shade" />
                <span className="dir-corporate-mark" data-c="tl" />
                <span className="dir-corporate-mark" data-c="br" />
                <span className="dir-corporate-mroll">{chapter.number}</span>
              </div>

              <div className="mt-7 lg:mt-0 lg:flex lg:flex-1 lg:flex-col">
                <div className="type-meta flex items-center gap-4 font-mono uppercase tabular-nums">
                  <span className="dir-corporate-panel-label text-accent">
                    Глава {chapter.number}
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
                  <span aria-hidden="true" className="text-white/65">
                    {index + 1} / {pad(count)}
                  </span>
                </div>

                <h3
                  data-reveal=""
                  className="dir-corporate-panel-title mt-5 font-stage text-[clamp(2rem,3.15vw,3.4rem)] uppercase leading-[0.94] tracking-[-0.03em] text-balance"
                >
                  {headline(chapter.title)}
                </h3>

                <p className="dir-corporate-panel-text dir-corporate-measure mt-6 text-base leading-relaxed md:text-[1.0625rem] [text-wrap:pretty]">
                  {tidy(chapter.text)}
                </p>

                <div className="dir-corporate-shotlist dir-corporate-measure">
                  <p className="dir-corporate-shotlist-label type-meta font-mono uppercase text-white">
                    В кадре
                  </p>
                  <ul role="list" className="dir-corporate-shotlist-items">
                    {chapter.inFrame.map((item, position) => (
                      <li key={item}>
                        <span aria-hidden="true" className="dir-corporate-shotlist-idx">
                          {pad(position + 1)}
                        </span>
                        <span className="dir-corporate-shotlist-name">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="dir-corporate-measure mt-5 flex items-stretch border border-white/25">
                  <span className="type-meta flex shrink-0 items-center bg-white px-3.5 font-mono uppercase text-black">
                    От вас
                  </span>
                  <p className="py-3.5 pl-4 pr-4 text-sm leading-snug text-white/85 md:text-[0.9375rem]">
                    {tidy(chapter.ask)}
                  </p>
                </div>

                <div className="mt-10 w-full max-w-[34rem] lg:mt-auto lg:max-w-none lg:pt-10">
                  <p
                    aria-hidden="true"
                    className="type-meta mb-4 flex items-center gap-4 font-mono uppercase tabular-nums text-white/70"
                  >
                    <span>Схема главы</span>
                    <span className="h-px flex-1 bg-white/15" />
                    <span>{chapter.number}</span>
                  </p>
                  <Schematic index={index} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ───────────────────────────── Для кого фильм ───────────────────────────── */

/** Вес главы в монтаже: длина полосы на дорожке */
const WEIGHT_SCALE: Record<number, number> = { 1: 0.28, 2: 0.62, 3: 1 }
const WEIGHT_WORD: Record<number, string> = { 1: 'Фоном', 2: 'Рядом', 3: 'В центре' }

function Audiences({ chapters, frames }: { chapters: Chapter[]; frames: Shot[] }) {
  const baseId = useId()
  const audiences = CORPORATE_PAGE.audiences
  const [selected, setSelected] = useState(0)
  // Прежний кадр остаётся под новым, пока шторка его не закроет: склейка, а не затемнение
  const [previous, setPrevious] = useState(-1)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const audience = audiences[selected] ?? audiences[0]

  const choose = (next: number) => {
    if (next === selected) return
    setPrevious(selected)
    setSelected(next)
  }

  // Стрелки, Home и End — по вкладкам, как в шаблоне APG; выбор следует за фокусом
  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, position: number) => {
    const last = audiences.length - 1
    const next =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? position === last
          ? 0
          : position + 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? position === 0
            ? last
            : position - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    choose(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <section
      id="audiences"
      aria-labelledby="dir-corporate-aud-title"
      className="bg-black px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="grid gap-x-12 gap-y-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Kicker>03 / Для кого фильм</Kicker>
          <h2
            id="dir-corporate-aud-title"
            data-reveal=""
            className={cn(KIT_TITLE, KIT_TITLE_SIZE, 'mt-5 max-w-[16ch] leading-[0.94]')}
          >
            {headline('Один материал — три аудитории')}
          </h2>

          <div
            role="tablist"
            aria-label="Для кого фильм"
            aria-orientation="vertical"
            className="mt-10 md:mt-12"
          >
            {audiences.map((item, position) => (
              <button
                key={item.id}
                ref={node => {
                  tabRefs.current[position] = node
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${position}`}
                aria-selected={position === selected}
                aria-controls={`${baseId}-panel-${position}`}
                tabIndex={position === selected ? 0 : -1}
                onClick={() => choose(position)}
                onKeyDown={event => onKeyDown(event, position)}
                className="dir-corporate-tab"
              >
                <span aria-hidden="true" className="dir-corporate-tab-idx type-meta font-mono">
                  {pad(position + 1)}
                </span>
                <span className="dir-corporate-tab-label font-stage text-[clamp(1.45rem,2.4vw,2.35rem)] uppercase leading-none tracking-[-0.02em]">
                  {item.label}
                </span>
                <ArrowRight aria-hidden="true" className="dir-corporate-tab-arrow h-5 w-5" />
              </button>
            ))}
          </div>

          <p className="mt-8 max-w-sm text-sm leading-relaxed text-white/65 [text-wrap:pretty] md:text-base">
            {tidy(CORPORATE_PAGE.audiencesNote)}
          </p>
        </div>

        <div className="relative lg:col-span-7 lg:px-8 lg:py-8">
          <span aria-hidden="true" className="dir-corporate-crop hidden lg:block" data-c="tl" />
          <span aria-hidden="true" className="dir-corporate-crop hidden lg:block" data-c="tr" />
          <span aria-hidden="true" className="dir-corporate-crop hidden lg:block" data-c="bl" />
          <span aria-hidden="true" className="dir-corporate-crop hidden lg:block" data-c="br" />

          {frames.length > 0 ? (
            <div aria-hidden="true" className="dir-corporate-screen">
              {audiences.map((item, position) => {
                const shot = frames[position % frames.length]
                if (!shot) return null
                return (
                  <div
                    key={item.id}
                    className="dir-corporate-stage-layer"
                    data-state={
                      position === selected ? 'on' : position === previous ? 'prev' : 'off'
                    }
                  >
                    <div className="dir-corporate-stage-still">
                      <Reframe crop={shot.crop}>
                        <Still
                          src={shot.src}
                          alt=""
                          sizes="(min-width: 1024px) 40vw, 100vw"
                          quality={50}
                          className="h-full w-full"
                        />
                      </Reframe>
                    </div>
                  </div>
                )
              })}
              <span className="dir-corporate-stage-shade" />
              <p className="dir-corporate-plate absolute left-3 top-3 z-[5]">
                {pad(selected + 1)} / {audience?.label}
              </p>
              <p className="dir-corporate-plate absolute bottom-3 right-3 z-[5] hidden sm:block">
                Кадр из портфолио · {frames[selected % frames.length]?.client}
              </p>
            </div>
          ) : null}

          <div className="dir-corporate-aud-stack">
            {audiences.map((item, position) => (
              <div
                key={item.id}
                role="tabpanel"
                id={`${baseId}-panel-${position}`}
                aria-labelledby={`${baseId}-tab-${position}`}
                data-on={position === selected}
                className="dir-corporate-aud-panel"
              >
                <h3 className="font-stage text-[clamp(1.6rem,3vw,2.75rem)] uppercase leading-[0.98] tracking-[-0.025em] text-white text-balance">
                  {headline(item.title)}
                </h3>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 [text-wrap:pretty] md:text-lg">
                  {tidy(item.text)}
                </p>
                <p className="type-meta mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono uppercase text-white/65">
                  <span className="text-white">Где идёт</span>
                  <span aria-hidden="true" className="text-accent">
                    /
                  </span>
                  <span>{item.where}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 border-t border-white/15 pt-6">
            <div className="type-meta flex items-center justify-between gap-6 font-mono uppercase text-white/60">
              <span>Монтаж под аудиторию</span>
              <span aria-hidden="true" className="hidden sm:inline">
                Вес главы
              </span>
            </div>
            <ul role="list" className="mt-2">
              {chapters.map((chapter, position) => {
                const weight = audience?.weights[position] ?? 1
                return (
                  <li
                    key={chapter.number}
                    className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-2 border-b border-white/10 py-4 sm:grid-cols-[2rem_minmax(0,11rem)_minmax(0,1fr)_5.5rem] sm:items-center sm:gap-x-5"
                  >
                    <span
                      aria-hidden="true"
                      className="type-meta font-mono tabular-nums text-white/55"
                    >
                      {chapter.number}
                    </span>
                    <span className="text-base text-white md:text-[1.0625rem]">
                      {tidy(chapter.title)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="dir-corporate-bar order-last col-span-3 sm:order-none sm:col-span-1"
                      data-w={weight}
                      style={{ '--w': WEIGHT_SCALE[weight], '--i': position } as CSSProperties}
                    >
                      <span />
                    </span>
                    <span
                      className={cn(
                        'dir-corporate-weight type-meta text-right font-mono uppercase',
                        weight === 3 ? 'text-accent' : 'text-white/65'
                      )}
                    >
                      {WEIGHT_WORD[weight]}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── Работы: три разных разворота ───────────────────────────── */

/** Размеры кадров под раскладку: большой кадр отдаёт больше ширины экрана, малый — меньше */
function shotSizes(layout: WorkLayout, shot: number): string {
  if (layout === 'pano') return '(min-width: 1024px) 92vw, 100vw'
  if (layout === 'duo') {
    return shot === 0 ? '(min-width: 1024px) 22vw, 50vw' : '(min-width: 1024px) 36vw, 100vw'
  }
  return shot === 0 ? '(min-width: 1024px) 38vw, 100vw' : '(min-width: 1024px) 19vw, 50vw'
}

function Works({ works, rows }: { works: DirectionPageWork[]; rows: Shot[][] }) {
  const page = useDirectionPage()
  const listRef = useRef<HTMLUListElement>(null)

  // Без курсора строку зажигает положение на экране: тот же жест, что у титров
  // в остальных направлениях. Состояние лежит в data-focus, а не в React
  useEffect(() => {
    const list = listRef.current
    if (!list || typeof IntersectionObserver === 'undefined') return
    const touch = window.matchMedia('(hover: none)')
    let observer: IntersectionObserver | null = null

    const connect = () => {
      observer?.disconnect()
      observer = null
      const nodes = list.querySelectorAll<HTMLElement>('[data-work]')
      nodes.forEach(node => node.removeAttribute('data-focus'))
      if (!touch.matches) return
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            ;(entry.target as HTMLElement).dataset.focus = String(entry.isIntersecting)
          }
        },
        { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
      )
      nodes.forEach(node => observer?.observe(node))
    }

    connect()
    touch.addEventListener('change', connect)
    return () => {
      touch.removeEventListener('change', connect)
      observer?.disconnect()
    }
  }, [works.length])

  if (works.length === 0) return null

  return (
    <section
      aria-labelledby="dir-corporate-works-title"
      className="bg-black px-6 pb-16 pt-6 md:px-10 md:pb-24 lg:px-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-b border-white/15 pb-6">
        <div>
          <Kicker>04 / Работы</Kicker>
          <h2
            id="dir-corporate-works-title"
            data-reveal=""
            className={cn(KIT_TITLE, KIT_TITLE_SIZE, 'mt-5 leading-[0.94]')}
          >
            {headline('Корпоративные работы')}
          </h2>
        </div>
        <p className="type-meta max-w-xs font-mono uppercase leading-relaxed text-white/70">
          {tidy('Работы для компаний и брендов')}
        </p>
      </div>

      <ul ref={listRef} role="list">
        {works.map((work, position) => {
          const layout = WORK_LAYOUTS[position % WORK_LAYOUTS.length] ?? 'trio'
          const shots = rows[position] ?? []
          const excerpt = firstSentence(work.description)
          return (
            <li key={work.slug} data-reveal="" className="border-b border-white/10">
              <Link
                href={`/projects/${work.slug}`}
                prefetch={false}
                data-work=""
                data-layout={layout}
                onClick={() => page.openCase(work.slug)}
                className="dir-corporate-work"
              >
                <div className="dir-corporate-work-head">
                  <span className="dir-corporate-work-idx type-meta font-mono tabular-nums uppercase">
                    {pad(position + 1)} / {pad(works.length)}
                  </span>
                  <span className="dir-corporate-work-name font-stage uppercase text-white">
                    {work.client}
                  </span>
                </div>

                <div aria-hidden="true" className="dir-corporate-work-media">
                  {shots.length > 0 ? (
                    <div
                      className="dir-corporate-mosaic"
                      data-layout={layout}
                      data-n={shots.length}
                    >
                      {shots.map((shot, index) => (
                        <div
                          key={shot.src}
                          className="dir-corporate-shot"
                          style={{ '--k': index } as CSSProperties}
                        >
                          <div className="dir-corporate-shot-img">
                            <Reframe crop={shot.crop}>
                              <Still
                                src={shot.src}
                                alt=""
                                sizes={shotSizes(layout, index)}
                                quality={index === 0 ? 65 : 50}
                                className="h-full w-full"
                              />
                            </Reframe>
                          </div>
                          <span className="dir-corporate-shot-code type-meta-sm font-mono uppercase">
                            {pad(position + 1)}
                            {'ABC'[index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dir-corporate-stage-plate aspect-[16/9] lg:aspect-[2.05/1]" />
                  )}
                </div>

                <div className="dir-corporate-work-body">
                  <div className="min-w-0">
                    <span className="block text-base text-white/90 md:text-lg">
                      {tidy(work.title)}
                    </span>
                    {excerpt ? (
                      <span className="mt-3 block max-w-md text-sm leading-relaxed text-white/70 [text-wrap:pretty] md:text-base">
                        {tidy(excerpt)}
                      </span>
                    ) : null}
                  </div>
                  <span className="dir-corporate-work-go flex items-center gap-3">
                    <span className="type-meta font-mono uppercase tabular-nums text-white/70">
                      {work.year ?? ' '}
                    </span>
                    <span className="type-meta font-mono uppercase text-white">
                      Смотреть работу
                    </span>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="dir-corporate-work-arrow h-4 w-4 shrink-0"
                    />
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ───────────────────────────── Призыв после работ: хлопушка ───────────────────────────── */

function SlateCta({ hasWorks }: { hasWorks: boolean }) {
  const page = useDirectionPage()
  const cta = CORPORATE_PAGE.proofCta

  return (
    <section
      aria-labelledby="dir-corporate-slate-title"
      className="bg-black px-6 pb-24 pt-20 md:px-10 md:pb-32 md:pt-24 lg:px-20"
    >
      <div data-reveal="" className="dir-corporate-slate max-w-[72rem]">
        <div aria-hidden="true" className="dir-corporate-slate-arm" />
        <div className="dir-corporate-slate-board grid lg:grid-cols-12">
          <div className="p-6 md:p-10 lg:col-span-7 lg:border-r lg:border-white/50">
            <Kicker>{hasWorks ? 'Следующая работа' : 'Бриф'}</Kicker>
            <h2
              id="dir-corporate-slate-title"
              className="mt-5 font-stage text-[clamp(1.9rem,4.4vw,4.1rem)] uppercase leading-[0.94] tracking-[-0.03em] text-white text-balance"
            >
              {headline(cta.title)}
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/80 [text-wrap:pretty] md:text-lg">
              {tidy(cta.text)}
            </p>
            <button
              type="button"
              onClick={() => page.openBrief('proof')}
              className="dir-corporate-slate-cta mt-9 inline-flex min-h-14 w-full items-center justify-between gap-4 rounded-sm bg-white px-5 py-4 text-left text-base font-medium text-black sm:w-auto sm:justify-center sm:gap-6 sm:px-7"
            >
              <span className="dir-corporate-slate-label">{CORPORATE_PAGE.ctaLabel}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span aria-hidden="true" className="dir-corporate-slate-curtain" />
            </button>
          </div>

          <dl className="grid grid-cols-2 border-t border-white/50 lg:col-span-5 lg:border-t-0">
            {cta.fields.map((field, position) => (
              <div
                key={field.label}
                className={cn(
                  'flex flex-col justify-between gap-6 p-5 md:p-7',
                  position % 2 === 1 && 'border-l border-white/50',
                  position > 1 && 'border-t border-white/50'
                )}
              >
                <dt className="type-meta font-mono uppercase text-white/65">{field.label}</dt>
                <dd className="font-stage text-[clamp(1.05rem,2vw,1.75rem)] uppercase leading-[1.05] tracking-[-0.015em] text-white text-balance">
                  {tidy(field.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── Лист согласований ───────────────────────────── */

/**
 * Белая страница под шапкой: шапка сайта по умолчанию светлая, и над бумагой
 * её не видно. Наблюдаем тонкую полоску на уровне центра шапки.
 */
function usePaperHeader() {
  const { setHeaderDark } = useMenu()

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-corp-paper]'))
    if (nodes.length === 0) return
    const inside = new Set<Element>()
    let observer: IntersectionObserver | null = null

    const build = () => {
      observer?.disconnect()
      inside.clear()
      // Полоска в 1px на уровне центра шапки: цвет меняется ровно на кромке бумаги
      const bottom = Math.max(0, window.innerHeight - 37)
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) inside.add(entry.target)
            else inside.delete(entry.target)
          }
          setHeaderDark(inside.size > 0)
        },
        { rootMargin: `-36px 0px -${bottom}px 0px`, threshold: 0 }
      )
      nodes.forEach(node => observer?.observe(node))
    }

    build()
    window.addEventListener('resize', build)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', build)
      setHeaderDark(false)
    }
  }, [setHeaderDark])
}

function Sheet() {
  usePaperHeader()

  return (
    <section
      data-corp-paper=""
      aria-labelledby="dir-corporate-sheet-title"
      className="dir-corporate-sheet px-6 py-20 md:px-10 md:py-32 lg:px-20"
    >
      <span aria-hidden="true" className="dir-corporate-sheet-mark" data-c="tl" />
      <span aria-hidden="true" className="dir-corporate-sheet-mark" data-c="tr" />
      <span aria-hidden="true" className="dir-corporate-sheet-mark" data-c="bl" />
      <span aria-hidden="true" className="dir-corporate-sheet-mark" data-c="br" />
      <span aria-hidden="true" className="dir-corporate-sheet-tear" />

      <div className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Kicker light>05 / Лист согласований</Kicker>
          <h2
            id="dir-corporate-sheet-title"
            data-reveal=""
            className="mt-5 max-w-[12ch] font-stage text-[clamp(2rem,3.9vw,3.9rem)] uppercase leading-[0.94] tracking-[-0.03em] text-black text-balance"
          >
            {headline('Что нужно от компании')}
          </h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-black/75 [text-wrap:pretty] md:text-lg">
            {tidy(CORPORATE_PAGE.asksLead)}
          </p>
        </div>

        <ol role="list" className="lg:col-span-7">
          {CORPORATE_PAGE.asks.map((ask, position) => (
            <li
              key={ask.title}
              data-reveal=""
              className="dir-corporate-sheet-row grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 py-7 md:grid-cols-[6.5rem_minmax(0,1fr)] md:py-10"
            >
              <span
                aria-hidden="true"
                className="font-stage text-[clamp(2.5rem,5.2vw,4.6rem)] leading-[0.85] tracking-[-0.05em] tabular-nums text-black"
              >
                {pad(position + 1)}
              </span>
              <div>
                <h3 className="font-stage text-[clamp(1.35rem,2.3vw,2.1rem)] uppercase leading-none tracking-[-0.02em] text-black">
                  {headline(ask.title)}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-black/75 [text-wrap:pretty]">
                  {tidy(ask.text)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ───────────────────────────── Этапы: одна дорожка до кнопки ───────────────────────────── */

function Stages() {
  const page = useDirectionPage()
  const reduced = useReduced()
  const steps = CORPORATE_PAGE.process
  const cta = CORPORATE_PAGE.processCta
  const count = steps.length
  const trackRef = useRef<HTMLOListElement>(null)
  const [reached, setReached] = useState(0)
  // Красная линия дорисовывается по мере прокрутки: слева направо на широком экране,
  // сверху вниз на узком. Шаги загораются, когда линия доходит до их ромба
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start 0.85', 'end 0.4'] })
  const fill = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [0, 1])

  useMotionValueEvent(scrollYProgress, 'change', value => {
    setReached(value <= 0 ? 0 : Math.min(count, Math.floor(value * count) + 1))
  })
  const lit = reduced ? count : reached

  return (
    <section
      id="stages"
      aria-labelledby="dir-corporate-stages-title"
      className="dir-corporate-stages px-6 pb-20 pt-24 md:px-10 md:pb-28 md:pt-32 lg:px-20"
    >
      <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <Kicker>06 / Этапы</Kicker>
          <h2
            id="dir-corporate-stages-title"
            data-reveal=""
            className={cn(
              KIT_TITLE,
              'mt-5 max-w-[16ch] text-[clamp(2.1rem,5.6vw,5.25rem)] leading-[0.94]'
            )}
          >
            {headline(CORPORATE_PAGE.processTitle)}
          </h2>
        </div>
        <p className="max-w-md text-base leading-relaxed text-white/75 [text-wrap:pretty] md:text-lg lg:col-span-4 lg:col-start-9">
          {tidy(CORPORATE_PAGE.processLead)}
        </p>
      </div>

      <div className="dir-corporate-track">
        <span aria-hidden="true" className="dir-corporate-track-rail" />
        <motion.span
          aria-hidden="true"
          className="dir-corporate-track-fill"
          data-axis="x"
          style={{ scaleX: fill }}
        />
        <motion.span
          aria-hidden="true"
          className="dir-corporate-track-fill"
          data-axis="y"
          style={{ scaleY: fill }}
        />
        <ol ref={trackRef} role="list" className="dir-corporate-steps">
          {steps.map((step, position) => (
            <li
              key={step.number}
              data-on={position < lit}
              data-last={position === count - 1}
              className="dir-corporate-step"
            >
              <span aria-hidden="true" className="dir-corporate-step-node">
                <span />
              </span>
              <span
                aria-hidden="true"
                className="dir-corporate-step-num font-brand-hero tabular-nums"
              >
                {step.number}
              </span>
              <h3 className="dir-corporate-step-title font-stage uppercase">
                {headline(step.title)}
              </h3>
              <p className="dir-corporate-step-text [text-wrap:pretty]">{tidy(step.text)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="dir-corporate-next grid gap-x-12 gap-y-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-6">
          <Kicker>Шаг 01 из {pad(count)}</Kicker>
          <h3
            data-reveal=""
            className="mt-5 font-stage text-[clamp(2rem,5vw,4.75rem)] uppercase leading-[0.94] tracking-[-0.03em] text-white text-balance"
          >
            {headline(cta.title)}
          </h3>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/75 [text-wrap:pretty] md:text-lg">
            {tidy(cta.text)}
          </p>
        </div>
        <div className="lg:col-span-6">
          <button
            type="button"
            onClick={() => page.openBrief('process')}
            className="dir-corporate-rail-btn"
          >
            <span aria-hidden="true" className="dir-corporate-rail-curtain" />
            <span className="dir-corporate-rail-label font-stage uppercase">
              {tidy(cta.ctaLabel)}
            </span>
            <span aria-hidden="true" className="dir-corporate-rail-ring">
              <ArrowRight className="h-5 w-5" />
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── Плёнка из стопкадров ───────────────────────────── */

/**
 * Широкая полоса кадров между этапами и вопросами: пауза без текста. Плёнка
 * едет за прокруткой (transform), на телефоне — тем же жестом пальца. Чисто
 * декор: кадры без подписей для скринридера, текста для чтения здесь нет.
 */
function FilmBand({ frames }: { frames: Shot[] }) {
  // Хуки прокрутки живут во вложенном компоненте: без кадров узел не рисуется, а
  // useScroll с ref, не привязанным к узлу, в разработке падает с invariant
  if (frames.length === 0) return null
  return <FilmBandTrack frames={frames} />
}

function FilmBandTrack({ frames }: { frames: Shot[] }) {
  const reduced = useReduced()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], reduced ? ['0%', '0%'] : ['3%', '-14%'])

  return (
    <div ref={ref} aria-hidden="true" className="dir-corporate-band">
      <motion.ul role="presentation" style={{ x }} className="dir-corporate-band-track">
        {frames.map((shot, index) => (
          <li key={`${shot.src}-${index}`} className="dir-corporate-band-frame">
            <div className="dir-corporate-band-img">
              <Reframe crop={shot.crop}>
                <Still
                  src={shot.src}
                  alt=""
                  sizes="(min-width: 1024px) 26vw, 64vw"
                  quality={50}
                  className="h-full w-full"
                />
              </Reframe>
            </div>
            <p className="dir-corporate-band-code type-meta font-mono uppercase tabular-nums">
              <span>Кадр {pad(index + 1)}</span>
              <span>{shot.client}</span>
            </p>
          </li>
        ))}
      </motion.ul>
    </div>
  )
}

/* ───────────────────────────── Вопросы: заголовок держится рядом с кадром ───────────────────────────── */

/**
 * Тот же аккордеон APG, что и в общем блоке, но слева под заголовком стоит
 * кадр: без него левая половина раздела пустая. Ответы лежат в DOM целиком,
 * первый раскрыт с сервера; индекс вопроса спрятан от скринридера, чтобы он не
 * склеивался с текстом вопроса.
 */
function Faq({ frame }: { frame: Shot | null }) {
  const page = useDirectionPage()
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const items = CORPORATE_PAGE.faq
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]))

  const toggle = (position: number) =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(position)) next.delete(position)
      else next.add(position)
      return next
    })

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, position: number) => {
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

  return (
    <section
      aria-labelledby="dir-corporate-faq-title"
      className="border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Kicker>07 / Вопросы</Kicker>
            <h2
              id="dir-corporate-faq-title"
              data-reveal=""
              className={cn(
                KIT_TITLE,
                'mt-5 max-w-[14ch] text-[clamp(1.6rem,2.9vw,2.9rem)] leading-[0.94]'
              )}
            >
              {headline('Вопросы о корпоративном видео')}
            </h2>
            {frame ? (
              <div aria-hidden="true" className="dir-corporate-faqframe">
                <Reframe crop={frame.crop}>
                  <Still
                    src={frame.src}
                    alt=""
                    sizes="(min-width: 1024px) 34vw, 100vw"
                    quality={65}
                    className="h-full w-full"
                  />
                </Reframe>
                <span className="dir-corporate-stage-shade" />
                <span className="dir-corporate-mark" data-c="tl" />
                <span className="dir-corporate-mark" data-c="br" />
                <p className="dir-corporate-plate absolute bottom-3 left-3 z-[5]">
                  Кадр из портфолио · {frame.client}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div ref={listRef}>
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
                        className="dir-kit-faq-idx type-meta font-mono uppercase tabular-nums"
                      >
                        {pad(position + 1)}
                      </span>{' '}
                      <span className="dir-kit-faq-q text-[clamp(1.125rem,1.7vw,1.5rem)] leading-[1.25] tracking-[-0.005em] [text-wrap:balance]">
                        {tidy(item.question)}
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
                      <p className="max-w-[40rem] pb-8 pl-[2.5rem] pr-12 text-[clamp(1rem,1.25vw,1.1875rem)] leading-[1.65] text-white/80 [text-wrap:pretty] md:pb-10 md:pl-[3.75rem] md:pr-16">
                        {tidy(item.answer)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-10 md:pl-[3.75rem]">
            <p className="text-sm text-white/70 md:text-base">
              {tidy('Нет вашего вопроса? Задайте его в брифе.')}
            </p>
            <button
              type="button"
              onClick={() => page.openBrief('faq')}
              className="dir-corporate-faq-link type-meta inline-flex items-center gap-3 font-mono uppercase text-white"
            >
              К брифу
              <ArrowRight aria-hidden="true" className="dir-corporate-faq-arrow h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Бегущий титр финала — общий блок, и его анимация не знает про экран. Здесь
 * она ждёт: пока финал вне кадра, титр стоит на паузе (правило в CSS страницы).
 */
function EndGuard() {
  useEffect(() => {
    const end = document.getElementById('direction-end')
    if (!end || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      end.dataset.live = String(Boolean(entry?.isIntersecting))
    })
    observer.observe(end)
    return () => {
      observer.disconnect()
      delete end.dataset.live
    }
  }, [])
  return null
}

/* ───────────────────────────── Страница ───────────────────────────── */

export function CorporatePage({ works }: CorporatePageProps) {
  const chapters = useMemo(() => resolveChapters(works), [works])
  const plan = useMemo(() => {
    const chapterSrcs = new Set(
      chapters.map(chapter => chapter.src).filter((src): src is string => src !== null)
    )
    const shots = planShots(works, chapterSrcs)
    // Порядок раздачи — порядок появления на странице: кадры, которые выше,
    // получают свежие, а те, что ниже, — перекадрированные повторы
    return {
      rows: shots.rows,
      audience: shots.extras(3),
      band: shots.extras(6),
      faq: shots.extras(1)[0] ?? null,
    }
  }, [chapters, works])
  const hasWorks = works.length > 0
  const frames = interleaveFrames(works, 6)
  const closing = frames[frames.length - 1]
  const end = CORPORATE_PAGE.end
  const endLines = end.lines.map(line => tidy(line))

  return (
    <DirectionShell
      id="corporate"
      stickyLabel={CORPORATE_PAGE.stickyLabel}
      className="dir-corporate min-h-screen bg-[#000000] pb-20 md:pb-0"
    >
      <Hero chapters={chapters} />
      <Statement />
      <Chapters chapters={chapters} />
      <Splice label="Далее — для кого фильм" />
      <Audiences chapters={chapters} frames={plan.audience} />
      {hasWorks ? <Splice label="Далее — работы" /> : null}
      <Works works={works} rows={plan.rows} />
      <SlateCta hasWorks={hasWorks} />
      <Sheet />
      <Stages />
      <FilmBand frames={plan.band} />
      <Faq frame={plan.faq} />
      <OtherDirections current="corporate" reading={DIRECTION_READING['corporate']} />
      <DirectionEnd
        // Пробел в конце строки не виден, но попадает в textContent заголовка:
        // иначе строки склеиваются в «С чегоначнётсяваш фильм?» для скринридера и поиска
        lines={endLines.map((line, position) =>
          position < endLines.length - 1 ? `${line} ` : line
        )}
        ctaLabel={tidy(end.ctaLabel)}
        note={tidy(end.note)}
        frame={closing ? { src: closing.src, alt: closing.client } : null}
      />
      <EndGuard />
    </DirectionShell>
  )
}
