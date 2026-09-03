/**
 * Сколько стоит рекламный ролик.
 *
 * Блок обязательный: человек, который ищет «стоимость рекламного ролика»,
 * не должен уходить со страницы за этой цифрой. При этом это не калькулятор —
 * точную сумму по трём кликам обещать нечестно, поэтому показываем три
 * диапазона и выделяем тот, в который реально попадает большинство проектов.
 *
 * Цифры совпадают со статьёй /blog/skolko-stoit-reklamnyj-rolik: сайт не
 * должен противоречить сам себе.
 */
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import type { PricingContent } from '@/lib/commercial-landing/content'
import { cn } from '@/lib/utils'

interface PricingBandsProps {
  content: PricingContent
  onEstimateClick: () => void
  onArticleClick: () => void
}

export function PricingBands({ content, onEstimateClick, onArticleClick }: PricingBandsProps) {
  return (
    <section
      id="commercial-pricing"
      className="scroll-mt-24 border-t border-[#1A1A1A] bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="max-w-3xl">
        <h2 className="text-3xl font-light leading-tight tracking-tight text-white md:text-5xl">
          {content.title}
        </h2>
        <p className="mt-4 text-base text-white/50 md:text-lg">{content.subtitle}</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-px bg-[#1A1A1A] md:mt-16 lg:grid-cols-3">
        {content.tiers.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: Math.min(index, 2) * 0.07 }}
            className={cn(
              'flex flex-col p-7 md:p-9',
              tier.highlight ? 'bg-[#0D0D0D] ring-1 ring-inset ring-accent/40' : 'bg-[#050505]'
            )}
          >
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
              {tier.name}
            </p>
            <p
              className={cn(
                'mt-4 text-2xl font-light tracking-tight md:text-3xl',
                tier.highlight ? 'text-accent' : 'text-white'
              )}
            >
              {tier.range}
            </p>

            <p className="mt-5 text-sm leading-relaxed text-white/50">{tier.summary}</p>

            <ul className="mt-6 space-y-2.5">
              {tier.items.map(item => (
                <li key={item} className="flex gap-3 text-sm text-white/60">
                  <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-white/25" />
                  {item}
                </li>
              ))}
            </ul>

            {tier.note ? (
              <p className="mt-7 border-t border-white/10 pt-5 text-sm leading-relaxed text-white/70">
                {tier.note}
              </p>
            ) : null}
          </motion.div>
        ))}
      </div>

      <p className="mt-10 max-w-3xl text-sm leading-relaxed text-white/50 md:text-base">
        {content.footnote}
      </p>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
        <button
          type="button"
          onClick={onEstimateClick}
          className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span className="relative z-10">{content.ctaLabel}</span>
          <ArrowRight className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" />
          <span className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-500 group-hover:translate-x-0" />
        </button>

        <Link
          href={content.articleHref}
          onClick={onArticleClick}
          className="inline-flex items-center gap-2 text-base text-white/60 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span className="border-b border-white/25 pb-0.5">{content.articleLabel}</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
