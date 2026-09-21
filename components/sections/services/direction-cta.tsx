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
    /* gap-2.5, а не gap-3: стрелка — это знак препинания у слова, и оптически
       она стоит ближе, чем номинальные 12px между двумя словами */
    'group relative inline-flex items-center gap-2.5 border-b pb-2 text-left text-base font-medium md:text-lg',
    /* Главное действие территории нажимается в сорок пять пикселей по высоте,
       а рисуется по-прежнему в тридцать семь: разницу держит псевдоэлемент */
    "before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']",
    'transition-[color,border-color,transform] duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
    /*
      Нажатие. Единственное движение на странице, которого не видно, но
      которое чувствуешь: страница подтверждает, что услышала палец, до
      того как начнётся прокрутка к брифу. Полтора процента — ниже порога
      «кнопка прыгнула» и выше порога «ничего не произошло».
    */
    'active:scale-[0.985] active:duration-[var(--motion-press)]',
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
        className="h-4 w-4 transition-transform duration-[var(--motion-state)] ease-[var(--ease-out-expo)] group-hover:translate-x-1"
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
