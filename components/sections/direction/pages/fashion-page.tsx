/**
 * /fashion-video — «РАЗВОРОТ».
 *
 * Метафора: журнальный номер, который листают. Страница идёт как номер:
 * обложка → оглавление → разворот → лукбук → работы → выходные данные.
 * Чёрная страница с кадрами чередуется с «бумажной» (оглавление, работы,
 * купон): смена фона — это и есть переворот страницы. Бумага — общий токен
 * семейства (.dir-paper-section), загнутый угол — фирменная деталь этой сцены.
 *
 * Фирменный жест первого экрана — обложка листается сама: кадры сменяют друг
 * друга сгибом (clip-path с тенью у кромки), под подписью бежит счётчик
 * «кадр 02 / 05». Реагирует на ввод: курсор сдвигает обложку и заголовок,
 * на touch кадр листается тапом и свайпом, на клавиатуре — кнопками.
 *
 * Движение: только transform, clip-path и opacity декора. Текст физически в
 * разметке и виден с первого кадра (вход — keyframes со сдвигом, без
 * opacity:0). Бесконечных анимаций нет: листание обложки — таймер, он стоит,
 * пока обложка вне экрана, под курсором или при prefers-reduced-motion.
 *
 * Кадры. Декор (обложка, оглавление, разворот, вопросы, финал) — отобранные
 * кадры сцены без клиента и ссылки на кейс (lib/services/scene-stills.ts), поэтому
 * подписей «Кадр — {клиент}» у них нет. Кадры работ остаются только там, где кадр
 * ведёт на кейс: в лукбуке и карточках работ.
 *
 * Если работ из портфолио нет, лукбук остаётся целым: вместо кадров — типографические
 * заставки со словами «Ткань», «Свет», «Пластика». Те же заставки — страховка на
 * случай, если у сцены не хватит кадров.
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
  type PointerEvent as ReactPointerEvent,
} from 'react'
import Link from 'next/link'
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Scissors } from 'lucide-react'

import { cn } from '@/lib/utils'
import { DIRECTION_READING } from '@/lib/services/pages'
import { FASHION_PAGE } from '@/lib/services/pages/content/fashion'
import {
  firstSentence,
  interleaveFrames,
  isCredited,
  type DirectionPageWork,
  type SceneFrame,
} from '@/lib/services/pages/resolve'
import { sceneFrame, sceneFramesFor } from '@/lib/services/scene-stills'
import { DirectionShell } from '../direction-shell'
import { useDirectionPage } from '../direction-context'
import { DirectionEnd } from '../direction-end'
import { DirectionFaq } from '../direction-faq'
import { DirectionButton, setTitle, typo } from '../direction-kit'
import { OtherDirections } from '../other-directions'
import { Still } from '../still'
import './fashion-page.css'

export interface FashionPageProps {
  works: DirectionPageWork[]
}

const SCENE = FASHION_PAGE.scene
const FORMATS = FASHION_PAGE.formats
const SPREAD_ID = 'fashion-spread'

/** Автолистание обложки: первый лист — сразу после загрузки кадров, дальше — в ритме */
const FIRST_FLIP_MS = 1500
const AUTO_FLIP_MS = 4300
const TOUCH_HOLD_MS = 8000

const pad = (value: number) => String(value).padStart(2, '0')
/** Слово-заставка по кругу: список короткий, слотов больше */
const plateWord = (index: number) => SCENE.plates[index % SCENE.plates.length] ?? ''
const delay = (ms: number, extra?: CSSProperties) =>
  ({ '--fs-d': `${ms}ms`, ...extra }) as CSSProperties

const reducedNow = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Сниженное движение без расхождения с серверной разметкой: на сервере и в
 * первом проходе гидрации — false, настоящее значение приходит следующим
 * рендером. Разметка от настройки браузера не зависит, меняются лишь диапазоны
 * motion-значений после монтирования.
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

function jumpTo(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: reducedNow() ? 'auto' : 'smooth', block: 'start' })
}

/** Листает пиннутый разворот к середине нужного формата */
function goToFormat(index: number) {
  const track = document.getElementById(SPREAD_ID)
  if (!track) return
  const top = track.getBoundingClientRect().top + window.scrollY
  const range = Math.max(0, track.offsetHeight - window.innerHeight)
  window.scrollTo({
    top: top + (range * (index + 0.5)) / FORMATS.length,
    behavior: reducedNow() ? 'auto' : 'smooth',
  })
}

/** Кадр по кругу: если кадров меньше, чем слотов, сцена не остаётся дырявой */
function pick(frames: SceneFrame[], index: number): SceneFrame | null {
  if (frames.length === 0) return null
  return frames[index % frames.length] ?? null
}

/**
 * Кроп обложки на телефоне. Полоса там почти горизонтальная (около 327×227: видна
 * лишь половина высоты вертикального кадра), и собственная точка кадра режет лицо
 * по глазам или прижимает его к верхним кнопкам. Здесь точка поднята к лицу; на
 * десктопе обложка 3:4 повторяет пропорцию кадра, и кроп ничего не меняет.
 * Ключ — key кадра сцены, остальные кадры берут собственную точку.
 */
const COVER_CROP: Record<string, string> = {
  'scene-burgundy-hall': '62% 12%',
  'scene-redhead-lowkey': '52% 0%',
  'scene-swan-wall': '52% 0%',
  'scene-swan-red-wall': '52% 25%',
}

const coverCrop = (frame: SceneFrame | undefined) => (frame ? COVER_CROP[frame.key] : undefined)

/** Номера страниц «журнала»: разворот занимает по две страницы на формат */
function paginate(hasWorks: boolean) {
  let cursor = 3
  const take = (count: number) => {
    const from = cursor
    cursor += count
    return { from, label: count === 1 ? pad(from) : `${pad(from)}–${pad(cursor - 1)}` }
  }
  return {
    spread: take(FORMATS.length * 2),
    lookbook: take(2),
    works: hasWorks ? take(2) : null,
    process: take(1),
    faq: take(1),
  }
}

type Pages = ReturnType<typeof paginate>

/** Две страницы, на которых сейчас лежит открытый формат */
const spreadPages = (index: number) => `${pad(3 + index * 2)}–${pad(4 + index * 2)}`

/* ───────────────────────────── Общие мелочи набора ───────────────────────────── */

/** Колонтитул: бегущий заголовок слева, номер страницы справа, тонкая линия между */
function Folio({
  left,
  leftShort,
  right,
  tone = 'dark',
}: {
  left: string
  /** Короткая подпись для телефона: длинная там обрезалась бы многоточием */
  leftShort?: string
  right: string
  tone?: 'dark' | 'paper'
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'dir-kit-meta flex items-center gap-4 font-mono uppercase tabular-nums',
        tone === 'paper'
          ? 'text-[color:var(--dir-paper-mute)] max-lg:pr-[calc(var(--fs-fold)-0.5rem)]'
          : 'text-white/60'
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 bg-accent" />
      <span className="min-w-0 truncate">
        {leftShort ? (
          <>
            <span className="sm:hidden">{leftShort}</span>
            <span className="hidden sm:inline">{left}</span>
          </>
        ) : (
          left
        )}
      </span>
      <span className="h-px min-w-6 flex-1 bg-current opacity-30" />
      <span className="shrink-0">{right}</span>
    </div>
  )
}

/**
 * Загнутый угол листа: вырез в верхнем правом углу и оборот. Рисуется отдельным
 * узлом, а не clip-path секции: кромку общей бумаги (.dir-paper-section) нельзя
 * резать, она лежит снаружи секции. Соседний лист подряд — тот же лист, угол
 * у него скрыт стилями.
 */
function Dogear() {
  return <span aria-hidden="true" className="dir-fashion-dogear" />
}

interface PlateProps {
  frame: SceneFrame | null
  word: string
  index: number
  sizes: string
  priority?: boolean
  quality?: 50 | 65 | 75
  className?: string
  imgClassName?: string
  /** Кроп слота; без него — композиция самого кадра сцены, а у кадра работы — общий */
  objectPosition?: string
}

/** Кадр сцены или работы; если кадра нет, заставка: слово во весь рост на чёрном */
function Plate({
  frame,
  word,
  index,
  sizes,
  priority,
  quality = 65,
  className,
  imgClassName,
  objectPosition,
}: PlateProps) {
  if (frame) {
    return (
      <Still
        src={frame.src}
        alt=""
        sizes={sizes}
        priority={priority}
        quality={quality}
        className={className}
        imgClassName={imgClassName}
        objectPosition={objectPosition ?? frame.position ?? 'center 28%'}
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      className={cn('dir-fashion-plate relative overflow-hidden bg-[#0D0D0D]', className)}
    >
      <span
        className="dir-fashion-plate-word"
        style={{ '--fs-len': Math.max(word.length, 4) } as CSSProperties}
      >
        {word}
      </span>
      <span className="absolute right-3 top-3 h-2 w-2 bg-accent" />
      <span className="dir-kit-meta absolute bottom-3 right-3 font-mono tabular-nums text-white/60">
        {pad(index + 1)}
      </span>
    </div>
  )
}

/** Круглая кнопка управления: 44px, рамка в линию, на наведении заливка */
function RoundButton({
  label,
  onClick,
  disabled,
  tone = 'dark',
  children,
  ...rest
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  tone?: 'dark' | 'paper'
  children: React.ReactNode
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void
  onBlur?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className={cn(
        'grid h-11 w-11 place-items-center rounded-full border transition-[background-color,color,border-color,transform] duration-[var(--motion-state)] ease-[var(--ease-out-expo)] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-30',
        tone === 'dark'
          ? 'border-white/30 text-white hover:border-white hover:bg-white hover:text-black'
          : 'border-black/40 text-black hover:border-black hover:bg-black hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

/* ─────────────────────────────── 01. Обложка ─────────────────────────────── */

interface TurnState {
  cur: number
  to: number | null
  dir: 'fwd' | 'back'
}

function Cover({ frames }: { frames: SceneFrame[] }) {
  const page = useDirectionPage()
  const reduced = useReduced()
  const rootRef = useRef<HTMLElement>(null)
  const count = frames.length
  const [state, setState] = useState<TurnState>({ cur: 0, to: null, dir: 'fwd' })
  const [armed, setArmed] = useState(false)
  const [inView, setInView] = useState(true)
  const [held, setHeld] = useState(false)
  // Перезапуск таймера, если вкладка была в фоне и листать было нельзя
  const [beat, setBeat] = useState(0)
  // Пауза до следующего автолистания: первое — быстро, чтобы жест считался сразу
  const wait = useRef(FIRST_FLIP_MS)
  const tilt = useRef({ x: 0, y: 0, raf: 0 })
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null)

  const { scrollY } = useScroll()
  const coverY = useTransform(scrollY, [0, 900], [0, reduced ? 0 : -70])
  const titleY = useTransform(scrollY, [0, 700], [0, reduced ? 0 : 80])

  // Остальные кадры обложки подгружаем после первого: они не должны делить канал с LCP
  useEffect(() => {
    const id = window.setTimeout(() => setArmed(true), 900)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    const node = rootRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (entry) setInView(entry.isIntersecting)
      },
      { threshold: 0.15 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // hold — сколько молчит автолистание после ручного жеста (на touch дольше: курсора нет)
  const go = useCallback(
    (dir: 'fwd' | 'back', hold = AUTO_FLIP_MS) => {
      wait.current = hold
      setState(prev => {
        if (prev.to !== null || count < 2) return prev
        const to = (prev.cur + (dir === 'fwd' ? 1 : count - 1)) % count
        // Без движения кадр просто меняется
        return reduced ? { cur: to, to: null, dir } : { cur: prev.cur, to, dir }
      })
    },
    [count, reduced]
  )

  const settle = useCallback(
    () => setState(prev => (prev.to === null ? prev : { cur: prev.to, to: null, dir: prev.dir })),
    []
  )

  // Автолистание: только когда обложку видно, её не трогают и движение разрешено.
  // Таймер живёт между листаниями и сбрасывается любым ручным жестом: смена кадра
  // (state.to) отменяет ожидание, новое начинается после того, как лист лёг.
  useEffect(() => {
    if (!armed || !inView || held || reduced || count < 2 || state.to !== null) return
    const id = window.setTimeout(() => {
      if (document.hidden) setBeat(value => value + 1)
      else go('fwd')
    }, wait.current)
    return () => window.clearTimeout(id)
  }, [armed, inView, held, reduced, count, go, state.cur, state.to, beat])

  // Запасной выход, если animationend не пришёл (вкладка в фоне)
  useEffect(() => {
    if (state.to === null) return
    const id = window.setTimeout(settle, 1500)
    return () => window.clearTimeout(id)
  }, [state.to, settle])

  const applyTilt = useCallback(() => {
    const node = rootRef.current
    tilt.current.raf = 0
    if (!node) return
    node.style.setProperty('--fs-mx', tilt.current.x.toFixed(3))
    node.style.setProperty('--fs-my', tilt.current.y.toFixed(3))
  }, [])

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || reduced) return
    tilt.current.x = (event.clientX / window.innerWidth) * 2 - 1
    tilt.current.y = (event.clientY / window.innerHeight) * 2 - 1
    if (!tilt.current.raf) tilt.current.raf = requestAnimationFrame(applyTilt)
  }

  const onPointerLeave = () => {
    tilt.current.x = 0
    tilt.current.y = 0
    if (!tilt.current.raf) tilt.current.raf = requestAnimationFrame(applyTilt)
  }

  // Сброс id после отмены: в StrictMode эффект отрабатывает дважды, и ненулевой id
  // навсегда запретил бы новые кадры
  useEffect(() => {
    const current = tilt.current
    return () => {
      cancelAnimationFrame(current.raf)
      current.raf = 0
    }
  }, [])

  const onFrameDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
  }

  const onFrameUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = swipe.current
    swipe.current = null
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    // Палец отпустили — пауза подольше, чтобы автолистание не перебило свайп назад
    const hold = event.pointerType === 'mouse' ? AUTO_FLIP_MS : TOUCH_HOLD_MS
    if (Math.abs(dx) >= 36 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 'fwd' : 'back', hold)
    else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) go('fwd', hold)
  }

  const shown = state.to ?? state.cur
  const credit = frames[shown] ?? null
  const layerCount = count === 0 ? 1 : armed ? count : 1

  return (
    <section
      ref={rootRef}
      aria-labelledby="fashion-title"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-black px-6 pb-8 pt-[5.25rem] md:px-10 md:pb-10 md:pt-24 lg:px-20"
    >
      {/* Мастхед: одна моно-строка, как kicker у соседних страниц: метка с красной риской
          слева, география справа. Номера выпуска нет: он повторял порядковый индекс */}
      <div className="relative z-20">
        <div className="dir-kit-meta flex flex-wrap items-center justify-between gap-x-6 gap-y-1 font-mono uppercase tabular-nums text-white/70">
          <span className="dir-fashion-rise flex items-center gap-3" style={delay(0)}>
            <span aria-hidden="true" className="h-px w-6 bg-accent sm:w-8" />
            Savage Movie · Fashion
          </span>
          <span className="dir-fashion-rise text-right" style={delay(160)}>
            <span className="hidden md:inline">{SCENE.place}</span>
            <span className="md:hidden">СПб · Москва</span>
          </span>
        </div>
        <span
          aria-hidden="true"
          className="dir-fashion-rule mt-3 block h-px w-full bg-white/25"
          style={delay(120)}
        />
      </div>

      <div className="relative z-10 mt-6 grid flex-1 grid-cols-1 gap-x-10 [--fs-cover-w:min(42vw,calc((100svh_-_17rem)*0.75))] md:mt-8 md:grid-cols-[minmax(0,1fr)_var(--fs-cover-w)] md:items-end lg:[--fs-cover-w:min(34vw,calc((100svh_-_17rem)*0.75))]">
        {/* Заголовок наезжает на обложку: на телефоне — на нижний край кадра */}
        {/* В DOM заголовок и CTA идут раньше обложки: Tab и скринридер встречают их первыми */}
        <div className="relative z-20 order-2 -mt-10 md:order-none md:col-start-1 md:row-start-1 md:mt-0 md:flex md:flex-col md:justify-between md:self-stretch">
          {/* «В номере»: кавер-линии в один ряд слева сверху, ведут к форматам */}
          <nav aria-label="В номере" className="hidden w-full max-w-[44rem] pt-1 md:block">
            <p
              className="dir-fashion-rise dir-kit-meta mb-2 flex items-center gap-3 font-mono uppercase text-white/75"
              style={delay(980)}
            >
              <span aria-hidden="true" className="h-px w-6 bg-accent" />В номере
            </p>
            <ul className="grid grid-cols-3 gap-x-5">
              {FORMATS.map((format, i) => (
                <li
                  key={format.index}
                  className="dir-fashion-rise border-t border-white/30"
                  style={delay(1060 + i * 110, { '--fs-rise': '8px' } as CSSProperties)}
                >
                  <a
                    href={`#${SPREAD_ID}`}
                    onClick={event => {
                      event.preventDefault()
                      goToFormat(i)
                    }}
                    className="group block min-h-11 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                  >
                    <span className="dir-kit-meta block font-mono tabular-nums text-white/75 transition-colors duration-[var(--motion-state)] group-hover:text-accent">
                      Стр. {pad(3 + i * 2)}
                    </span>
                    <span className="mt-1 block font-stage text-[0.8rem] uppercase leading-[1.05] tracking-[-0.01em] text-white transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-1 lg:text-[0.88rem]">
                      {typo(format.title)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Сдвиг при прокрутке — у всего нижнего блока разом: строки не заезжают друг на друга */}
          <motion.div style={{ y: titleY }} className="dir-fashion-tilt-title">
            <div>
              {/* H1 — только название с дефисом: «Fashion-видео». Дефис — настоящий символ,
                  красный, на конце первой строки; на узком телефоне он скрыт визуально, но
                  остаётся в тексте (иначе «FASHION-» не помещается в колонку) */}
              <h1 id="fashion-title" className="pointer-events-none text-white">
                <span
                  className="dir-fashion-rise block font-stage text-[clamp(3.4rem,17.5vw,6.5rem)] uppercase leading-[0.82] tracking-[-0.04em] md:text-[clamp(4rem,13.2vw,10rem)] xl:text-[clamp(6rem,min(15.2vw,23svh),19rem)]"
                  style={delay(260, { '--fs-rise': '0.3em' } as CSSProperties)}
                >
                  Fashion<span className="dir-fashion-hy">-</span>
                </span>
                <span
                  className="dir-fashion-rise -mt-[0.02em] ml-[10vw] block font-brand-hero text-[clamp(3.4rem,17.5vw,6.5rem)] uppercase leading-[0.82] tracking-[-0.04em] md:ml-[8vw] md:text-[clamp(4rem,13.2vw,10rem)] xl:ml-[10vw] xl:text-[clamp(6rem,min(15.2vw,23svh),19rem)]"
                  style={delay(380, { '--fs-rise': '0.3em' } as CSSProperties)}
                >
                  видео
                </span>
              </h1>

              <p
                className="dir-fashion-rise mt-5 max-w-md text-lg font-light leading-snug text-white/90 md:mt-8 md:text-xl"
                style={delay(560)}
              >
                {typo(SCENE.lead)}
              </p>

              <p
                className="dir-fashion-rise dir-fashion-lede mt-5 max-w-lg text-sm leading-relaxed text-white/80 text-pretty md:text-base"
                style={delay(660)}
              >
                {typo(SCENE.text)}
              </p>

              <div
                className="dir-fashion-rise mt-6 flex flex-col gap-3 md:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2"
                style={delay(780)}
              >
                <DirectionButton
                  label={FASHION_PAGE.ctaLabel}
                  onClick={() => page.openBrief('hero')}
                  className="w-full sm:w-auto sm:min-w-[20rem] sm:shrink-0"
                />
                <a
                  href={`#${SPREAD_ID}`}
                  onClick={event => {
                    event.preventDefault()
                    goToFormat(0)
                  }}
                  className="group inline-flex min-h-11 items-center gap-2 px-1 text-base text-white/80 transition-colors duration-[var(--motion-state)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  <span className="border-b border-white/35 pb-0.5 transition-colors duration-[var(--motion-state)] group-hover:border-accent">
                    Смотреть разворот
                  </span>
                  <ArrowDown
                    aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-y-1"
                  />
                </a>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Обложка: кадр в паспарту, подпись-кредит, листание */}
        <div className="relative z-10 order-1 md:order-none md:col-start-2 md:row-start-1">
          <motion.div style={{ y: coverY }}>
            <div className="dir-fashion-tilt-cover relative">
              <div className="dir-fashion-mat dir-fashion-cover-mat relative w-full md:aspect-[3/4]">
                <div
                  className="dir-fashion-cover-in absolute inset-0 cursor-pointer touch-pan-y select-none overflow-hidden bg-[#0D0D0D]"
                  style={delay(120)}
                  onPointerDown={onFrameDown}
                  onPointerUp={onFrameUp}
                  onPointerCancel={() => {
                    swipe.current = null
                  }}
                  onPointerEnter={event => {
                    if (event.pointerType === 'mouse') setHeld(true)
                  }}
                  onPointerLeave={() => setHeld(false)}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    data-turning={state.to !== null ? '' : undefined}
                  >
                    {Array.from({ length: layerCount }, (_, i) => (
                      <div
                        key={i}
                        className="dir-fashion-layer"
                        data-state={i === state.to ? 'next' : i === state.cur ? 'cur' : 'idle'}
                        data-dir={state.dir}
                        onAnimationEnd={event => {
                          if (
                            i === state.to &&
                            event.target === event.currentTarget &&
                            event.animationName.startsWith('dir-fashion-turn')
                          ) {
                            settle()
                          }
                        }}
                      >
                        <Plate
                          frame={frames[i] ?? null}
                          word={plateWord(i)}
                          index={i}
                          sizes="(min-width: 1024px) 34vw, (min-width: 768px) 42vw, 100vw"
                          priority={i === 0}
                          quality={75}
                          className="h-full w-full"
                          imgClassName="dir-fashion-settle dir-fashion-lift"
                          objectPosition={coverCrop(frames[i])}
                        />
                        <span className="dir-fashion-edge" />
                      </div>
                    ))}
                  </div>
                  {/* Скримы только там, где на кадр ложится текст: на десктопе это полоса под
                      заголовком у левой кромки (остальной кадр чистый и светлый), на телефоне —
                      верх под кредитом со стрелками и низ под заголовком */}
                  <span
                    aria-hidden="true"
                    className="dir-fashion-title-scrim pointer-events-none absolute inset-0 z-[5] max-md:hidden"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[30%] bg-gradient-to-t from-black/70 to-transparent md:hidden"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-24 bg-gradient-to-b from-black/60 to-transparent md:hidden"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 z-[6] w-1/2 overflow-hidden"
                  >
                    <span
                      className="dir-fashion-light absolute inset-y-0 left-0 block w-full"
                      style={delay(800)}
                    />
                  </span>
                </div>
              </div>

              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-3 pt-2 md:static md:mt-6 md:px-0 md:pt-0">
                {/* Живая область: озвучивает смену кадра, только пока листают руками;
                    автолистание скринридеру не зачитывается */}
                <div
                  className="@container min-w-0 flex-1"
                  aria-live={held ? 'polite' : 'off'}
                  aria-atomic="true"
                >
                  <p
                    key={shown}
                    className="dir-fashion-rise dir-kit-meta truncate font-mono uppercase tabular-nums text-white/70"
                    style={{ '--fs-rise': '8px' } as CSSProperties}
                  >
                    {credit ? (
                      <>
                        <span className="text-white">{pad(shown + 1)}</span> / {pad(count)} —{' '}
                        {isCredited(credit) ? (
                          <>
                            {credit.client}
                            <span className="hidden @[21rem]:inline"> · {credit.title}</span>
                          </>
                        ) : (
                          'Обложка'
                        )}
                      </>
                    ) : (
                      <>Обложка</>
                    )}
                  </p>
                </div>
                {count > 1 ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <RoundButton
                      label="Предыдущий кадр обложки"
                      onClick={() => go('back')}
                      onFocus={event => setHeld(event.currentTarget.matches(':focus-visible'))}
                      onBlur={() => setHeld(false)}
                    >
                      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                    </RoundButton>
                    <RoundButton
                      label="Следующий кадр обложки"
                      onClick={() => go('fwd')}
                      onFocus={event => setHeld(event.currentTarget.matches(':focus-visible'))}
                      onBlur={() => setHeld(false)}
                    >
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </RoundButton>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────────── 02. Оглавление ───────────────────────────── */

function Contents({
  frame,
  pages,
  hasWorks,
}: {
  frame: SceneFrame | null
  pages: Pages
  hasWorks: boolean
}) {
  const rows = SCENE.contents.filter(row => row.key !== 'works' || hasWorks)
  const target = {
    spread: { page: pages.spread.from, id: SPREAD_ID },
    lookbook: { page: pages.lookbook.from, id: 'fashion-lookbook' },
    works: { page: pages.works?.from ?? 0, id: 'fashion-works' },
    process: { page: pages.process.from, id: 'fashion-process' },
    faq: { page: pages.faq.from, id: 'fashion-faq' },
  } as const

  return (
    <section
      id="fashion-contents"
      aria-labelledby="fashion-contents-title"
      className="dir-paper-section dir-fashion-sheet mt-[var(--dir-edge)] scroll-mt-[4.5rem] px-6 pb-12 pt-6 md:px-10 md:pb-16 lg:px-20"
    >
      <Dogear />
      <Folio
        tone="paper"
        left="Fashion-видео · оглавление"
        leftShort="Fashion-видео"
        right="Стр. 02"
      />

      <h2
        id="fashion-contents-title"
        data-reveal=""
        className="mt-8 font-stage text-[clamp(2.1rem,8.4vw,7.5rem)] uppercase leading-[0.9] tracking-[-0.05em] md:mt-8"
      >
        Содержание
      </h2>

      <div className="mt-8 grid gap-10 md:mt-10 lg:grid-cols-12 lg:gap-x-16">
        <div className="flex flex-col justify-between gap-10 lg:col-span-4">
          <p
            data-reveal=""
            className="max-w-sm text-lg font-normal leading-snug text-[color:var(--dir-paper-ink)] text-pretty md:text-xl"
          >
            {typo(SCENE.contentsLead)}
          </p>
          <figure data-reveal="" className="hidden w-1/2 lg:block">
            <div className="relative aspect-[3/4] bg-black">
              <Plate
                frame={frame}
                word={plateWord(5)}
                index={1}
                sizes="(min-width: 1024px) 16vw, 1px"
                className="absolute inset-0"
              />
            </div>
            <figcaption className="dir-kit-meta mt-3 flex justify-between gap-3 font-mono uppercase tabular-nums text-[color:var(--dir-paper-mute)]">
              <span>{isCredited(frame) ? `Кадр — ${frame.client}` : 'Вклейка'}</span>
              <span>02</span>
            </figcaption>
          </figure>
        </div>

        <ol className="lg:col-span-8">
          {rows.map((row, i) => {
            const { page, id } = target[row.key]
            return (
              <li
                key={row.key}
                data-reveal=""
                style={{ '--reveal-delay': `${i * 60}ms` } as CSSProperties}
                className="border-t border-[color:var(--dir-paper-line)] last:border-b"
              >
                <a
                  href={`#${id}`}
                  onClick={event => {
                    event.preventDefault()
                    if (row.key === 'spread') goToFormat(0)
                    else jumpTo(id)
                  }}
                  className="group relative grid grid-cols-[4.4rem_1fr_auto] items-center gap-x-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent md:grid-cols-[8rem_1fr_auto] md:py-4"
                >
                  <span className="font-stage text-[clamp(2.2rem,4.6vw,4.2rem)] leading-none tabular-nums tracking-[-0.05em] transition-colors duration-[var(--motion-state)] group-hover:text-accent">
                    {pad(page)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-stage text-[clamp(1.3rem,2.8vw,2.6rem)] uppercase leading-[0.95] tracking-[-0.02em] transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-2">
                      {typo(row.title)}
                    </span>
                    <span className="dir-kit-meta mt-2 block font-mono uppercase text-[color:var(--dir-paper-mute)]">
                      {typo(row.note)}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 text-black/60 transition-[transform,color] duration-[var(--motion-state)] ease-[var(--ease-out-expo)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-black md:h-8 md:w-8"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-[-1px] h-[3px] origin-left scale-x-0 bg-accent transition-transform duration-[var(--motion-cut)] ease-[var(--ease-out-expo)] group-hover:scale-x-100"
                  />
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/* ─────────────────────────────── 03. Разворот ─────────────────────────────── */

const FLIP = 0.05

/** Лист разворота: входит сгибом справа налево от прогресса прокрутки */
function FlipLayer({
  progress,
  at,
  reduced,
  className,
  children,
}: {
  progress: MotionValue<number>
  at: number
  reduced: boolean
  className?: string
  children: React.ReactNode
}) {
  const smooth = useTransform(progress, [at - FLIP, at + FLIP], [100, 0])
  const stepped = useTransform(progress, (value): number => (value >= at ? 0 : 100))
  const source = reduced ? stepped : smooth
  const clip = useMotionTemplate`inset(0 0 0 ${source}%)`
  const foldX = useTransform(source, value => `${value}%`)
  const foldOpacity = useTransform(source, [0, 3, 97, 100], [0, 1, 1, 0])

  return (
    <motion.div style={{ clipPath: clip }} className={cn('absolute inset-0', className)}>
      {children}
      <motion.span
        aria-hidden="true"
        style={{ x: foldX, opacity: foldOpacity }}
        className="pointer-events-none absolute inset-0 border-l border-white/55 bg-gradient-to-r from-black/60 to-transparent to-[18%]"
      />
    </motion.div>
  )
}

function ProgressSegment({
  progress,
  from,
  to,
}: {
  progress: MotionValue<number>
  from: number
  to: number
}) {
  const scaleX = useTransform(progress, [from, to], [0, 1])
  return (
    <span className="relative block h-px flex-1 bg-white/20">
      <motion.span
        style={{ scaleX }}
        className="absolute left-0 top-[-1px] block h-[3px] w-full origin-left bg-accent"
      />
    </span>
  )
}

/**
 * Цифра формата: колонка 01/02/03 едет ступенями вслед за сгибом листа.
 * Это украшение (aria-hidden), поэтому цифра лежит в CSS (data-n → ::before):
 * вид тот же, а аудит контраста не принимает декор за текст.
 */
function Numeral({ y, outline }: { y: MotionValue<string>; outline?: boolean }) {
  return (
    <div
      aria-hidden="true"
      data-fs-num={outline ? undefined : ''}
      className={cn(
        'dir-fashion-num pointer-events-none absolute text-white bottom-[-0.02em] left-[5vw] font-stage text-[clamp(7rem,30vw,9rem)] leading-none md:bottom-[-0.07em] md:left-0 md:-translate-x-[8%] md:text-[clamp(9rem,min(24vw,56svh),30rem)]',
        outline ? 'dir-fashion-num-line z-30' : 'z-0'
      )}
    >
      <div className="h-[0.8em] overflow-hidden">
        <motion.div style={{ y }}>
          {FORMATS.map(format => (
            <span
              key={format.index}
              data-n={format.index}
              className="block h-[0.8em] leading-[0.8] before:content-[attr(data-n)]"
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}

function Spread({ frames }: { frames: SceneFrame[] }) {
  const n = FORMATS.length
  const reduced = useReduced()
  const trackRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', value => {
    setActive(Math.min(n - 1, Math.max(0, Math.floor(value * n))))
  })

  // Колонка цифр едет ступенями и успевает за сгибом листа
  const stops = [0]
  const offsets = ['0%']
  for (let k = 1; k < n; k += 1) {
    stops.push(k / n - FLIP, k / n + FLIP)
    offsets.push(`${(-(k - 1) * 100) / n}%`, `${(-k * 100) / n}%`)
  }
  stops.push(1)
  offsets.push(`${(-(n - 1) * 100) / n}%`)
  const numeralSmooth = useTransform(scrollYProgress, stops, offsets)
  // Без движения цифра меняется ступенью вместе с кадром, а не плывёт отдельно от него
  const numeralStep = useTransform(
    scrollYProgress,
    value => `${(-Math.min(n - 1, Math.max(0, Math.floor(value * n))) * 100) / n}%`
  )
  const numeralY = reduced ? numeralStep : numeralSmooth

  const main = FORMATS.map((_, k) => pick(frames, 6 + k))
  const detail = FORMATS.map((_, k) => pick(frames, 9 + k))
  const credit = main[active]

  return (
    <section
      id={SPREAD_ID}
      ref={trackRef}
      aria-labelledby="fashion-spread-title"
      className="relative bg-black"
      style={{ height: `${n * 100 + 40}svh` }}
    >
      <div className="sticky top-0 grid h-[100svh] grid-rows-[auto_1fr] overflow-hidden md:grid-cols-2 md:grid-rows-1">
        {/* Правая страница: кадры. На телефоне — над текстом */}
        <div className="relative order-1 flex items-start px-6 pt-20 md:order-2 md:items-center md:px-0 md:pt-0">
          {/* Цифра формата, сплошная: лежит под отпечатком, кадр перекрывает её, как в вёрстке */}
          <Numeral y={numeralY} />
          <div className="relative md:ml-[clamp(2.5rem,7vw,7rem)] md:w-[min(31vw,calc((100svh-13rem)*0.8))]">
            <div className="dir-fashion-mat dir-fashion-spread-mat relative aspect-[4/5] md:h-auto md:w-full">
              <div className="absolute inset-0 overflow-hidden bg-[#0D0D0D]">
                {main.map((frame, k) => {
                  const plate = (
                    <Plate
                      frame={frame}
                      word={plateWord(k)}
                      index={k}
                      sizes="(min-width: 768px) 31vw, 64vw"
                      className="h-full w-full"
                    />
                  )
                  return k === 0 ? (
                    <div key={k} className="absolute inset-0">
                      {plate}
                    </div>
                  ) : (
                    <FlipLayer key={k} progress={scrollYProgress} at={k / n} reduced={reduced}>
                      {plate}
                    </FlipLayer>
                  )
                })}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/75 to-transparent"
                />
              </div>

              {/* Малый кадр из другой съёмки — поверх угла большого, как вклеенный отпечаток */}
              <div className="dir-fashion-mat absolute bottom-[-7%] right-[-48%] aspect-[3/4] w-[56%] md:right-[-16%] md:w-[40%]">
                <div className="absolute inset-0 overflow-hidden bg-[#0D0D0D]">
                  {detail.map((frame, k) => {
                    const plate = (
                      <Plate
                        frame={frame}
                        word={plateWord(k + 3)}
                        index={k + 3}
                        sizes="(min-width: 768px) 13vw, 33vw"
                        className="h-full w-full"
                      />
                    )
                    return k === 0 ? (
                      <div key={k} className="absolute inset-0">
                        {plate}
                      </div>
                    ) : (
                      <FlipLayer
                        key={k}
                        progress={scrollYProgress}
                        at={k / n + 0.014}
                        reduced={reduced}
                      >
                        {plate}
                      </FlipLayer>
                    )
                  })}
                </div>
              </div>
            </div>

            <p
              key={active}
              className="dir-fashion-rise dir-kit-meta hidden items-center justify-between gap-4 font-mono uppercase tabular-nums text-white/70 md:absolute md:inset-x-0 md:bottom-full md:mb-8 md:flex"
              style={{ '--fs-rise': '8px' } as CSSProperties}
            >
              <span className="min-w-0 truncate">
                {isCredited(credit) ? (
                  <>
                    Кадр — {credit.client}
                    <span className="hidden xl:inline"> · {credit.title}</span>
                  </>
                ) : (
                  FORMATS[active]?.tag
                )}
              </span>
              <span className="shrink-0 text-white">
                {pad(active + 1)} / {pad(n)}
              </span>
            </p>
          </div>

          {/* Та же цифра контуром поверх кадра: на фото читается, не меняя цвета кадра */}
          <Numeral y={numeralY} outline />
        </div>

        {/* Левая страница: оглавление форматов, активный раскрыт. Все размеры от высоты
            окна, чтобы три формата и прогресс помещались и на ноутбуке 1366×657 */}
        <div className="relative z-10 order-2 flex min-h-0 flex-col bg-black px-6 pb-[5rem] pt-5 md:order-1 md:px-10 md:pb-[clamp(3.25rem,8svh,5rem)] md:pt-[clamp(4.75rem,11svh,6rem)] lg:px-16">
          <Folio left="Разворот" right={`Стр. ${spreadPages(active)}`} />
          <h2
            id="fashion-spread-title"
            className="mt-4 font-stage text-[0.95rem] uppercase leading-[1] tracking-[-0.01em] text-white md:mt-[clamp(0.75rem,3.2svh,2rem)] md:text-[clamp(1.6rem,min(3vw,5.2svh),3.6rem)] md:leading-[0.92] md:tracking-[-0.02em] md:text-balance"
          >
            {setTitle('Три формата fashion-видео')}
          </h2>

          <ol className="mt-3 flex flex-col md:mt-[clamp(0.75rem,3.2svh,2rem)]">
            {FORMATS.map((format, i) => (
              <li
                key={format.index}
                data-active={active === i}
                className="group relative border-t border-white/15 last:border-b"
              >
                <div className="grid grid-cols-[2.25rem_1fr] gap-x-3 py-2.5 md:grid-cols-[3.5rem_1fr] md:py-[clamp(0.75rem,2.2svh,1.75rem)]">
                  <span className="dir-kit-meta pt-1 font-mono tabular-nums text-white/55 transition-colors duration-[var(--motion-state)] group-data-[active=true]:text-accent md:pt-1.5">
                    {format.index}
                  </span>
                  <div>
                    <h3 className="font-stage text-[clamp(1.1rem,min(2.1vw,3.6svh),2.6rem)] uppercase leading-[0.98] tracking-[-0.02em] text-white/45 transition-colors duration-[var(--motion-state)] group-hover:text-white/80 group-data-[active=true]:text-white group-data-[active=true]:group-hover:text-white">
                      <button
                        type="button"
                        onClick={() => goToFormat(i)}
                        onFocus={event => {
                          // С клавиатуры фокус раскрывает строку: текст и кадр всегда совпадают с ней
                          if (active !== i && event.currentTarget.matches(':focus-visible')) {
                            goToFormat(i)
                          }
                        }}
                        aria-current={active === i ? 'step' : undefined}
                        className="text-left uppercase after:absolute after:-inset-x-3 after:inset-y-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent"
                      >
                        {/* Сдвиг на внутреннем слое: transform на h3 сделал бы его опорным
                            блоком для кольца фокуса, и оно сжалось бы при наведении */}
                        <span className="inline-block transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                          {typo(format.title)}
                        </span>
                      </button>
                    </h3>
                    <p className="dir-kit-meta mt-1 hidden font-mono uppercase text-white/55 group-data-[active=true]:block md:block">
                      {format.tag}
                    </p>
                    <div className="dir-fashion-fmt grid grid-rows-[0fr] transition-[grid-template-rows] duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-data-[active=true]:grid-rows-[1fr]">
                      <p className="min-h-0 overflow-hidden pt-2 text-[0.8rem] leading-relaxed text-white/55 text-pretty transition-colors duration-[var(--motion-state)] group-data-[active=true]:text-white/85 md:max-w-[min(30rem,calc(50vw-9.5rem))] md:pt-3 md:text-[clamp(1rem,1.1vw,1.2rem)] lg:max-w-[min(30rem,calc(50vw-12rem))]">
                        {typo(format.text)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div
            aria-hidden="true"
            data-fs-progress=""
            className="mt-auto flex items-center gap-3 pt-4 md:absolute md:bottom-[clamp(1.25rem,3.4svh,2rem)] md:left-10 md:mt-0 md:w-[min(22rem,calc(50vw-5rem))] md:pt-0 lg:left-16"
          >
            {FORMATS.map((format, i) => (
              <ProgressSegment
                key={format.index}
                progress={scrollYProgress}
                from={i / n}
                to={(i + 1) / n}
              />
            ))}
          </div>
        </div>

        {/* Корешок: сгиб разворота по центру */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-[9vw] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/[0.045] to-transparent md:block"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-px bg-white/15 md:block"
        />
      </div>
    </section>
  )
}

/* ─────────────────────────────── 04. Лукбук ─────────────────────────────── */

const SHAPES = [
  { width: 'w-[68vw] md:w-[22rem] lg:w-[26rem]', ratio: 'aspect-[3/4]', drop: 'mt-0' },
  { width: 'w-[56vw] md:w-[17rem] lg:w-[19rem]', ratio: 'aspect-[4/5]', drop: 'mt-10 md:mt-28' },
  { width: 'w-[68vw] md:w-[26rem] lg:w-[31rem]', ratio: 'aspect-[5/6]', drop: 'mt-4 md:mt-8' },
  { width: 'w-[56vw] md:w-[18rem] lg:w-[21rem]', ratio: 'aspect-[2/3]', drop: 'mt-12 md:mt-40' },
] as const

function Lookbook({ frames, pages }: { frames: SceneFrame[]; pages: Pages }) {
  const page = useDirectionPage()
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)
  const chipRef = useRef<HTMLDivElement>(null)
  const scrollRaf = useRef(0)
  const chip = useRef({ x: 0, y: 0, raf: 0 })
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: 0 })
  const suppressClick = useRef(false)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [current, setCurrent] = useState(0)
  const [chipLabel, setChipLabel] = useState('Тяни')

  // Со сдвигом: лента начинается не с первых кадров работ, их уже показывают карточки ниже
  const offset = frames.length > 8 ? 4 : 0
  const prints: { frame: SceneFrame | null; word: string }[] =
    frames.length > 0
      ? Array.from({ length: Math.min(frames.length, 12) }, (_, i) => ({
          frame: frames[(i + offset) % frames.length] ?? null,
          word: '',
        }))
      : SCENE.plates.map(word => ({ frame: null, word }))
  const total = prints.length
  // В Tab попадает первый кадр каждой работы: остальные достаёт мышь, касание и стрелки ленты
  const isFirstOfWork = prints.map(
    (print, i) =>
      print.frame !== null && prints.findIndex(p => p.frame?.slug === print.frame?.slug) === i
  )

  const measure = useCallback(() => {
    scrollRaf.current = 0
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return
    const max = track.scrollWidth - track.clientWidth
    const progress = max > 0 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0
    const ratio = track.scrollWidth > 0 ? track.clientWidth / track.scrollWidth : 1
    thumb.style.width = `${Math.min(1, ratio) * 100}%`
    thumb.style.transform = `translateX(${progress * (1 / Math.min(1, ratio) - 1) * 100}%)`
    setAtStart(progress <= 0.01)
    setAtEnd(progress >= 0.99)
    setCurrent(Math.round(progress * (total - 1)))
  }, [total])

  const schedule = useCallback(() => {
    if (!scrollRaf.current) scrollRaf.current = requestAnimationFrame(measure)
  }, [measure])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    schedule()
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => schedule())
    observer?.observe(track)
    return () => {
      observer?.disconnect()
      cancelAnimationFrame(scrollRaf.current)
      scrollRaf.current = 0
    }
  }, [measure, schedule])

  useEffect(() => {
    const state = chip.current
    return () => {
      cancelAnimationFrame(state.raf)
      state.raf = 0
    }
  }, [])

  const step = useCallback((dir: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const item = track.querySelector<HTMLElement>('[data-print]')
    const gap = 24
    track.scrollBy({
      left: dir * ((item?.offsetWidth ?? track.clientWidth * 0.6) + gap),
      behavior: reducedNow() ? 'auto' : 'smooth',
    })
  }, [])

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      step(-1)
    }
  }

  // Перетаскивание мышью: на touch и трекпаде лентой управляет сам браузер
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track || event.pointerType !== 'mouse' || event.button !== 0) return
    drag.current = { active: true, startX: event.clientX, startLeft: track.scrollLeft, moved: 0 }
    track.dataset.dragging = 'true'

    const move = (e: PointerEvent) => {
      const dx = e.clientX - drag.current.startX
      drag.current.moved = Math.max(drag.current.moved, Math.abs(dx))
      track.scrollLeft = drag.current.startLeft - dx
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      drag.current.active = false
      suppressClick.current = drag.current.moved > 6
      delete track.dataset.dragging
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return
    const track = trackRef.current
    const node = chipRef.current
    if (!track || !node) return
    track.dataset.cursor = 'on'
    node.dataset.on = 'true'
    chip.current.x = event.clientX
    chip.current.y = event.clientY
    if (!chip.current.raf) {
      chip.current.raf = requestAnimationFrame(() => {
        chip.current.raf = 0
        node.style.transform = `translate3d(${chip.current.x}px, ${chip.current.y}px, 0)`
      })
    }
    setChipLabel((event.target as HTMLElement).closest('[data-print-link]') ? 'Кейс' : 'Тяни')
  }

  const onPointerLeave = () => {
    if (chipRef.current) chipRef.current.dataset.on = 'false'
    if (trackRef.current) delete trackRef.current.dataset.cursor
  }

  return (
    <section
      id="fashion-lookbook"
      aria-labelledby="fashion-lookbook-title"
      className="relative overflow-hidden bg-black pb-16 pt-20 md:pb-20 md:pt-28"
    >
      <div className="px-6 md:px-10 lg:px-20">
        <Folio left="Лукбук" right={`Стр. ${pages.lookbook.label}`} />
        <div className="mt-10 grid gap-x-10 gap-y-8 md:mt-14 lg:grid-cols-12 lg:items-end">
          {/* Интерлиньяж 0,96: запятая после «Ткань» и «Свет» не задевает строку ниже */}
          <h2
            id="fashion-lookbook-title"
            data-reveal=""
            className="max-w-[11ch] font-brand-hero text-[clamp(2.9rem,9.4vw,10rem)] uppercase leading-[0.96] tracking-tighter text-white text-balance lg:col-span-9"
          >
            {setTitle(SCENE.lookbook.title)}
          </h2>
          <div className="flex flex-col items-start gap-5 lg:col-span-3 lg:items-end">
            {/* Счётчик кадров ленты: заменил список клиентов, который повторял подписи под кадрами */}
            <p aria-hidden="true" className="flex items-end gap-3 font-mono uppercase tabular-nums">
              <span className="dir-kit-meta pb-2 text-white/60">{SCENE.lookbook.counter}</span>
              <span
                key={current}
                className="dir-fashion-rise font-stage text-[clamp(2.6rem,4.4vw,4.2rem)] leading-[0.9] tracking-[-0.04em] text-white"
                style={{ '--fs-rise': '10px' } as CSSProperties}
              >
                {pad(current + 1)}
              </span>
              <span className="dir-kit-meta pb-2 text-white/60">/ {pad(total)}</span>
            </p>
            <div className="hidden items-center gap-2 md:flex">
              <span className="dir-kit-meta mr-3 font-mono uppercase text-white/60">
                {SCENE.lookbook.hint}
              </span>
              <RoundButton label="Назад по ленте" onClick={() => step(-1)} disabled={atStart}>
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              </RoundButton>
              <RoundButton label="Вперёд по ленте" onClick={() => step(1)} disabled={atEnd}>
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </RoundButton>
            </div>
          </div>
        </div>

        {/* На touch стрелок нет: подсказка-жест показывает, куда вести палец; после первого
            сдвига ленты гаснет */}
        <p
          aria-hidden="true"
          data-at-start={atStart}
          className="dir-fashion-swipe dir-kit-meta mt-8 font-mono uppercase text-white/70"
        >
          <span className="dir-fashion-swipe-line" />
          {SCENE.lookbook.touchHint}
          <ArrowRight className="dir-fashion-swipe-arrow h-4 w-4 text-accent" />
        </p>
      </div>

      <div
        className="relative mt-12 md:mt-16"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <div
          ref={trackRef}
          role="region"
          aria-label="Лукбук: кадры, листайте стрелками"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onScroll={schedule}
          onPointerDown={onPointerDown}
          onDragStart={event => event.preventDefault()}
          onClickCapture={event => {
            if (!suppressClick.current) return
            suppressClick.current = false
            event.preventDefault()
            event.stopPropagation()
          }}
          className="dir-fashion-track overflow-x-auto overflow-y-hidden pb-2 [scroll-padding-inline:1.5rem] focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent md:[scroll-padding-inline:2.5rem] lg:[scroll-padding-inline:5rem]"
        >
          <ul className="flex w-max items-start gap-6 px-6 md:px-10 lg:px-20">
            {prints.map((print, i) => {
              const shape = SHAPES[i % SHAPES.length] ?? SHAPES[0]
              const frame = print.frame
              const body = (
                <>
                  <span className="relative block bg-[var(--fs-paper)] p-1.5 transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:-translate-y-2 group-focus-visible:-translate-y-2 md:p-1.5">
                    <span className={cn('relative block overflow-hidden bg-black', shape.ratio)}>
                      <Plate
                        frame={frame}
                        word={print.word}
                        index={i}
                        sizes="(min-width: 1024px) 31rem, (min-width: 768px) 26rem, 68vw"
                        className="absolute inset-0"
                        imgClassName="transition-transform duration-[var(--motion-cut)] ease-[var(--ease-out-expo)] group-hover:scale-[1.05] group-focus-visible:scale-[1.05]"
                      />
                    </span>
                  </span>
                  <span className="dir-kit-meta mt-3 flex items-baseline justify-between gap-3 font-mono uppercase tabular-nums text-white/70">
                    <span className="text-white">{pad(i + 1)}</span>
                    <span className="min-w-0 truncate text-right transition-colors duration-[var(--motion-state)] group-hover:text-white group-focus-visible:text-white">
                      {frame ? `${frame.client} · ${frame.title}` : print.word}
                    </span>
                  </span>
                </>
              )
              return (
                <li
                  key={frame?.key ?? print.word}
                  data-print=""
                  className={cn('dir-fashion-item shrink-0', shape.width, shape.drop)}
                >
                  {frame ? (
                    <Link
                      href={`/projects/${frame.slug}`}
                      prefetch={false}
                      draggable={false}
                      data-print-link=""
                      tabIndex={isFirstOfWork[i] ? undefined : -1}
                      onClick={() => page.openCase(frame.slug)}
                      className="group block select-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="group block select-none">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div ref={chipRef} aria-hidden="true" data-on="false" className="dir-fashion-chip">
          <span className="dir-kit-meta font-mono uppercase">{chipLabel}</span>
        </div>
      </div>

      <div aria-hidden="true" className="mt-8 px-6 md:px-10 lg:px-20">
        <span className="relative block h-px w-full bg-white/20">
          <span
            ref={thumbRef}
            className="absolute left-0 top-[-1px] block h-[3px] bg-accent"
            style={{ width: '25%' }}
          />
        </span>
      </div>
    </section>
  )
}

/* ─────────────────────────────── 05. Работы ─────────────────────────────── */

/*
 * Пары в 12 колонках без пустых полос: большой кадр + малый, сдвинутый вниз на
 * 3,5rem (низы подписей почти на одной линии), во втором ряду зеркально. Раньше
 * шаг сдвига доходил до 11rem, и рядом с картой оставалась пустая половина полотна.
 */
const WORK_SLOTS = [
  { col: 'lg:col-span-6 lg:col-start-1', ratio: 'aspect-[4/5]', drop: '' },
  { col: 'lg:col-span-5 lg:col-start-8', ratio: 'aspect-[3/4]', drop: 'lg:mt-14' },
  { col: 'lg:col-span-5 lg:col-start-1', ratio: 'aspect-[3/4]', drop: 'lg:mt-14' },
  { col: 'lg:col-span-6 lg:col-start-7', ratio: 'aspect-[4/5]', drop: '' },
] as const

function Works({ works, pages }: { works: DirectionPageWork[]; pages: Pages }) {
  const page = useDirectionPage()
  const listRef = useRef<HTMLUListElement>(null)

  // На touch наведения нет: второй кадр раскрывается, когда карточка в середине экрана
  useEffect(() => {
    const list = listRef.current
    if (!list || typeof IntersectionObserver === 'undefined') return
    if (!window.matchMedia('(hover: none)').matches) return
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          ;(entry.target as HTMLElement).dataset.seen = entry.isIntersecting ? 'true' : 'false'
        }
      },
      { rootMargin: '-35% 0px -35% 0px' }
    )
    list.querySelectorAll('[data-work]').forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [works.length])

  return (
    <section
      id="fashion-works"
      aria-labelledby="fashion-works-title"
      className="dir-paper-section dir-fashion-sheet scroll-mt-[4.5rem] px-6 pb-4 pt-6 md:px-10 lg:px-20"
    >
      <Dogear />
      <Folio tone="paper" left="Работы" right={`Стр. ${pages.works?.label ?? ''}`} />

      <div className="mt-10 flex flex-wrap items-end justify-between gap-x-10 gap-y-5 md:mt-14">
        <h2
          id="fashion-works-title"
          data-reveal=""
          className="max-w-[13ch] font-stage text-[clamp(2.3rem,6.6vw,6.8rem)] uppercase leading-[0.88] tracking-[-0.04em] text-balance"
        >
          {setTitle(SCENE.works.title)}
        </h2>
        <p className="dir-kit-meta max-w-xs font-mono uppercase leading-relaxed text-[color:var(--dir-paper-mute)] md:text-right">
          {SCENE.works.note} · {pad(works.length)}
        </p>
      </div>

      <ul
        ref={listRef}
        className="mt-10 grid gap-x-6 gap-y-12 md:mt-14 md:grid-cols-2 md:gap-y-14 lg:grid-cols-12 lg:gap-y-16"
      >
        {works.map((work, i) => {
          const slot = WORK_SLOTS[i % WORK_SLOTS.length] ?? WORK_SLOTS[0]
          const first = work.stills[0] ?? work.posterUrl
          const second = work.stills[1] ?? null
          const excerpt = firstSentence(work.description)
          return (
            <li
              key={work.slug}
              data-work=""
              className={cn(
                'dir-fashion-work',
                slot.col,
                i % 2 === 1 && 'md:mt-10 lg:mt-0',
                slot.drop
              )}
            >
              <Link
                href={`/projects/${work.slug}`}
                prefetch={false}
                onClick={() => page.openCase(work.slug)}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent"
              >
                <span
                  className={cn(
                    'relative block overflow-hidden bg-black lg:max-h-[82svh]',
                    slot.ratio
                  )}
                >
                  {first ? (
                    <Still
                      src={first}
                      alt=""
                      sizes="(min-width: 1024px) 46vw, (min-width: 768px) 50vw, 100vw"
                      quality={65}
                      objectPosition="center 28%"
                      className="absolute inset-0"
                      imgClassName="transition-transform duration-[var(--motion-cut)] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                    />
                  ) : (
                    <Plate
                      frame={null}
                      word={work.client}
                      index={i}
                      sizes="1px"
                      className="absolute inset-0"
                    />
                  )}
                  {second ? (
                    <span aria-hidden="true" className="dir-fashion-second absolute inset-0">
                      <Still
                        src={second}
                        alt=""
                        sizes="(min-width: 1024px) 46vw, (min-width: 768px) 50vw, 100vw"
                        quality={65}
                        objectPosition="center 28%"
                        className="absolute inset-0"
                      />
                      <span className="absolute inset-y-0 left-0 w-px bg-white/60" />
                    </span>
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white text-black transition-[background-color,color,transform] duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:scale-110 group-hover:bg-accent group-hover:text-white group-focus-visible:scale-110 group-focus-visible:bg-accent group-focus-visible:text-white"
                  >
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </span>
                <span className="dir-kit-meta mt-4 flex items-baseline justify-between gap-4 font-mono uppercase tabular-nums text-[color:var(--dir-paper-mute)]">
                  <span>№ {pad(i + 1)}</span>
                  <span>{work.year ?? ''}</span>
                </span>
                <span className="mt-2 block font-stage text-[clamp(1.9rem,3.8vw,3.8rem)] uppercase leading-[0.92] tracking-[-0.03em] transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-1.5">
                  {work.client}
                </span>
                <span className="mt-2 block text-sm text-[color:var(--dir-paper-ink)] md:text-base">
                  {typo(work.title)}
                </span>
                {excerpt ? (
                  <span className="mt-2 block max-w-md text-sm leading-relaxed text-[color:var(--dir-paper-mute)] text-pretty">
                    {typo(excerpt)}
                  </span>
                ) : null}
              </Link>
            </li>
          )
        })}
        {works.length % 2 === 1 ? (
          <li
            aria-hidden="true"
            className={cn(
              'dir-fashion-pull hidden md:flex',
              WORK_SLOTS[works.length % WORK_SLOTS.length]?.col,
              works.length % 2 === 1 && 'md:mt-10 lg:mt-0'
            )}
          >
            <span className="dir-kit-meta flex items-center gap-3 font-mono uppercase text-[color:var(--dir-paper-mute)]">
              <span className="h-px w-8 bg-accent" />
              {SCENE.works.pullLabel}
            </span>
            <span className="mt-6 block font-brand-hero text-[clamp(2rem,4vw,4.2rem)] uppercase leading-[1] tracking-tighter">
              {typo(SCENE.works.pull)}
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  )
}

/* ─────────────────── CTA после работ: отрезной купон вклейки ─────────────────── */

/*
 * Единственный промежуточный призыв страницы: после работ, на том же листе бумаги.
 * Отдельного блока «Начнём с брифа» после процесса больше нет — он был третьим
 * призывом за два экрана до финального. Пока купон на экране, плавающая кнопка
 * спрятана (data-sticky-hide): рядом две одинаковые кнопки не нужны.
 */
function ProofCta() {
  const page = useDirectionPage()
  const copy = SCENE.proofCta
  return (
    <section
      data-sticky-hide=""
      aria-label={FASHION_PAGE.ctaLabel}
      className="dir-paper-section dir-fashion-sheet px-6 pb-16 pt-10 md:px-10 md:pb-24 lg:px-20"
    >
      <Dogear />
      <div className="relative border border-dashed border-black/50 px-5 py-9 md:px-10 md:py-14">
        <span
          aria-hidden="true"
          className="absolute -top-3 left-5 flex items-center gap-2 bg-[var(--dir-paper)] px-2 text-[color:var(--dir-paper-mute)] md:left-9"
        >
          <Scissors className="h-4 w-4" />
          <span className="dir-kit-meta font-mono uppercase">{copy.kicker}</span>
        </span>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-x-10">
          {/* Запас по высоте строки: точки над «Ё» не задевают строку выше */}
          <p className="font-brand-hero text-[clamp(2.1rem,4.9vw,5.2rem)] uppercase leading-[1.02] tracking-tighter lg:col-span-8">
            <span className="block">{typo(copy.lead)}</span>
            <span className="block text-[color:var(--dir-paper-mute)] text-balance">
              {typo(copy.tail)}
            </span>
          </p>
          <div className="flex flex-col items-start gap-4 lg:col-span-4 lg:items-end">
            <DirectionButton
              label={FASHION_PAGE.ctaLabel}
              onClick={() => page.openBrief('proof')}
              className="w-full sm:w-auto sm:min-w-[20rem]"
            />
            <p className="dir-kit-meta max-w-[22rem] font-mono uppercase leading-relaxed text-[color:var(--dir-paper-mute)] lg:text-right">
              {typo(copy.note)}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ───────────────────────── 06. Процесс: выходные данные ───────────────────────── */

/** Кадров в секунде на таймкоде процесса: обычная частота видео, не данные о работе студии */
const TC_FPS = 25

/** Таймкод по прогрессу линейки: каждый из шагов — одна секунда, 00:00:00:00 → 00:00:05:00 */
function timecode(progress: number, steps: number): string {
  const frames = Math.round(Math.min(1, Math.max(0, progress)) * steps * TC_FPS)
  return `00:00:${pad(Math.floor(frames / TC_FPS))}:${pad(frames % TC_FPS)}`
}

function Process({ pages }: { pages: Pages }) {
  const reduced = useReduced()
  const steps = FASHION_PAGE.process
  const trackRef = useRef<HTMLDivElement>(null)
  const tcRef = useRef<HTMLSpanElement>(null)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start 80%', 'end 45%'] })
  const headX = useTransform(scrollYProgress, [0, 1], [reduced ? '100%' : '0%', '100%'])
  const fillY = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 0, 1])
  // Сколько шагов уже пройдено головкой: номер шага загорается, когда она до него дошла
  const [reached, setReached] = useState(1)

  useMotionValueEvent(scrollYProgress, 'change', value => {
    setReached(Math.min(steps.length, Math.floor(value * steps.length + 0.02) + 1))
    if (tcRef.current) tcRef.current.textContent = timecode(reduced ? 1 : value, steps.length)
  })

  const shown = reduced ? steps.length : reached

  return (
    <section
      id="fashion-process"
      aria-labelledby="fashion-process-title"
      className="relative bg-[#0D0D0D] px-6 pb-16 pt-20 md:px-10 md:pb-24 md:pt-28 lg:px-20"
    >
      <Folio left="Процесс" right={`Стр. ${pages.process.label}`} />

      <div className="mt-10 grid gap-6 md:mt-14 lg:grid-cols-12 lg:items-end">
        <h2
          id="fashion-process-title"
          data-reveal=""
          className="font-stage text-[clamp(2.3rem,5.6vw,5.8rem)] uppercase leading-[1] tracking-[-0.03em] text-white text-balance lg:col-span-8"
        >
          {'От\u00A0брифа до\u00A0версий'}
        </h2>
        <div className="lg:col-span-3 lg:col-start-10">
          <p className="text-base leading-relaxed text-white/75 text-pretty md:text-lg">
            {typo('Пять шагов от идеи до файлов под каждую площадку.')}
          </p>
          {/* Таймкод едет вместе с головкой линейки; без движения показывает конец */}
          <p
            aria-hidden="true"
            className="dir-kit-meta mt-4 flex items-center gap-3 font-mono uppercase tabular-nums text-white/70"
          >
            <span className="h-1.5 w-1.5 bg-accent" />
            <span ref={tcRef}>{timecode(reduced ? 1 : 0, steps.length)}</span>
          </p>
        </div>
      </div>

      <div ref={trackRef} className="relative mt-14 md:mt-20">
        {/* Линейка таймкода: красная головка идёт по шагам вместе с прокруткой */}
        <div aria-hidden="true" className="relative hidden overflow-x-clip xl:block">
          <div className="dir-fashion-ruler" />
          <motion.div style={{ x: headX }} className="absolute inset-y-0 left-0 w-full">
            <span className="absolute bottom-0 left-0 block h-[calc(100%+0.75rem)] w-px bg-accent">
              <span className="absolute left-[-3px] top-0 block h-[7px] w-[7px] bg-accent" />
            </span>
          </motion.div>
        </div>

        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 w-px bg-white/15 xl:hidden"
        />
        <motion.span
          aria-hidden="true"
          style={{ scaleY: fillY }}
          className="absolute bottom-0 left-0 top-0 w-px origin-top bg-accent xl:hidden"
        />

        {/* Пятая колонка на xl уходит под плавающую кнопку: пока шаги на экране, кнопка скрыта */}
        <ol
          data-sticky-hide="desktop"
          className="grid gap-y-12 pl-6 md:pl-8 xl:grid-cols-5 xl:gap-x-6 xl:gap-y-0 xl:pl-0"
        >
          {steps.map((step, i) => (
            <li
              key={step.number}
              data-reveal=""
              data-state={shown === i + 1 ? 'current' : shown > i + 1 ? 'done' : 'idle'}
              style={{ '--fs-step': i } as CSSProperties}
              className="md:grid md:grid-cols-[8.5rem_1fr] md:gap-x-6 xl:block xl:border-l xl:border-white/15 xl:pl-5 xl:pt-[calc(var(--fs-step)*3.4rem)]"
            >
              <span
                aria-hidden="true"
                className="dir-fashion-step-num block font-stage text-[clamp(3.6rem,7vw,6.4rem)] leading-[0.85] tabular-nums tracking-[-0.05em] xl:text-[clamp(3.4rem,5.4vw,5.6rem)]"
              >
                {step.number}
              </span>
              <div className="mt-2 md:mt-0 xl:mt-4">
                <p className="dir-kit-meta font-mono uppercase tabular-nums text-white/70">
                  <span className="xl:block">Шаг {step.number}</span>
                  <span className="xl:hidden"> · </span>
                  {/* На xl в колонке две строки: шапки пяти шагов одной высоты, без висячих предлогов */}
                  <span className="xl:mt-1 xl:block xl:min-h-[2lh]">
                    {typo(SCENE.stepMarks[i] ?? '')}
                  </span>
                </p>
                <h3 className="mt-3 font-stage text-[clamp(1.15rem,1.6vw,1.45rem)] uppercase leading-[1.02] tracking-[-0.01em] text-white xl:text-[clamp(1rem,1.4vw,1.35rem)]">
                  {typo(step.title)}
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75 text-pretty">
                  {typo(step.text)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ─────────────────── Вопросы: вклейка в левой колонке ─────────────────── */

/**
 * Левая колонка вопросов под заголовком пуста на 600 px: кадр-вклейка стоит в слоте
 * aside общего блока, колонка липкая, и кадр идёт за читателем, пока он листает
 * ответы. Слот виден с lg; aria-hidden блок не ставит, поэтому он здесь. Высота —
 * от окна: заголовок, вклейка и подпись помещаются под шапкой и на ноутбуке.
 */
function FaqPlate({ frame, page }: { frame: SceneFrame | null; page: string }) {
  return (
    <figure
      aria-hidden="true"
      className="pointer-events-none w-[min(72%,calc((100svh-25rem)*0.8))]"
    >
      <div className="dir-fashion-mat relative aspect-[4/5] bg-black">
        <Plate
          frame={frame}
          word={plateWord(2)}
          index={2}
          // Горизонтальный кадр в окне 4:5: видна лишь половина ширины, поэтому
          // файл берётся почти в полторы высоты слота, иначе он мылится
          sizes="(min-width: 1024px) 45vw, 1px"
          objectPosition="66% 28%"
          className="absolute inset-0"
        />
      </div>
      <figcaption className="dir-kit-meta mt-7 flex justify-between gap-3 font-mono uppercase tabular-nums text-white/60">
        <span className="min-w-0 truncate">
          {isCredited(frame) ? `Кадр — ${frame.client}` : 'Вклейка'}
        </span>
        <span className="shrink-0">Стр. {page}</span>
      </figcaption>
    </figure>
  )
}

/**
 * Знак сцены в финале: отпечаток с загнутым углом и метками реза по краям — такая
 * же вклейка, как в вопросах, только другой кадр. Декор: DirectionEnd сам делает
 * его aria-hidden и не ловит указатель.
 */
function EndPrint({ frame }: { frame: SceneFrame | null }) {
  return (
    <div className="dir-fashion-print relative w-[15rem] -rotate-3 xl:w-[17rem]">
      <span className="dir-fashion-crop" data-corner="tl" />
      <span className="dir-fashion-crop" data-corner="tr" />
      <span className="dir-fashion-crop" data-corner="bl" />
      <span className="dir-fashion-crop" data-corner="br" />
      <div className="dir-fashion-sheet relative bg-[var(--dir-paper)] p-2">
        <div className="relative aspect-[3/4] bg-black">
          <Plate
            frame={frame}
            word={plateWord(4)}
            index={4}
            sizes="(min-width: 1024px) 17rem, 1px"
            className="absolute inset-0"
          />
        </div>
        <Dogear />
      </div>
    </div>
  )
}

/* ─────────────────────────────── Страница ─────────────────────────────── */

/** Героиня на финале уходит в правую, светлую часть кадра: слева градиент под заголовком */
const CLOSING_POSITION = '5% 22%'

/*
 * Раскладка кадров сцены (порядок DIRECTION_SCENES.fashion): 0–4 обложка, 5 оглавление,
 * 6–8 большой кадр разворота, 9–11 малый, 12 вопросы, 13 фон финала. Вклейка в финале
 * повторяет первый кадр обложки: страница открывается и закрывается одним образом.
 * Все слоты, кроме фона финала и вклейки в вопросах, вертикальные, поэтому и кадры в
 * них вертикальные: горизонтальный кадр, обрезанный под 3:4, остаётся без трети кадра
 * и мылится. Вклейка в вопросах (12) — сознательный горизонтальный кадр (мужской образ в
 * длинном пальто: на странице иначе одни женщины), окну 4:5 даны sizes и точка кропа.
 * Большие кадры разворота — самые сильные и разные по образу (лебедь, рыжая в дюнах,
 * мотокуртка), слабый desert-drive уходит в малую вклейку, где дефектов не видно.
 * Фон финала горизонтальный, на телефоне его заменяет вертикаль той же страницы.
 * Кадры работ (со ссылкой на кейс) нужны только лукбуку.
 */
export function FashionPage({ works }: FashionPageProps) {
  const frames = sceneFramesFor('fashion')
  const projectFrames = interleaveFrames(works, 16)
  const closing = frames[13]
  const closingPhone = sceneFrame('burgundy-hall')
  const hasWorks = works.length > 0
  const pages = paginate(hasWorks)

  return (
    <DirectionShell id="fashion" stickyLabel={FASHION_PAGE.stickyLabel}>
      <div className="dir-fashion">
        <Cover frames={frames.slice(0, 5)} />
        <Contents frame={pick(frames, 5)} pages={pages} hasWorks={hasWorks} />
        <Spread frames={frames} />
        <Lookbook frames={projectFrames} pages={pages} />
        {hasWorks ? <Works works={works} pages={pages} /> : null}
        <ProofCta />
        <Process pages={pages} />
      </div>
      <div id="fashion-faq">
        <DirectionFaq
          index={pad(pages.faq.from)}
          title="Вопросы о fashion-видео"
          items={FASHION_PAGE.faq}
          aside={<FaqPlate frame={pick(frames, 12)} page={pad(pages.faq.from)} />}
        />
      </div>
      <OtherDirections current="fashion" reading={DIRECTION_READING['fashion']} />
      <DirectionEnd
        lines={SCENE.end.lines}
        ctaLabel={FASHION_PAGE.ctaLabel}
        note={typo(SCENE.end.note)}
        frame={
          closing
            ? {
                src: closing.src,
                position: CLOSING_POSITION,
                portrait: { src: closingPhone.src, objectPosition: closingPhone.position },
              }
            : null
        }
        aside={<EndPrint frame={pick(frames, 0)} />}
      />
    </DirectionShell>
  )
}
