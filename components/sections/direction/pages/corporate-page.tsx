/**
 * /corporate-video — «ГЛАВЫ».
 *
 * Метафора: документальный фильм о компании, собранный из четырёх глав. Это
 * самый медленный и спокойный язык из шести страниц: корпоративный заказчик
 * покупает ясность и предсказуемость, а не эффект.
 *
 * Первый экран — открывающие титры. На чёрном проводится красная линия, из неё
 * раскрывается кадр (леттербокс), и только тогда идёт тайм-код с 00:00:00:00;
 * по нижней кромке кадра тонкой строкой бежит титр, по линейке сам идёт плейхед
 * и на границах глав жёстко меняет кадр. Курсор над главой (или фокус с
 * клавиатуры) перематывает кадр, касание ведёт к главе; при прокрутке полосы
 * леттербокса сходятся, как перед финальными титрами.
 *
 * Дальше: вступление, которое «проявляется» слово за словом; главы на
 * закреплённой сцене (кадр, титр-карта с номером и тайм-кодом меняются с
 * прокруткой, справа — только название, абзац и «В кадре»); переключатель «для
 * кого фильм» с живой сменой кадра, текста и монтажной дорожки; работы тремя
 * разными разворотами; призыв-«хлопушка»; один светлый лист «Этапы и
 * согласования» с дорожкой до конца и списком того, что нужно от компании;
 * плёнка из стопкадров; вопросы с кадром.
 *
 * Движение: только transform, clip-path и opacity декора. Текст физически
 * в разметке и виден с первого кадра (вход — сдвиг на десяток пикселей).
 * Бесконечные вещи — наезд кадра, бегущий титр и ход плейхеда — стоят, пока
 * первый экран вне экрана, и выключены при prefers-reduced-motion.
 *
 * Если работ из портфолио нет, каждая секция остаётся целой: вместо кадров —
 * чертёжная плашка с сеткой.
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
import { DirectionFaq } from '../direction-faq'
import {
  DirectionButton,
  KIT_KICKER,
  KIT_TITLE,
  KIT_TITLE_SIZE,
  setTitle,
  typo,
} from '../direction-kit'
import { OtherDirections } from '../other-directions'
import { Still } from '../still'
import '../direction-kit.css'
import './corporate-page.css'

export interface CorporatePageProps {
  works: DirectionPageWork[]
}

const pad = (value: number) => String(value).padStart(2, '0')
const delay = (ms: number) => ({ '--dc-d': `${ms}ms` }) as CSSProperties

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
function Kicker({ children, paper = false }: { children: ReactNode; paper?: boolean }) {
  return (
    <p className={cn(KIT_KICKER, paper && 'dir-corporate-kicker-paper')}>
      <span aria-hidden="true" className="h-px w-8 bg-accent" />
      {children}
    </p>
  )
}

/** Угловые засечки рамки кадра, как на визире камеры */
function Marks({ cross = true }: { cross?: boolean }) {
  return (
    <>
      <span aria-hidden="true" className="dir-corporate-mark" data-c="tl" />
      <span aria-hidden="true" className="dir-corporate-mark" data-c="tr" />
      <span aria-hidden="true" className="dir-corporate-mark" data-c="bl" />
      <span aria-hidden="true" className="dir-corporate-mark" data-c="br" />
      {cross ? <span aria-hidden="true" className="dir-corporate-cross" /> : null}
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
      <span className="dir-kit-meta font-mono uppercase text-white/65">{label}</span>
    </div>
  )
}

/* ───────────────────────────── Линейка глав ───────────────────────────── */

interface RulerProps {
  chapters: Chapter[]
  active: number
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
function Ruler({ chapters, active, onEnter, onLeave, rulerRef, children }: RulerProps) {
  return (
    <div ref={rulerRef} className="dir-corporate-ruler">
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
              className="dir-corporate-cell dir-kit-meta font-mono uppercase"
            >
              <span className="dir-corporate-cell-idx">{chapter.number}</span>{' '}
              <span className="dir-corporate-cell-name">{typo(chapter.title)}</span>
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
/** Счёт идёт после раскрытия кадра: первый видимый кадр показывает 00:00:00:00 */
const REEL_START_MS = 900
/** Полосы леттербокса сходятся с прокруткой: до какой доли высоты кадр закрывается */
const LETTERBOX_CLOSE = '12%'

function reelTimecode(seconds: number): string {
  const whole = Math.floor(seconds)
  const frame = Math.floor((seconds - whole) * 25)
  return `00:${pad(Math.floor(whole / 60))}:${pad(whole % 60)}:${pad(frame)}`
}

function Hero({ chapters }: { chapters: Chapter[] }) {
  const page = useDirectionPage()
  const reduced = useReduced()
  const hero = CORPORATE_PAGE.hero
  const count = chapters.length
  const rootRef = useRef<HTMLElement>(null)
  const rulerRef = useRef<HTMLDivElement>(null)
  const headRef = useRef<HTMLSpanElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const [armed, setArmed] = useState(false)
  const [live, setLive] = useState(true)
  // Состояние хода живёт в ref: головка и тайм-код двигаются без перерисовки React
  const reel = useRef({ pos: 0, hold: false, visible: true, raf: 0, last: 0, index: 0, from: 0 })
  const controls = useRef<{ start: () => void; stop: () => void }>({
    start: () => {},
    stop: () => {},
  })

  const paint = useCallback(() => {
    const { pos } = reel.current
    const head = headRef.current
    if (head) head.style.transform = `translate3d(${pos * 100}%, 0, 0)`
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
    r.from = performance.now() + REEL_START_MS
    const step = (now: number) => {
      // Пока кадр раскрывается, тайм-код стоит на нуле
      if (now < r.from) {
        r.last = now
        r.raf = requestAnimationFrame(step)
        return
      }
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
  // Полосы леттербокса сходятся к центру, пока первый экран уходит: как перед финальными титрами
  const open = 'inset(0% 0% 0% 0%)'
  const closed = `inset(${LETTERBOX_CLOSE} 0% ${LETTERBOX_CLOSE} 0%)`
  const clipPath = useTransform(scrollY, [0, 700], reduced ? [open, open] : [open, closed])

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
        <motion.div style={{ clipPath }} className="absolute inset-0">
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
        </motion.div>
        <span className="dir-corporate-hero-light" />
        <span className="dir-corporate-hero-scrim" />
        {/* Красная линия-щель: из неё раскрывается кадр */}
        <span className="dir-corporate-slit" />
        <Marks cross={false} />
        {/* Окно визира: запись и тайм-код, счёт пошёл после раскрытия кадра */}
        <div className="dir-corporate-hud">
          <span className="dir-corporate-hud-dot" />
          <span className="dir-kit-meta font-mono uppercase">TC</span>
          <span ref={tcRef} className="dir-kit-meta font-mono tabular-nums">
            00:00:00:00
          </span>
        </div>
        {current?.client ? (
          <p className="dir-corporate-hud-credit dir-kit-meta font-mono uppercase">
            Кадр из портфолио · {current.client}
          </p>
        ) : null}
      </div>
      <span aria-hidden="true" className="dir-corporate-hero-edge" data-side="top" />
      <span aria-hidden="true" className="dir-corporate-hero-edge" data-side="bottom" />

      {/* Тонкий бегущий титр по нижней кромке кадра: только то, что уже есть на странице */}
      <div aria-hidden="true" className="dir-corporate-credits">
        <div className="dir-corporate-credits-track">
          {[0, 1, 2, 3].map(half => (
            <span key={half} className="dir-corporate-credits-run">
              {CORPORATE_PAGE.credits.map(item => (
                <span key={item} className="dir-corporate-credits-item dir-kit-meta font-mono">
                  {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="dir-corporate-hero-body">
        <div>
          <p className={cn('dir-corporate-rise', KIT_KICKER, 'text-white/75')} style={delay(520)}>
            <span
              aria-hidden="true"
              className="dir-corporate-draw h-px w-8 bg-accent"
              style={delay(420)}
            />
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
              {typo('о компании')}
            </span>
          </h1>

          <p
            className="dir-corporate-rise mt-6 max-w-[32rem] text-[1.0625rem] font-light leading-snug text-white/85 [text-wrap:pretty] md:mt-8 md:text-xl"
            style={delay(560)}
          >
            {typo(hero.lead)}
          </p>

          <div
            className="dir-corporate-rise mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8"
            style={delay(700)}
          >
            <DirectionButton
              label={CORPORATE_PAGE.ctaLabel}
              onClick={() => page.openBrief('hero')}
              className="w-full sm:w-auto sm:min-w-[19rem]"
            />
            <a href="#chapters" className="dir-corporate-link text-base">
              Четыре главы фильма
              <ArrowDown aria-hidden="true" className="dir-corporate-link-icon h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="dir-corporate-hero-bar">
        <p
          aria-hidden="true"
          className="dir-corporate-now dir-kit-meta font-mono uppercase md:hidden"
        >
          <span className="text-accent">Глава {current?.number}</span>
          <span> · {typo(current?.title ?? '')}</span>
        </p>
        <nav aria-label="Главы фильма">
          <Ruler
            chapters={chapters}
            active={active}
            onEnter={hold}
            onLeave={release}
            rulerRef={rulerRef}
          >
            <span ref={headRef} aria-hidden="true" className="dir-corporate-ruler-head" />
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
  const lead = typo(CORPORATE_PAGE.statement.lead).split(' ')
  const tail = typo(CORPORATE_PAGE.statement.tail).split(' ')
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
      className="relative bg-black px-6 pb-16 pt-20 md:px-10 md:pb-36 md:pt-44 lg:px-20"
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

function Chapters({ chapters }: { chapters: Chapter[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLLIElement | null)[]>([])
  const tcRef = useRef<HTMLSpanElement>(null)
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
  // на краях дорожки выбираем крайнюю главу по прогрессу, чтобы линейка не врала.
  // Тайм-код титр-карты идёт с прокруткой и пишется в узел напрямую, без перерисовки
  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (value >= 0.995) choose(count - 1)
    else if (value <= 0.005) choose(0)
    if (tcRef.current) {
      const clamped = Math.min(1, Math.max(0, value))
      tcRef.current.textContent = reelTimecode(clamped * REEL_SECONDS * count)
    }
  })

  const current = chapters[active] ?? chapters[0]

  return (
    <section
      id="chapters"
      aria-labelledby="dir-corporate-chapters-title"
      className="dir-corporate-chapters"
    >
      <div className="relative z-[1] px-6 pb-10 pt-16 md:px-10 md:pb-20 md:pt-32 lg:px-20">
        <Kicker>02 / Структура фильма</Kicker>
        <h2
          id="dir-corporate-chapters-title"
          data-reveal=""
          className={cn(
            KIT_TITLE,
            'mt-5 max-w-[14ch] text-[clamp(2.1rem,5.6vw,5.25rem)] leading-[0.94]'
          )}
        >
          {setTitle('Фильм из четырёх глав')}
        </h2>
      </div>

      {/* Закреплённая сцена занимает экран целиком, плавающая кнопка сметы на десктопе
          легла бы на правую колонку: пока сцена на экране, она скрыта */}
      <div
        ref={trackRef}
        data-sticky-hide="desktop"
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

              {current?.client ? (
                <p
                  aria-hidden="true"
                  className="dir-corporate-plate absolute right-6 top-6 z-[5] hidden xl:block"
                >
                  Кадр из портфолио · {current.client}
                </p>
              ) : null}

              {/* Титр-карта: номер главы прокручивается колонкой, рядом тайм-код идёт с прокруткой */}
              <div aria-hidden="true" className="dir-corporate-card">
                <div className="dir-corporate-roll">
                  <span className="block h-[1em] flex-none">0</span>
                  <span
                    className="dir-corporate-roll-col"
                    style={{ '--i': active } as CSSProperties}
                  >
                    {chapters.map(chapter => (
                      <span key={chapter.number}>{chapter.number.slice(-1)}</span>
                    ))}
                  </span>
                </div>
                <div className="dir-corporate-card-side">
                  <span className="dir-kit-meta font-mono uppercase text-white/75">
                    Глава / {pad(count)}
                  </span>
                  <span ref={tcRef} className="dir-kit-meta font-mono tabular-nums text-white">
                    00:00:00:00
                  </span>
                </div>
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
              {/* Кадр главы на телефоне: на всю ширину, титр-карта накладывается на нижнюю кромку */}
              <div
                aria-hidden="true"
                data-reveal=""
                data-plate={chapter.src ? undefined : 'true'}
                className="dir-corporate-mframe relative -mx-6 aspect-[16/9] overflow-hidden bg-[#0b0b0b] sm:aspect-[16/10] md:-mx-10 lg:hidden"
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
                <span className="dir-corporate-mark" data-c="tr" />
                <div className="dir-corporate-card dir-corporate-card-m">
                  <span className="dir-corporate-mnum">{chapter.number}</span>
                  <span className="dir-kit-meta font-mono uppercase text-white/75">
                    Глава / {pad(count)}
                  </span>
                </div>
              </div>

              <div className="mt-6 lg:mt-0 lg:flex lg:flex-1 lg:flex-col lg:justify-center">
                <div className="dir-kit-meta flex items-center gap-4 font-mono uppercase tabular-nums">
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
                  {setTitle(chapter.title)}
                </h3>

                <p className="dir-corporate-panel-text dir-corporate-measure mt-6 text-base leading-relaxed md:text-[1.0625rem] [text-wrap:pretty]">
                  {typo(chapter.text)}
                </p>

                <div className="dir-corporate-shotlist dir-corporate-measure">
                  <p className="dir-corporate-shotlist-label dir-kit-meta font-mono uppercase text-white">
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
      className="bg-black px-6 py-16 md:px-10 md:py-28 lg:px-20"
    >
      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Kicker>03 / Для кого фильм</Kicker>
          <h2
            id="dir-corporate-aud-title"
            data-reveal=""
            className={cn(KIT_TITLE, KIT_TITLE_SIZE, 'mt-5 max-w-[16ch] leading-[0.94]')}
          >
            {setTitle('Один материал — три аудитории')}
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
                <span aria-hidden="true" className="dir-corporate-tab-idx dir-kit-meta font-mono">
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
            {typo(CORPORATE_PAGE.audiencesNote)}
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
                  {setTitle(item.title)}
                </h3>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 [text-wrap:pretty] md:text-lg">
                  {typo(item.text)}
                </p>
                <p className="dir-kit-meta mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono uppercase text-white/65">
                  <span className="text-white">Где идёт</span>
                  <span aria-hidden="true" className="text-accent">
                    /
                  </span>
                  <span>{item.where}</span>
                </p>
              </div>
            ))}
          </div>

          <div data-sticky-hide="desktop" className="mt-12 border-t border-white/15 pt-6">
            <div className="dir-kit-meta flex items-center justify-between gap-6 font-mono uppercase text-white/60">
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
                    className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-2 border-b border-white/10 py-3 sm:grid-cols-[2rem_minmax(0,11rem)_minmax(0,1fr)_5.5rem] sm:items-center sm:gap-x-5"
                  >
                    <span
                      aria-hidden="true"
                      className="dir-kit-meta font-mono tabular-nums text-white/55"
                    >
                      {chapter.number}
                    </span>
                    <span className="text-base text-white md:text-[1.0625rem]">
                      {typo(chapter.title)}
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
                        'dir-corporate-weight dir-kit-meta text-right font-mono uppercase',
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
      className="bg-black px-6 pb-12 pt-6 md:px-10 md:pb-24 lg:px-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-b border-white/15 pb-6">
        <div>
          <Kicker>04 / Работы</Kicker>
          <h2
            id="dir-corporate-works-title"
            data-reveal=""
            className={cn(KIT_TITLE, KIT_TITLE_SIZE, 'mt-5 leading-[0.94]')}
          >
            {setTitle('Корпоративные работы')}
          </h2>
        </div>
        <p className="dir-kit-meta max-w-xs font-mono uppercase leading-relaxed text-white/70">
          {typo('Работы для компаний и брендов')}
        </p>
      </div>

      <ul ref={listRef} role="list" data-sticky-hide="desktop">
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
                  <span className="dir-corporate-work-idx dir-kit-meta font-mono tabular-nums uppercase">
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
                          <span className="dir-corporate-shot-code font-mono uppercase">
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
                      {typo(work.title)}
                    </span>
                    {excerpt ? (
                      <span className="mt-3 block max-w-md text-sm leading-relaxed text-white/70 [text-wrap:pretty] md:text-base">
                        {typo(excerpt)}
                      </span>
                    ) : null}
                  </div>
                  <span className="dir-corporate-work-go flex items-center gap-3">
                    <span className="dir-kit-meta font-mono uppercase tabular-nums text-white/70">
                      {work.year ?? ' '}
                    </span>
                    <span className="dir-kit-meta font-mono uppercase text-white">
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
      className="bg-black px-6 pb-24 pt-20 md:px-10 md:pb-32 md:pt-28 lg:px-20"
    >
      {/* Во весь ряд сетки: справа не остаётся мёртвой колонки. Плавающая кнопка сметы
          закрывала бы правый нижний угол, поэтому пока хлопушка на экране, она скрыта */}
      <div data-reveal="" data-sticky-hide="" className="dir-corporate-slate">
        <div aria-hidden="true" className="dir-corporate-slate-arm" />
        <div className="dir-corporate-slate-board grid lg:grid-cols-12">
          <div className="p-6 md:p-10 lg:col-span-7 lg:border-r lg:border-white/50">
            <Kicker>{hasWorks ? 'Следующая работа' : 'Бриф'}</Kicker>
            <h2
              id="dir-corporate-slate-title"
              className="mt-5 font-stage text-[clamp(1.9rem,4.4vw,4.1rem)] uppercase leading-[0.96] tracking-[-0.03em] text-white text-balance"
            >
              {setTitle(cta.title)}
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/80 [text-wrap:pretty] md:text-lg">
              {typo(cta.text)}
            </p>
            <DirectionButton
              label={CORPORATE_PAGE.ctaLabel}
              onClick={() => page.openBrief('proof')}
              className="mt-9 w-full sm:w-auto sm:min-w-[19rem]"
            />
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
                <dt className="dir-kit-meta font-mono uppercase text-white/65">{field.label}</dt>
                <dd className="font-stage text-[clamp(1.05rem,2vw,1.75rem)] uppercase leading-[1.05] tracking-[-0.015em] text-white text-balance">
                  {typo(field.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── Этапы и согласования: один светлый лист ───────────────────────────── */

/** Буквы вместо цифр у «что нужно от компании»: рядом идёт нумерация этапов, две цифровых путались бы */
const ASK_MARKS = ['А', 'Б', 'В', 'Г']

function Process() {
  const reduced = useReduced()
  const steps = CORPORATE_PAGE.process
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
      aria-labelledby="dir-corporate-process-title"
      className="dir-corporate-process dir-paper-section px-6 pb-16 pt-16 md:px-10 md:pb-28 md:pt-28 lg:px-20"
    >
      <span aria-hidden="true" className="dir-corporate-sheet-mark" data-c="tl" />
      <span aria-hidden="true" className="dir-corporate-sheet-mark" data-c="tr" />
      <span aria-hidden="true" className="dir-corporate-sheet-mark" data-c="bl" />
      <span aria-hidden="true" className="dir-corporate-sheet-mark" data-c="br" />

      <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-12">
          <Kicker paper>05 / Этапы и согласования</Kicker>
          <h2
            id="dir-corporate-process-title"
            data-reveal=""
            className="dir-corporate-process-title mt-5 font-stage uppercase"
          >
            {setTitle(CORPORATE_PAGE.processTitle)}
          </h2>
        </div>
        <p className="max-w-md text-base leading-relaxed dir-corporate-mute [text-wrap:pretty] md:text-lg lg:col-span-5">
          {typo(CORPORATE_PAGE.processLead)}
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
                {setTitle(step.title)}
              </h3>
              <p className="dir-corporate-step-text [text-wrap:pretty]">{typo(step.text)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="dir-corporate-asks grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h3
            data-reveal=""
            className="dir-corporate-asks-title font-stage uppercase leading-[0.96] tracking-[-0.03em] text-balance"
          >
            {CORPORATE_PAGE.asksTitle.map((line, position) => (
              <Fragment key={line}>
                {position > 0 ? ' ' : null}
                <span className="block">{typo(line)}</span>
              </Fragment>
            ))}
          </h3>
          <p className="mt-5 max-w-sm text-base leading-relaxed dir-corporate-mute [text-wrap:pretty] md:text-lg">
            {typo(CORPORATE_PAGE.asksLead)}
          </p>
        </div>

        <ol role="list" className="lg:col-span-7">
          {CORPORATE_PAGE.asks.map((ask, position) => (
            <li
              key={ask.title}
              data-reveal=""
              className="dir-corporate-sheet-row grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 py-5 md:grid-cols-[5.5rem_minmax(0,1fr)] md:py-8"
            >
              <span
                aria-hidden="true"
                className="font-stage text-[clamp(1.9rem,4.2vw,3.6rem)] leading-[0.9] tracking-[-0.04em]"
              >
                {ASK_MARKS[position]}
              </span>
              <div>
                <h4 className="font-stage text-[clamp(1.25rem,2.1vw,1.9rem)] uppercase leading-none tracking-[-0.02em]">
                  {setTitle(ask.title)}
                </h4>
                <p className="mt-3 max-w-md text-base leading-relaxed dir-corporate-mute [text-wrap:pretty]">
                  {typo(ask.text)}
                </p>
              </div>
            </li>
          ))}
        </ol>
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
            <p className="dir-corporate-band-code dir-kit-meta font-mono uppercase tabular-nums">
              <span>Кадр {pad(index + 1)}</span>
              <span>{shot.client}</span>
            </p>
          </li>
        ))}
      </motion.ul>
    </div>
  )
}

/* ───────────────────────────── Вопросы и финал: знаки сцены ───────────────────────────── */

/** Кадр в левой липкой колонке вопросов: без него левая половина раздела пустая */
function FaqFrame({ frame }: { frame: Shot }) {
  return (
    <div aria-hidden="true" className="dir-corporate-faqframe">
      <Reframe crop={frame.crop}>
        <Still
          src={frame.src}
          alt=""
          sizes="(min-width: 1024px) 34vw, 1px"
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
  )
}

/**
 * Знак сцены для финала: ракорд, как перед началом фильма. Круг, перекрестие и
 * цифра «01» — первый шаг. Статичная линия в один пиксель; красная точка — метка
 * начала. Декор: слот End сам ставит aria-hidden.
 */
function Leader() {
  // Координаты округлены: в последних знаках Math.sin на сервере и в браузере расходится,
  // и гидрация видит другую строку пути
  const at = (angle: number, radius: number) =>
    `${(140 + Math.sin(angle) * radius).toFixed(2)} ${(140 - Math.cos(angle) * radius).toFixed(2)}`
  const ticks = Array.from({ length: 24 }, (_, index) => {
    const angle = (index / 24) * Math.PI * 2
    return `M${at(angle, index % 6 === 0 ? 112 : 120)} L${at(angle, 130)}`
  }).join(' ')
  return (
    <svg
      viewBox="0 0 280 280"
      focusable="false"
      className="dir-corporate-leader"
      fill="none"
      strokeWidth="1"
    >
      <circle
        cx="140"
        cy="140"
        r="130"
        stroke="rgb(255 255 255 / 0.38)"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="140"
        cy="140"
        r="96"
        stroke="rgb(255 255 255 / 0.2)"
        vectorEffect="non-scaling-stroke"
      />
      <path d={ticks} stroke="rgb(255 255 255 / 0.5)" vectorEffect="non-scaling-stroke" />
      <path
        d="M0 140 H60 M220 140 H280 M140 0 V60 M140 220 V280"
        stroke="rgb(255 255 255 / 0.3)"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M140 140 L140 44 A96 96 0 0 1 236 140 Z" fill="rgb(255 255 255 / 0.05)" />
      <circle cx="140" cy="10" r="4" fill="#ff2936" />
      <text
        x="140"
        y="176"
        textAnchor="middle"
        fill="rgb(255 255 255 / 0.92)"
        style={{ fontFamily: 'var(--font-stage)', fontSize: 112, letterSpacing: '-0.05em' }}
      >
        01
      </text>
    </svg>
  )
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
      <Process />
      <FilmBand frames={plan.band} />
      <DirectionFaq
        index="06"
        title="Вопросы о корпоративном видео"
        items={CORPORATE_PAGE.faq}
        aside={plan.faq ? <FaqFrame frame={plan.faq} /> : undefined}
      />
      <OtherDirections current="corporate" reading={DIRECTION_READING['corporate']} />
      <DirectionEnd
        lines={end.lines}
        ctaLabel={end.ctaLabel}
        note={end.note}
        frame={closing ? { src: closing.src, alt: closing.client } : null}
        aside={<Leader />}
      />
    </DirectionShell>
  )
}
