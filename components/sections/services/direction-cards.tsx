'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useMotionValueEvent, useScroll } from 'framer-motion'

import { cn } from '@/lib/utils'
import type { DirectionWork, ResolvedDirection } from '@/lib/services/proof'

import { DirectionCta } from './direction-cta'
import { SceneMedia } from './scene-media'

/**
 * Направления стопкой карточек.
 *
 * Каждое направление — полноценная карточка: полоса с номером и названием,
 * под ней кадр работы, описание, выбор работы и CTA. Карточки залипают одна
 * под другой: следующая выезжает снизу и накрывает тело предыдущей, оставляя
 * на виду только её полосу. Так «раскрытие» идёт от прокрутки, а закрытые
 * направления остаются списком полос над открытым.
 *
 * Почему это плавно.
 * 1. Никто не меняет размер: раскрывающиеся по прокрутке строки двигали бы
 *    страницу под пальцем. Здесь карточки одной высоты, а движение — это
 *    обычный sticky, который браузер ведёт на компоситоре.
 * 2. Скролл не перехвачен: колесо, тач, клавиатура и якоря работают как везде.
 * 3. React перерисовывается только при смене текущей карточки — семь раз за
 *    проход, а не на каждый пиксель.
 *
 * Весь текст всех карточек остаётся в разметке. Тело карточки, накрытой
 * следующей, выключено из порядка табуляции (inert): фокус не должен уходить
 * под карточку. При prefers-reduced-motion стопки нет: карточки идут обычным
 * списком и ничего не накрывают.
 */

/** Высота карточки: достаточно, чтобы накрыть предыдущую, и не больше экрана */
const CARD_HEIGHT = 'h-[max(34rem,76svh)]'

export interface DirectionCardsProps {
  directions: readonly ResolvedDirection[]
  /** Направление стало текущим в стопке (для аналитики) */
  onOpen: (direction: ResolvedDirection) => void
  onBrief: (direction: ResolvedDirection) => void
  onNavigate: (direction: ResolvedDirection) => void
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
}

export function DirectionCards({
  directions,
  onOpen,
  onBrief,
  onNavigate,
  onCaseOpen,
}: DirectionCardsProps) {
  const count = directions.length
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  /** Позиции, на которых карточки залипают (px от верха окна), пересчитываются при ресайзе */
  const stuckTopRef = useRef<number[]>([])
  const reportedRef = useRef(-1)

  const [active, setActive] = useState(0)
  const [reduced, setReduced] = useState(false)
  /** Кадры грузим у текущей карточки и её соседей */
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set([0, 1]))

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const measure = () => {
      setReduced(query.matches)
      stuckTopRef.current = cardRefs.current.map(node =>
        node ? parseFloat(getComputedStyle(node).top) || 0 : 0
      )
    }
    measure()
    query.addEventListener('change', measure)
    window.addEventListener('resize', measure)
    return () => {
      query.removeEventListener('change', measure)
      window.removeEventListener('resize', measure)
    }
  }, [count])

  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', () => {
    // Текущая — последняя карточка, которая уже встала на своё место в стопке
    let index = 0
    for (let i = 1; i < count; i += 1) {
      const node = cardRefs.current[i]
      if (!node) continue
      if (node.getBoundingClientRect().top <= (stuckTopRef.current[i] ?? 0) + 2) index = i
    }

    setActive(current => (current === index ? current : index))
    setLoaded(current => {
      const wanted = [index - 1, index, index + 1].filter(i => i >= 0 && i < count)
      return wanted.every(i => current.has(i)) ? current : new Set([...current, ...wanted])
    })

    // Просмотр считаем, когда карточка стала текущей на экране стопки, а не до
    const first = cardRefs.current[0]
    const inView = first ? first.getBoundingClientRect().top < window.innerHeight * 0.6 : false
    if (inView && reportedRef.current !== index) {
      reportedRef.current = index
      const direction = directions[index]
      if (direction) onOpen(direction)
    }
  })

  const setRef = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      cardRefs.current[index] = node
    },
    []
  )

  if (count === 0) return null

  return (
    <section
      id="directions"
      aria-labelledby="directions-title"
      className={cn(
        'border-t border-white/10 bg-[#0D0D0D] text-white',
        // Высота полосы карточки и отступ стопки от верхней кромки
        '[--peek:3.5rem] [--stack-top:5rem] md:[--peek:4.25rem] md:[--stack-top:5.5rem]'
      )}
    >
      <h2 id="directions-title" className="sr-only">
        Направления производства
      </h2>

      <ol className="flex flex-col pb-12 md:pb-20">
        {directions.map((direction, index) => (
          <DirectionCard
            key={direction.id}
            ref={setRef(index)}
            direction={direction}
            index={index}
            count={count}
            current={active === index}
            covered={!reduced && index < active}
            mounted={loaded.has(index)}
            onBrief={onBrief}
            onNavigate={onNavigate}
            onCaseOpen={onCaseOpen}
          />
        ))}
      </ol>
    </section>
  )
}

interface DirectionCardProps {
  ref: (node: HTMLElement | null) => void
  direction: ResolvedDirection
  index: number
  count: number
  current: boolean
  /** Накрыта следующей карточкой: тело не должно принимать фокус */
  covered: boolean
  /** Кадр можно грузить */
  mounted: boolean
  onBrief: (direction: ResolvedDirection) => void
  onNavigate: (direction: ResolvedDirection) => void
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
}

function DirectionCard({
  ref,
  direction,
  index,
  count,
  current,
  covered,
  mounted,
  onBrief,
  onNavigate,
  onCaseOpen,
}: DirectionCardProps) {
  const [pickedSlug, setPickedSlug] = useState<string | null>(null)
  const work: DirectionWork | undefined =
    direction.works.find(item => item.slug === pickedSlug) ?? direction.works[0]

  return (
    <li
      ref={ref}
      data-direction={direction.id}
      data-current={current}
      /*
       * Карточка i залипает ниже карточки i-1 ровно на высоту её полосы.
       * Нижний отступ (count-1-i полос) выравнивает момент, когда стопка
       * упирается в конец секции: без него последняя карточка налезала бы на
       * полосы остальных, и стопка сминалась. Верхний отрицательный отступ
       * гасит этот же отступ у предыдущей карточки, чтобы между карточками
       * не появлялись пустоты.
       */
      style={{
        top: `calc(var(--stack-top) + ${index} * var(--peek))`,
        marginBottom: `calc(${count - 1 - index} * var(--peek))`,
        marginTop: index > 0 ? `calc(${index - count} * var(--peek))` : undefined,
      }}
      className={cn(
        'sticky flex flex-col border-t border-white/10 bg-[#0D0D0D]',
        'motion-reduce:static motion-reduce:!m-0 motion-reduce:!h-auto motion-reduce:pb-10',
        CARD_HEIGHT
      )}
    >
      {/* Полоса: остаётся на виду, когда карточку накрыла следующая */}
      <h3 className="flex h-[var(--peek)] shrink-0 items-center gap-3 px-6 md:gap-8 md:px-10 lg:px-20">
        <span
          aria-hidden="true"
          className={cn(
            'type-meta w-6 shrink-0 font-mono transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)] md:w-12',
            current ? 'text-accent' : 'text-white/40'
          )}
        >
          {direction.index}
        </span>
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-stage text-[clamp(0.9rem,2.1vw,1.8rem)] uppercase leading-none tracking-[-0.02em]',
            'transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
            current ? 'text-white' : 'text-white/55'
          )}
        >
          {direction.title}
        </span>
        <span className="type-meta hidden shrink-0 font-mono uppercase text-white/45 lg:block">
          {direction.meta}
        </span>
      </h3>

      <div
        inert={covered}
        className="grid min-h-0 flex-1 gap-6 px-6 pb-8 md:px-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14 lg:px-20 lg:pb-12"
      >
        {work ? (
          <div className="relative min-h-[14rem] overflow-hidden bg-[#141414] motion-reduce:h-[40svh]">
            {mounted ? (
              <SceneMedia
                key={work.slug}
                work={work}
                active={current}
                aspect="16 / 9"
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="absolute inset-0 h-full w-full"
              />
            ) : null}
            <span className="type-meta pointer-events-none absolute bottom-3 left-4 font-mono uppercase text-white/70 [text-shadow:0_1px_14px_rgba(0,0,0,0.8)]">
              {work.client} / {work.title}
              {work.year ? ` / ${work.year}` : ''}
            </span>
          </div>
        ) : null}

        <div className="flex flex-col justify-between gap-6">
          <div>
            <p className="type-meta font-mono uppercase text-white/50 lg:hidden">
              {direction.meta}
            </p>
            <p className="mt-3 max-w-[34ch] text-lg leading-snug text-white/85 md:text-xl lg:mt-0 lg:text-2xl">
              {direction.description}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {direction.works.length > 1 ? (
              <ul aria-label="Кадр работы" className="flex flex-wrap gap-2">
                {direction.works.map(item => (
                  <li key={item.slug}>
                    <button
                      type="button"
                      aria-pressed={item.slug === work?.slug}
                      onClick={() => setPickedSlug(item.slug)}
                      className={cn(
                        'type-meta relative min-h-8 border px-3 font-mono uppercase',
                        'transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
                        "before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']",
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                        item.slug === work?.slug
                          ? 'border-white text-white'
                          : 'border-white/20 text-white/55 hover:border-white/60 hover:text-white'
                      )}
                    >
                      {item.client}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {work ? (
              <Link
                href={`/projects/${work.slug}`}
                prefetch={false}
                onClick={() => onCaseOpen(direction, work.slug)}
                className="type-meta relative w-fit font-mono uppercase text-white/70 before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                Смотреть работу: {work.client} →
              </Link>
            ) : null}
            <DirectionCta direction={direction} onBrief={onBrief} onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </li>
  )
}
