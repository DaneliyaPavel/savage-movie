/**
 * Первый экран коммерческого лендинга.
 *
 * Задача экрана — за несколько секунд ответить на четыре вопроса: что продаём,
 * кому, какого порядка бюджет и куда нажать. Поэтому заголовок прямой
 * («Рекламные ролики для бизнеса и брендов»), а не образный, а ориентир
 * бюджета стоит отдельной строкой сразу под лидом: это фильтр аудитории,
 * а не ценник, поэтому он набран как техническая пометка, не как badge.
 */
'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'

import type { HeroContent, SlaContent } from '@/lib/commercial-landing/content'
import { getThumbnailUrl } from '@/lib/integrations/bunny/client'
import { LazyHlsVideo } from './lazy-hls-video'

interface CommercialHeroProps {
  hero: HeroContent
  sla: SlaContent
  onEstimateClick: () => void
  onProjectsClick: () => void
  /**
   * Постер первого featured-кейса — фолбэк, когда для hero своего медиа ещё
   * нет: он честно показывает уровень продакшна, а не чёрный экран.
   */
  fallbackPosterUrl?: string | null
}

export function CommercialHero({
  hero,
  sla,
  onEstimateClick,
  onProjectsClick,
  fallbackPosterUrl = null,
}: CommercialHeroProps) {
  const note = sla.enabled ? sla.text : hero.ctaNote

  // Приоритет: постер из CMS → автопостер Bunny для заданного видео → постер
  // кейса → ничего (остаётся чёрный градиентный фон). Если верхний кандидат
  // не догрузится (например, автопостер ещё не сгенерирован Bunny и отвечает
  // 404), <img onError> сдвигает список на следующий без правки кода.
  const posterCandidates = useMemo(() => {
    const videoThumbnail = hero.videoPlaybackId ? getThumbnailUrl(hero.videoPlaybackId) : null
    return Array.from(
      new Set([hero.posterUrl, videoThumbnail, fallbackPosterUrl].filter(Boolean))
    ) as string[]
  }, [hero.posterUrl, hero.videoPlaybackId, fallbackPosterUrl])

  const [posterIndex, setPosterIndex] = useState(0)
  const posterUrl = posterCandidates[posterIndex] ?? null
  const handlePosterError = () => setPosterIndex(index => index + 1)

  return (
    <section className="relative flex min-h-[100svh] w-full items-end overflow-hidden bg-[#000000] pb-16 pt-28 md:pb-20 md:items-center">
      {/* Фон: видео на десктопе, на мобильных остаётся постером —
          мобильный трафик Директа не должен платить за фоновый луп.
          Без dedicated видео, но с постером (свой или кейса) — статичный
          кадр на обеих платформах. */}
      <div className="absolute inset-0 z-0">
        {hero.videoPlaybackId ? (
          <>
            <div className="hidden h-full w-full md:block">
              <LazyHlsVideo
                playbackId={hero.videoPlaybackId}
                poster={posterUrl}
                autoPlay
                loop
                eager
                aspect="auto"
                className="h-full w-full"
              />
            </div>
            <div className="h-full w-full md:hidden">
              {posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={posterUrl}
                  alt=""
                  aria-hidden="true"
                  fetchPriority="high"
                  onError={handlePosterError}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
          </>
        ) : posterUrl ? (
          <div className="h-full w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={posterUrl}
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              onError={handlePosterError}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        {/* Затемнение под текст: без него светлый коммерческий кадр съедает контраст */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/75 to-[#000000]/40" />
      </div>

      <div className="relative z-10 w-full px-6 md:px-10 lg:px-20">
        {/*
          Появление — чистый CSS (см. .hero-reveal в globals.css), не Framer
          Motion: контент физически присутствует и виден с первого кадра,
          независимо от того, догрузился ли и выполнился ли JS-бандл.
          Декоративная анимация входа поверх уже видимого контента —
          progressive enhancement, а не условие его видимости.
        */}
        <div className="hero-reveal max-w-5xl">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-white/55 md:text-xs">
            {hero.eyebrow}
          </p>
          <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/55 md:text-xs">
            {hero.geo}
          </p>

          <h1 className="mt-7 text-[2.5rem] font-light leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
            {hero.h1}
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            {hero.lead}
          </p>

          {/* Ориентир бюджета: тонкая линия слева вместо плашки —
              это уровень продакшна, а не скидочный ярлык */}
          <p className="mt-8 border-l border-accent/70 pl-4 font-mono text-xs uppercase tracking-[0.14em] text-white/60 md:text-sm">
            {hero.budgetQualifier}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onEstimateClick}
              aria-label={hero.ctaPrimary}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {/* На 360px полная формулировка переносится на две строки —
                  до 640px показываем короткий эквивалент того же действия,
                  aria-label выше сохраняет полную формулировку для скринридера */}
              <span aria-hidden="true" className="relative z-10 sm:hidden">
                Получить смету
              </span>
              <span aria-hidden="true" className="relative z-10 hidden sm:inline">
                {hero.ctaPrimary}
              </span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
              <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
            </button>

            <button
              type="button"
              onClick={onProjectsClick}
              className="inline-flex items-center justify-center gap-2 px-2 py-4 text-base text-white/70 transition-[color,scale] duration-200 hover:text-white active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="border-b border-white/30 pb-0.5">{hero.ctaSecondary}</span>
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/50">{note}</p>
        </div>
      </div>
    </section>
  )
}
