'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import {
  motion,
  motionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'

import { cn } from '@/lib/utils'
import type { DirectionWork, ResolvedDirection } from '@/lib/services/proof'

import { DirectionCta } from './direction-cta'
import { SceneMedia } from './scene-media'

/**
 * Направления колодой карточек.
 *
 * Каждое направление — полноценная карточка высотой в экран: номер и название,
 * кадр работы, описание, выбор работы и CTA. Карточки залипают в одной точке
 * с небольшим сдвигом вниз, а следующая выезжает снизу и накрывает предыдущую.
 * Предыдущая при этом чуть уменьшается и темнеет, а из-под нового края
 * выглядывают тонкие кромки уже пройденных: колода читается как колода.
 *
 * Почему кнопки и текст всегда в кадре. Сдвиг между карточками — доли rem, а не
 * полоса заголовка, поэтому глубина колоды почти не отнимает высоту, и текущая
 * карточка целиком помещается на экран на любом направлении. Между карточками
 * оставлен запас прокрутки: пока он идёт, карточка неподвижна и её можно
 * прочитать, а следующая ещё не показалась.
 *
 * Почему это плавно.
 * 1. Раскрытие — обычный sticky, его ведёт компоситор, а не скрипт.
 * 2. Скролл не перехвачен: колесо, тач, клавиатура и якоря работают как везде.
 * 3. Затемнение и масштаб пишутся прямо в motion value без перерисовки React;
 *    React обновляется только при смене текущей карточки (семь раз за проход).
 *
 * Весь текст всех карточек остаётся в разметке. Тело накрытой карточки выключено
 * из табуляции (inert). При prefers-reduced-motion колоды нет: карточки идут
 * обычным списком.
 */

/** Высота карточки: весь экран за вычетом верха и глубины колоды */
const CARD_HEIGHT = 'h-[max(32rem,calc(100svh-var(--stack-top)-var(--deck-depth)-1rem))]'

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
  /** Насколько каждую карточку накрыла следующая: 0 — не тронута, 1 — накрыта полностью */
  const covers = useMemo(() => directions.map(() => motionValue(0)), [directions])

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

    for (let i = 0; i < count - 1; i += 1) {
      const node = cardRefs.current[i]
      const next = cardRefs.current[i + 1]
      if (!node || !next || reduced) {
        covers[i]?.set(0)
        continue
      }
      const travel =
        (next.getBoundingClientRect().top - (stuckTopRef.current[i + 1] ?? 0)) / node.offsetHeight
      covers[i]?.set(Math.min(1, Math.max(0, 1 - travel)))
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
        // Сдвиг между карточками колоды и отступ колоды от верхней кромки
        '[--deck:0.5rem] [--stack-top:5rem] md:[--deck:0.75rem] md:[--stack-top:5.5rem]'
      )}
      // Высота карточки: экран минус верх стопки, вся глубина колоды и воздух снизу
      style={{ '--deck-depth': `calc(${count - 1} * var(--deck))` } as CSSProperties}
    >
      <h2 id="directions-title" className="sr-only">
        Направления производства
      </h2>

      <ol className="flex flex-col gap-[26svh] pb-12 md:gap-[30svh] md:pb-20 motion-reduce:gap-6">
        {directions.map((direction, index) => (
          <DirectionCard
            key={direction.id}
            ref={setRef(index)}
            direction={direction}
            cover={covers[index] as MotionValue<number>}
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
  /** Прогресс накрывания следующей карточкой */
  cover: MotionValue<number>
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
  cover,
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
  const scale = useTransform(cover, [0, 1], [1, 0.955])
  const shade = useTransform(cover, [0, 1], [0, 0.62])

  return (
    <li
      ref={ref}
      data-direction={direction.id}
      data-current={current}
      // Каждая следующая карточка залипает чуть ниже предыдущей: видна кромка колоды
      style={{ top: `calc(var(--stack-top) + ${index} * var(--deck))` }}
      className={cn('sticky motion-reduce:static motion-reduce:!h-auto', CARD_HEIGHT)}
    >
      <motion.div
        style={{ scale }}
        className={cn(
          'relative flex h-full origin-top flex-col overflow-hidden border-t border-white/15 bg-[#101010]',
          'shadow-[0_-1.75rem_3.5rem_-0.75rem_rgba(0,0,0,0.9)] motion-reduce:!transform-none'
        )}
      >
        <h3 className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-6 md:h-16 md:gap-8 md:px-10 lg:px-20">
          <span
            aria-hidden="true"
            className={cn(
              'type-meta w-14 shrink-0 font-mono transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)] md:w-20',
              current ? 'text-accent' : 'text-white/40'
            )}
          >
            {direction.index} / {String(count).padStart(2, '0')}
          </span>
          <span className="min-w-0 flex-1 truncate font-stage text-[clamp(1rem,2.3vw,1.9rem)] uppercase leading-none tracking-[-0.02em] text-white">
            {direction.title}
          </span>
          <span className="type-meta hidden shrink-0 font-mono uppercase text-white/45 lg:block">
            {direction.meta}
          </span>
        </h3>

        <div
          inert={covered}
          className="relative min-h-0 flex-1 overflow-hidden bg-[#141414] motion-reduce:min-h-[32rem]"
        >
          {/* Кадр работы во всю карточку; текст лежит поверх на затемнении */}
          {work && mounted ? (
            <SceneMedia
              key={work.slug}
              work={work}
              active={current}
              aspect="16 / 9"
              sizes="100vw"
              className="absolute inset-0 h-full w-full"
            />
          ) : null}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#101010] from-5% via-[#101010]/70 via-40% to-transparent"
          />

          <div className="relative z-10 flex h-full flex-col justify-end gap-6 px-6 pb-6 md:px-10 md:pb-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-end lg:gap-14 lg:px-20">
            <div>
              <p className="type-meta font-mono uppercase text-white/60 [text-shadow:0_1px_14px_rgba(0,0,0,0.8)]">
                {work
                  ? `${work.client} / ${work.title}${work.year ? ` / ${work.year}` : ''}`
                  : null}
              </p>
              <p className="type-meta mt-1 font-mono uppercase text-white/50 lg:hidden">
                {direction.meta}
              </p>
              <p className="mt-3 max-w-[30ch] text-2xl leading-tight text-white md:text-3xl lg:text-4xl">
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

        {/* Затемнение, пока карточку накрывает следующая */}
        <motion.span
          aria-hidden="true"
          style={{ opacity: shade }}
          className="pointer-events-none absolute inset-0 bg-black"
        />
      </motion.div>
    </li>
  )
}
