/**
 * Финальный экран: последняя точка входа в смету для тех, кто дочитал.
 *
 * Здесь остаются только прямые контакты — почта и Telegram: человеку, который
 * дошёл до конца и всё ещё не заполнил форму, обычно проще написать.
 *
 * Рядом с ними — выход в раздел направлений. Страница заточена под рекламный
 * ролик, но поисковый трафик приводит сюда и тех, кому нужен fashion, beauty
 * или регулярный контент: такому человеку нужен не ещё один призыв к смете,
 * а возможность найти свою территорию, не возвращаясь в поиск.
 */
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { CONTACT_EMAIL, TELEGRAM_URL, type FinalCtaContent } from '@/lib/commercial-landing/content'
import { LazyHlsVideo } from './lazy-hls-video'

interface FinalCtaProps {
  content: FinalCtaContent
  onEstimateClick: () => void
  onEmailClick: () => void
  onTelegramClick: () => void
  /** Переход в раздел направлений — для отчёта о том, куда уходит трафик */
  onDirectionsClick: () => void
}

export function FinalCta({
  content,
  onEstimateClick,
  onEmailClick,
  onTelegramClick,
  onDirectionsClick,
}: FinalCtaProps) {
  return (
    <section className="relative flex min-h-[70svh] items-center overflow-hidden border-t border-[#1A1A1A] bg-[#000000] px-6 py-24 md:px-10 md:py-32 lg:px-20">
      {content.playbackId ? (
        <div className="absolute inset-0 z-0">
          <LazyHlsVideo
            playbackId={content.playbackId}
            poster={content.posterUrl}
            autoPlay
            loop
            aspect="auto"
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/80 to-[#000000]/50" />
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-3xl"
      >
        <h2 className="text-3xl font-light leading-[1.05] tracking-tight text-white md:text-6xl">
          {content.title}
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 md:text-lg">
          {content.text}
        </p>

        <button
          type="button"
          onClick={onEstimateClick}
          aria-label={content.ctaLabel}
          className="group relative mt-10 inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          {/* Тот же перенос на 360px, что и у hero — короткий эквивалент
              до 640px, aria-label хранит полную формулировку */}
          <span aria-hidden="true" className="relative z-10 sm:hidden">
            Получить смету
          </span>
          <span aria-hidden="true" className="relative z-10 hidden sm:inline">
            {content.ctaLabel}
          </span>
          <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
          <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
        </button>

        <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-white/10 pt-8">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            onClick={onEmailClick}
            className="text-base text-white/70 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {CONTACT_EMAIL}
          </a>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onTelegramClick}
            className="text-base text-white/70 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Telegram
          </a>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-white/45">
          Задача не про рекламный ролик?{' '}
          <Link
            href="/services"
            onClick={onDirectionsClick}
            className="border-b border-white/25 pb-0.5 text-white/70 transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Посмотрите остальные направления
          </Link>
        </p>
      </motion.div>
    </section>
  )
}
