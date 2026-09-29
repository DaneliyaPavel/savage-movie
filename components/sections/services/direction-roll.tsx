'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { DirectionWork, ResolvedDirection } from '@/lib/services/proof'

import { DirectionCta } from './direction-cta'
import { SceneMedia } from './scene-media'

/**
 * Ролл направлений: семь строк, одна раскрыта.
 *
 * Тот же язык, что у ролла на /clients: номер, название крупным набором,
 * техническая строка справа. Строка раскрывается как аккордеон, и внутри —
 * кадр работы (у работы с потоком он играет, пока строка открыта), одно
 * предложение о направлении, доказательства и CTA.
 *
 * Раскрывается по нажатию, а не по наведению: раскрытие по ховеру двигает
 * строки под курсором, и соседняя строка убегает из-под руки.
 *
 * Смена кадра при выборе работы — склейка: новый план встаёт на место старого
 * без растворения, как в монтаже.
 *
 * Весь текст закрытых строк остаётся в разметке (сворачивается только высота),
 * поэтому поиск и скринридер видят все семь направлений целиком, а без JS
 * раскрыта первая.
 */

export interface DirectionRollProps {
  directions: readonly ResolvedDirection[]
  onOpen: (direction: ResolvedDirection) => void
  onBrief: (direction: ResolvedDirection) => void
  onNavigate: (direction: ResolvedDirection) => void
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
}

const rowId = (direction: { id: string }) => `direction-${direction.id}`

export function DirectionRoll({
  directions,
  onOpen,
  onBrief,
  onNavigate,
  onCaseOpen,
}: DirectionRollProps) {
  const [openId, setOpenId] = useState<string | null>(directions[0]?.id ?? null)
  /** Кадры грузим только у строк, которые хотя бы раз открывали */
  const [seen, setSeen] = useState<ReadonlySet<string>>(
    () => new Set(directions[0] ? [directions[0].id] : [])
  )

  const toggle = useCallback(
    (direction: ResolvedDirection) => {
      setOpenId(current => {
        const next = current === direction.id ? null : direction.id
        if (next) onOpen(direction)
        return next
      })
      setSeen(prev => (prev.has(direction.id) ? prev : new Set(prev).add(direction.id)))
    },
    [onOpen]
  )

  return (
    <section
      id="directions"
      aria-labelledby="directions-title"
      className="border-t border-white/10 bg-[#0D0D0D] text-white"
    >
      <div className="flex items-baseline justify-between gap-4 px-6 pb-4 pt-8 md:px-10 md:pt-10 lg:px-20">
        <h2
          id="directions-title"
          className="type-meta font-mono uppercase tracking-[0.2em] text-white/55"
        >
          Направления
        </h2>
        <span className="type-meta font-mono uppercase text-white/40">Нажмите на строку</span>
      </div>

      <ul className="border-t border-white/10">
        {directions.map(direction => (
          <DirectionRow
            key={direction.id}
            direction={direction}
            open={openId === direction.id}
            loaded={seen.has(direction.id)}
            onToggle={toggle}
            onBrief={onBrief}
            onNavigate={onNavigate}
            onCaseOpen={onCaseOpen}
          />
        ))}
      </ul>
    </section>
  )
}

interface DirectionRowProps {
  direction: ResolvedDirection
  open: boolean
  loaded: boolean
  onToggle: (direction: ResolvedDirection) => void
  onBrief: (direction: ResolvedDirection) => void
  onNavigate: (direction: ResolvedDirection) => void
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
}

function DirectionRow({
  direction,
  open,
  loaded,
  onToggle,
  onBrief,
  onNavigate,
  onCaseOpen,
}: DirectionRowProps) {
  const id = rowId(direction)
  const [pickedSlug, setPickedSlug] = useState<string | null>(null)
  const work: DirectionWork | undefined =
    direction.works.find(item => item.slug === pickedSlug) ?? direction.works[0]

  return (
    <li className="border-b border-white/10" data-direction={direction.id} data-open={open}>
      <h3>
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => onToggle(direction)}
          className={cn(
            'group relative flex w-full items-baseline gap-5 px-6 py-7 text-left md:gap-8 md:px-10 md:py-9 lg:px-20',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'type-meta w-8 shrink-0 font-mono md:w-12',
              'transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
              open ? 'text-accent' : 'text-white/40 group-hover:text-white/70'
            )}
          >
            {direction.index}
          </span>
          <span
            className={cn(
              'min-w-0 flex-1 font-stage text-[clamp(1.6rem,5vw,4rem)] uppercase leading-[0.92] tracking-[-0.03em]',
              'transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
              open ? 'text-white' : 'text-white/55 group-hover:text-white'
            )}
          >
            {direction.title}
          </span>
          <span className="type-meta hidden max-w-[24%] shrink-0 text-right font-mono uppercase text-white/50 lg:block">
            {direction.meta}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'shrink-0 self-center text-2xl leading-none text-white/60',
              'transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] motion-reduce:transition-none',
              open && 'rotate-45 text-accent'
            )}
          >
            +
          </span>
        </button>
      </h3>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-[var(--motion-move)] ease-[var(--ease-out-expo)] motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              'grid gap-8 px-6 pb-10 md:px-10 lg:gap-14 lg:px-20 lg:pb-14',
              // Без работ кадра нет: текст занимает ширину, а не стоит рядом с пустой рамкой
              work && 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]'
            )}
          >
            {work ? (
              <div className="relative aspect-video w-full overflow-hidden bg-[#141414]">
                {loaded && work ? (
                  <SceneMedia
                    key={work.slug}
                    work={work}
                    active={open}
                    aspect="16 / 9"
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="absolute inset-0 h-full w-full"
                  />
                ) : null}
                {work ? (
                  <span className="type-meta pointer-events-none absolute bottom-3 left-4 font-mono uppercase text-white/70 [text-shadow:0_1px_14px_rgba(0,0,0,0.8)]">
                    {work.client} / {work.title}
                    {work.year ? ` / ${work.year}` : ''}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col justify-between gap-8">
              <div>
                <p className="type-meta font-mono uppercase text-white/50 lg:hidden">
                  {direction.meta}
                </p>
                <p className="mt-4 max-w-[34ch] text-lg leading-snug text-white/80 md:text-xl lg:mt-0">
                  {direction.description}
                </p>
              </div>

              <div className="flex flex-col gap-6">
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
        </div>
      </div>
    </li>
  )
}
