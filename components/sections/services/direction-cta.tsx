'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { directionHref } from '@/lib/services/directions'
import type { ResolvedDirection } from '@/lib/services/proof'

/**
 * CTA направления.
 *
 * Опубликованное направление — обычная ссылка на свою страницу. У остальных
 * собственной страницы пока нет, и вместо неё CTA открывает бриф этого же
 * раздела с уже выбранным направлением. Ссылки на несуществующий маршрут
 * не появляется нигде: ни в разметке, ни в prefetch — пустой индексируемый
 * лендинг ради красивого URL вреднее, чем его отсутствие.
 */
export interface DirectionCtaProps {
  direction: ResolvedDirection
  /** Открыть бриф с этим направлением. Вызывается только у неопубликованных */
  onBrief: (direction: ResolvedDirection) => void
  /** Клик по опубликованной ссылке — для цели service_direction_click */
  onNavigate: (direction: ResolvedDirection) => void
  theme?: 'black' | 'white'
  className?: string
}

export function DirectionCta({
  direction,
  onBrief,
  onNavigate,
  theme = 'black',
  className,
}: DirectionCtaProps) {
  const isLight = theme === 'white'

  const shared = cn(
    'group inline-flex items-center gap-3 border-b pb-2 text-left text-base font-medium transition-colors md:text-lg',
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
    isLight
      ? 'border-black/25 text-[#0D0D0D] hover:border-accent hover:text-accent'
      : 'border-white/25 text-white hover:border-accent hover:text-accent',
    className
  )

  const label = (
    <>
      <span>{direction.ctaLabel}</span>
      <ArrowRight
        aria-hidden="true"
        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
      />
    </>
  )

  if (direction.route.published) {
    return (
      <Link
        href={directionHref(direction)}
        onClick={() => onNavigate(direction)}
        className={shared}
      >
        {label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={() => onBrief(direction)} className={shared}>
      {label}
    </button>
  )
}
