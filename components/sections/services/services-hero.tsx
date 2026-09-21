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
 *
 * В разметке живут только уже показанный кадр и следующий за ним. Раньше все
 * шесть стояли сразу: они лежат внутри вьюпорта, просто на нулевой
 * прозрачности, поэтому «ленивая» загрузка для браузера ничего не откладывала
 * — шесть полноэкранных кадров начинали качаться одновременно с тем
 * единственным, ради которого и стоит priority, и отбирали у него канал.
 * Следующий план подтягивается за 2,4 с до своей склейки: этого хватает с
 * запасом, а первому экрану остаётся один запрос вместо шести.
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
  const sectionRef = useRef<HTMLElement>(null)
  /**
   * Монтаж идёт только пока первый экран виден.
   *
   * Раньше таймер стоял на весь сеанс: человек дочитывал спецификацию внизу
   * страницы, а наверху продолжали сменяться планы — перерисовка каждые 2,4 с
   * ради кадра, которого никто не видит. Склейка — событие для зрителя, а не
   * фоновый процесс.
   */
  const [onScreen, setOnScreen] = useState(true)
  /**
   * frame — что на экране, reached — до какого плана монтаж уже дошёл.
   * Второе только растёт: на втором круге кадр не должен уходить из разметки
   * и возвращаться обратно. Одно состояние на двоих, потому что меняются они
   * всегда вместе.
   */
  const [{ frame, reached }, setCut] = useState({ frame: 0, reached: 0 })
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const node = sectionRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(entries =>
      setOnScreen(entries[0]?.isIntersecting ?? true)
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (montage.length < 2) return
    if (!onScreen) return
    if (typeof window === 'undefined' || !window.matchMedia) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    /*
     * Вкладка в фоне не должна копить склейки: без этой проверки человек,
     * вернувшийся через минуту, увидит рывок сразу на несколько планов.
     */
    const last = montage.length - 1
    const tick = () => {
      if (document.visibilityState !== 'visible') return
      setCut(prev => {
        const next = (prev.frame + 1) % montage.length
        // Следующий план подтягивается за такт до своей склейки
        return { frame: next, reached: Math.max(prev.reached, Math.min(next + 1, last)) }
      })
    }

    /*
     * Второй план приходит после первой отрисовки, а не вместе с ней. Все
     * кадры монтажа лежат внутри вьюпорта — просто на нулевой прозрачности, —
     * и «ленивая» загрузка для браузера ничего не откладывает: пока их было
     * шесть, шесть полноэкранных запросов стартовали одновременно с тем
     * единственным, ради которого стоит priority.
     */
    const prime = window.requestAnimationFrame(() =>
      setCut(prev => ({ ...prev, reached: Math.max(prev.reached, Math.min(1, last)) }))
    )

    timerRef.current = window.setInterval(tick, CUT_MS)
    return () => {
      window.cancelAnimationFrame(prime)
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
    }
  }, [montage.length, onScreen])

  return (
    <section
      ref={sectionRef}
      data-scene="hero"
      aria-labelledby="services-hero-title"
      className="relative isolate flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#0D0D0D] px-6 pb-16 pt-28 text-white md:px-10 md:pb-20 lg:px-20"
    >
      <div className="absolute inset-0 -z-10">
        {montage.map((work, index) => {
          // Кадр монтируется, когда до него остался один такт, и из разметки
          // больше не уходит: на втором круге он приходит уже из кэша
          if (index > reached) return null

          return (
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
          )
        })}

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
        {/* Тот же кегль и трекинг, что у всех пометок ниже: технический слой
            страницы начинается здесь и обязан начинаться в своём наборе */}
        <p className="type-meta font-mono uppercase text-white/50">{eyebrow}</p>

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
