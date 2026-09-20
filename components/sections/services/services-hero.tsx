'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import type { DirectionWork } from '@/lib/services/proof'

/**
 * Первый экран раздела направлений.
 *
 * Монтаж, а не слайдер. Кадры сменяют друг друга встык, без растворения и без
 * движения внутри кадра: смена плана — это склейка, и выглядеть она должна как
 * склейка. Ритм держится на 2,4 с — столько нужно, чтобы кадр успел
 * прочитаться, и мало, чтобы он успел наскучить.
 *
 * Здесь нет видео. Семь направлений — это семь потоков на первом экране ради
 * фона под заголовком; кадры тех же работ дают ту же плотность продакшна за
 * долю трафика, а движение приходит ниже, в самих сценах.
 *
 * Первый кадр — LCP страницы, поэтому он единственный грузится с priority.
 * При prefers-reduced-motion смены нет вовсе: остаётся первый кадр.
 */

/** Длительность плана. Общая с ритмом сцен ниже — страница монтируется в один такт */
const CUT_MS = 2400

export interface ServicesHeroProps {
  eyebrow: string
  title: string
  lead: string
  montage: DirectionWork[]
  /** Подпись к первому кадру — нужна для скринридера и поиска */
  scrollHint: string
}

export function ServicesHero({ eyebrow, title, lead, montage, scrollHint }: ServicesHeroProps) {
  const [frame, setFrame] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (montage.length < 2) return
    if (typeof window === 'undefined' || !window.matchMedia) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /*
     * Вкладка в фоне не должна копить склейки: без этой проверки человек,
     * вернувшийся через минуту, увидит рывок сразу на несколько планов.
     */
    const tick = () => {
      if (document.visibilityState === 'visible') {
        setFrame(current => (current + 1) % montage.length)
      }
    }

    timerRef.current = window.setInterval(tick, CUT_MS)
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
    }
  }, [montage.length])

  return (
    <section
      aria-labelledby="services-hero-title"
      className="relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#0D0D0D] px-6 pb-16 pt-28 text-white md:px-10 md:pb-20 lg:px-20"
    >
      <div className="absolute inset-0 -z-10">
        {montage.map((work, index) => (
          <div
            key={work.slug}
            aria-hidden="true"
            /* Встык: видимость переключается без transition — это склейка */
            className={cn('absolute inset-0', index === frame ? 'opacity-100' : 'opacity-0')}
          >
            {work.posterUrl ? (
              <Image
                src={work.posterUrl}
                alt=""
                fill
                sizes="100vw"
                priority={index === 0}
                className="object-cover"
              />
            ) : null}
          </div>
        ))}

        {/* Затемнение под текст: коммерческий кадр бывает светлым, и заголовок
            обязан оставаться читаемым на любом плане монтажа */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/80 to-[#0D0D0D]/35" />
      </div>

      {/*
        Появление — transform без прозрачности (общая механика сайта,
        см. .hero-reveal в globals.css): заголовок виден в первом отрисованном
        кадре, ещё до того, как доедет и выполнится JS.
      */}
      <div className="hero-reveal max-w-6xl">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-white/55 md:text-xs">
          {eyebrow}
        </p>

        <h1
          id="services-hero-title"
          className="mt-8 font-brand-hero text-[3.1rem] uppercase italic leading-[0.84] tracking-[-0.035em] text-balance sm:text-7xl lg:text-8xl xl:text-[7.5rem]"
        >
          {title}
        </h1>

        <p className="mt-10 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">{lead}</p>

        <p className="mt-12 font-mono text-[0.6rem] uppercase tracking-[0.24em] text-white/45 md:text-[0.68rem]">
          {scrollHint}
        </p>
      </div>
    </section>
  )
}
