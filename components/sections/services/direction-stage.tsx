'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'

import { cn } from '@/lib/utils'
import type { DirectionWork, ResolvedDirection } from '@/lib/services/proof'

import { DirectionCta } from './direction-cta'
import { SceneMedia } from './scene-media'

/**
 * Направления одной залипающей сценой.
 *
 * Семь территорий — один высокий контейнер и один экран, который держится,
 * пока идёт прокрутка. Положение внутри контейнера выбирает направление:
 * слева список из семи, справа кадр работы, описание и CTA. Смена направления —
 * склейка: панель встаёт на место предыдущей без растворения.
 *
 * Плавность держится на трёх правилах.
 * 1. Ничего не меняет размер. Раскрывающиеся по прокрутке строки двигали бы
 *    страницу под пальцем (layout shift, борьба с scroll anchoring), поэтому
 *    все панели лежат в одной ячейке сетки, а неактивные просто невидимы.
 * 2. React перерисовывается только при смене направления — семь раз за
 *    проход, а не на каждый пиксель. Полоса прогресса идёт напрямую от
 *    motion value (transform, без React).
 * 3. Скролл обычный, не перехваченный: клавиатура, колесо, тач и якоря
 *    работают как везде.
 *
 * Весь текст всех семи направлений остаётся в разметке (неактивные —
 * visibility:hidden), а при prefers-reduced-motion сцена вообще не залипает:
 * панели идут друг за другом обычным списком.
 */

/** Сколько высот экрана прокрутки отдано одному направлению */
const SCREENS_PER_DIRECTION = 0.7

export interface DirectionStageProps {
  directions: readonly ResolvedDirection[]
  /** Направление стало главным на экране (для аналитики) */
  onOpen: (direction: ResolvedDirection) => void
  onBrief: (direction: ResolvedDirection) => void
  onNavigate: (direction: ResolvedDirection) => void
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
}

export function DirectionStage({
  directions,
  onOpen,
  onBrief,
  onNavigate,
  onCaseOpen,
}: DirectionStageProps) {
  const count = directions.length
  const containerRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion() ?? false
  const reportedRef = useRef(-1)

  const [active, setActive] = useState(0)
  /** Кадры грузим у активного направления и его соседей, дальше — по мере подхода */
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set([0, 1]))

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  useMotionValueEvent(scrollYProgress, 'change', progress => {
    if (count === 0 || progress <= 0) return
    const index = Math.min(count - 1, Math.floor(progress * count))

    setActive(current => (current === index ? current : index))
    setLoaded(current => {
      const wanted = [index - 1, index, index + 1].filter(i => i >= 0 && i < count)
      return wanted.every(i => current.has(i)) ? current : new Set([...current, ...wanted])
    })

    if (reportedRef.current !== index) {
      reportedRef.current = index
      const direction = directions[index]
      if (direction) onOpen(direction)
    }
  })

  const jumpTo = useCallback(
    (index: number) => {
      const node = containerRef.current
      if (!node) return
      const top = node.getBoundingClientRect().top + window.scrollY
      const scrollable = node.offsetHeight - window.innerHeight
      window.scrollTo({
        top: top + ((index + 0.5) / count) * scrollable,
        behavior: reduced ? 'auto' : 'smooth',
      })
    },
    [count, reduced]
  )

  if (count === 0) return null

  return (
    <section
      id="directions"
      ref={containerRef}
      aria-labelledby="directions-title"
      // Высота — во сколько экранов длится сцена; при reduced motion её нет
      className="relative border-t border-white/10 bg-[#0D0D0D] text-white motion-reduce:!h-auto"
      style={{ height: `${100 + count * SCREENS_PER_DIRECTION * 100}svh` }}
    >
      <h2 id="directions-title" className="sr-only">
        Направления производства
      </h2>

      <div className="sticky top-0 h-svh w-full overflow-hidden motion-reduce:static motion-reduce:h-auto motion-reduce:overflow-visible">
        {/* Прогресс прохода: тонкая линия у левой кромки, только transform */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-px bg-white/10 motion-reduce:hidden"
        >
          <motion.div
            style={{ scaleY: scrollYProgress }}
            className="h-full w-full origin-top bg-accent will-change-transform"
          />
        </div>

        <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-x-14 px-6 pb-8 pt-[6.5rem] md:px-10 md:pt-[8rem] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1 lg:px-20 lg:pb-14 motion-reduce:h-auto motion-reduce:pb-16">
          {/* Телефон: семь делений; они же — переход к нужному направлению */}
          <ol aria-label="Направления" className="mb-5 flex gap-1 lg:hidden motion-reduce:hidden">
            {directions.map((direction, index) => (
              <li key={direction.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => jumpTo(index)}
                  aria-current={active === index ? 'true' : undefined}
                  className="group flex min-h-11 w-full items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="sr-only">{direction.title}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      'block h-0.5 w-full transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
                      active === index ? 'bg-white' : 'bg-white/25'
                    )}
                  />
                </button>
              </li>
            ))}
          </ol>

          {/* Десктоп: список семи, активное подсвечено */}
          <ol
            aria-label="Направления"
            className="hidden flex-col justify-center gap-2 lg:flex motion-reduce:!hidden"
          >
            {directions.map((direction, index) => (
              <li key={direction.id}>
                <button
                  type="button"
                  onClick={() => jumpTo(index)}
                  aria-current={active === index ? 'true' : undefined}
                  className={cn(
                    'group flex w-full items-baseline gap-5 py-1 text-left',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'type-meta w-8 shrink-0 font-mono transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
                      active === index ? 'text-accent' : 'text-white/35'
                    )}
                  >
                    {direction.index}
                  </span>
                  <span
                    className={cn(
                      'font-stage text-[clamp(1.3rem,2.4vw,2.4rem)] uppercase leading-[0.98] tracking-[-0.03em]',
                      'transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
                      active === index ? 'text-white' : 'text-white/30 group-hover:text-white/70'
                    )}
                  >
                    {direction.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>

          {/* Все панели в одной ячейке: размер не меняется, склейка — visibility */}
          <div className="grid min-h-0 motion-reduce:block">
            {directions.map((direction, index) => (
              <DirectionPanel
                key={direction.id}
                direction={direction}
                current={active === index}
                mounted={loaded.has(index)}
                onBrief={onBrief}
                onNavigate={onNavigate}
                onCaseOpen={onCaseOpen}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

interface DirectionPanelProps {
  direction: ResolvedDirection
  current: boolean
  /** Кадр можно грузить */
  mounted: boolean
  onBrief: (direction: ResolvedDirection) => void
  onNavigate: (direction: ResolvedDirection) => void
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
}

function DirectionPanel({
  direction,
  current,
  mounted,
  onBrief,
  onNavigate,
  onCaseOpen,
}: DirectionPanelProps) {
  const [pickedSlug, setPickedSlug] = useState<string | null>(null)
  const work: DirectionWork | undefined =
    direction.works.find(item => item.slug === pickedSlug) ?? direction.works[0]

  return (
    <article
      data-direction={direction.id}
      data-current={current}
      className={cn(
        'col-start-1 row-start-1 flex min-h-0 flex-col justify-center gap-5',
        // Неактивные скрыты из дерева доступности и порядка табуляции, но остаются в HTML
        current ? 'visible' : 'invisible',
        'motion-reduce:visible motion-reduce:mb-20'
      )}
    >
      <h3
        className={cn(
          'font-stage text-[clamp(1.9rem,8vw,3rem)] uppercase leading-[0.92] tracking-[-0.03em]',
          'lg:sr-only motion-reduce:lg:not-sr-only'
        )}
      >
        <span aria-hidden="true" className="type-meta mr-3 align-middle font-mono text-accent">
          {direction.index}
        </span>
        {direction.title}
      </h3>

      {work ? (
        <div className="relative h-[30svh] w-full overflow-hidden bg-[#141414] lg:h-[44svh] motion-reduce:h-[40svh]">
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10">
        <div>
          <p className="type-meta font-mono uppercase text-white/50">{direction.meta}</p>
          <p className="mt-3 max-w-[38ch] text-base leading-snug text-white/80 md:text-lg">
            {direction.description}
          </p>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          {direction.works.length > 1 ? (
            <ul aria-label="Кадр работы" className="flex flex-wrap gap-2 lg:justify-end">
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
    </article>
  )
}
