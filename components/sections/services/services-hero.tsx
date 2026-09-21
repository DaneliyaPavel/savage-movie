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
}

export function ServicesHero({ eyebrow, title, lead, montage }: ServicesHeroProps) {
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

        {/*
          Затемнение прижато к низу, а не размазано по всему кадру. Прежняя
          заливка держала 35% черноты даже в верхней трети, и любой план
          монтажа приходил на первый экран приглушённым: студия, которая
          снимает кадр, показывала его через вуаль. Теперь плотность нужна
          только там, где действительно лежит набор.
        */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/75 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0D0D0D]/55 to-transparent" />
      </div>

      {/*
        Появление — transform без прозрачности (общая механика сайта,
        см. .hero-reveal в globals.css): заголовок виден в первом отрисованном
        кадре, ещё до того, как доедет и выполнится JS.
      */}
      {/*
        Заголовок уходит вправо за поля контейнера: кадр продолжается за
        кромкой листа, и набор продолжается вместе с ним. Подсказки «листайте
        вниз» под ним больше нет — человек, который видит первый экран, ещё не
        листал, и объяснять ему прокрутку значит занимать строку ничем.
      */}
      <div className="hero-reveal">
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/50 md:text-xs md:tracking-[0.28em]">
          {eyebrow}
        </p>

        <h1
          id="services-hero-title"
          className="mt-7 -mr-[6vw] font-brand-hero text-[3.4rem] uppercase italic leading-[0.8] tracking-[-0.04em] text-balance sm:text-[5.4rem] lg:text-[7.4rem] xl:text-[9rem]"
        >
          {title}
        </h1>

        <p className="mt-9 max-w-[26ch] text-lg leading-snug text-white/80 md:text-xl">{lead}</p>
      </div>
    </section>
  )
}
