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

import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'

import type { HeroContent, SlaContent } from '@/lib/commercial-landing/content'
import { LazyHlsVideo } from './lazy-hls-video'

interface CommercialHeroProps {
  hero: HeroContent
  sla: SlaContent
  onEstimateClick: () => void
  onProjectsClick: () => void
}

export function CommercialHero({
  hero,
  sla,
  onEstimateClick,
  onProjectsClick,
}: CommercialHeroProps) {
  const note = sla.enabled ? sla.text : hero.ctaNote

  return (
    <section className="relative flex min-h-[100svh] w-full items-end overflow-hidden bg-[#000000] pb-16 pt-28 md:pb-20 md:items-center">
      {/* Фон: видео на десктопе, на мобильных остаётся постером —
          мобильный трафик Директа не должен платить за фоновый луп */}
      <div className="absolute inset-0 z-0">
        {hero.videoPlaybackId ? (
          <>
            <div className="hidden h-full w-full md:block">
              <LazyHlsVideo
                playbackId={hero.videoPlaybackId}
                poster={hero.posterUrl}
                autoPlay
                loop
                eager
                aspect="auto"
                className="h-full w-full"
              />
            </div>
            <div className="h-full w-full md:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hero.posterUrl || ''}
                alt=""
                aria-hidden="true"
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
            </div>
          </>
        ) : null}

        {/* Затемнение под текст: без него светлый коммерческий кадр съедает контраст */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/75 to-[#000000]/40" />
      </div>

      <div className="relative z-10 w-full px-6 md:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl"
        >
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-white/50 md:text-xs">
            {hero.eyebrow}
          </p>
          <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40 md:text-xs">
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
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="relative z-10">{hero.ctaPrimary}</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
              <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
            </button>

            <button
              type="button"
              onClick={onProjectsClick}
              className="inline-flex items-center justify-center gap-2 px-2 py-4 text-base text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <span className="border-b border-white/30 pb-0.5">{hero.ctaSecondary}</span>
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/45">{note}</p>
        </motion.div>
      </div>
    </section>
  )
}
