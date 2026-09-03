/**
 * Коммерческие кейсы: не showreel, а конкретные задачи брендов.
 *
 * У каждой карточки, кроме названия, есть бизнес-контекст — отрасль, формат
 * и площадки. Без него «MAVIN / Small Joys» ничего не сообщает человеку,
 * который пришёл из поиска по запросу «заказать рекламный ролик».
 *
 * Видео стартует по наведению на десктопе и не грузится вовсе, пока карточка
 * не подошла к вьюпорту: четыре потока при первом рендере убили бы LCP.
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import type { CasesContent } from '@/lib/commercial-landing/content'
import { LazyHlsVideo } from './lazy-hls-video'

export interface CommercialCase {
  slug: string
  title: string
  client: string
  year: string
  playbackId: string | null
  posterUrl: string | null
  kind: string
  meta: string
}

interface CommercialCasesProps {
  content: CasesContent
  cases: CommercialCase[]
  onCaseOpen: (slug: string) => void
  onVideoMilestone: (milestone: 'start' | 'half' | 'complete', slug: string) => void
}

export function CommercialCases({
  content,
  cases,
  onCaseOpen,
  onVideoMilestone,
}: CommercialCasesProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  if (cases.length === 0) return null

  return (
    <section
      id="commercial-cases"
      className="scroll-mt-24 border-t border-[#1A1A1A] bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="max-w-3xl">
        <h2 className="text-3xl font-light leading-tight tracking-tight text-white md:text-5xl">
          {content.title}
        </h2>
        <p className="mt-4 text-base text-white/50 md:text-lg">{content.subtitle}</p>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/45 md:text-base">
          {content.intro}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-16 md:grid-cols-2">
        {cases.map((item, index) => (
          <motion.article
            key={item.slug}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: Math.min(index, 2) * 0.08 }}
          >
            <Link
              href={`/projects/${item.slug}`}
              onClick={() => onCaseOpen(item.slug)}
              onMouseEnter={() => setHovered(item.slug)}
              onMouseLeave={() => setHovered(current => (current === item.slug ? null : current))}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {/* Медиа занимает основную площадь карточки */}
              <div className="relative overflow-hidden bg-[#0A0A0A]">
                {item.playbackId ? (
                  <LazyHlsVideo
                    playbackId={item.playbackId}
                    poster={item.posterUrl}
                    loop
                    autoPlay={hovered === item.slug}
                    aspect="16 / 9"
                    title={`${item.client} — ${item.title}`}
                    onProgressMilestone={milestone => onVideoMilestone(milestone, item.slug)}
                  />
                ) : (
                  <div className="aspect-video w-full bg-[#0A0A0A]" />
                )}

                {/* Подпись поверх кадра появляется на десктопе при наведении;
                    на тач-устройствах она всегда видна ниже, под карточкой */}
                <div className="pointer-events-none absolute inset-0 hidden items-end bg-gradient-to-t from-black/85 via-black/10 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
                  <span className="inline-flex items-center gap-2 text-sm text-white">
                    {content.ctaLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-xl font-light tracking-tight text-white md:text-2xl">
                    {item.client}
                    <span className="text-white/40"> — {item.title}</span>
                  </h3>
                  <span className="shrink-0 font-mono text-xs text-white/30">{item.year}</span>
                </div>
                <p className="mt-2 text-sm text-white/60">{item.kind}</p>
                <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-white/35">
                  {item.meta}
                </p>
              </div>
            </Link>
          </motion.article>
        ))}
      </div>

      <Link
        href="/projects"
        className="mt-14 inline-flex items-center gap-2 text-base text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <span className="border-b border-white/25 pb-0.5">{content.allProjectsLabel}</span>
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </section>
  )
}
