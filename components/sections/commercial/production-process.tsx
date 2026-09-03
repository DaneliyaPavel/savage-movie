/**
 * Как проходит видеопроизводство — вертикальная editorial-последовательность.
 *
 * Сознательно не шесть одинаковых карточек с иконками: этапы производства
 * не равнозначны и идут во времени, поэтому читаются как таймлайн с общей
 * линией, а не как сетка плиток.
 */
'use client'

import { motion } from 'framer-motion'

import type { ProcessContent } from '@/lib/commercial-landing/content'

interface ProductionProcessProps {
  content: ProcessContent
}

export function ProductionProcess({ content }: ProductionProcessProps) {
  return (
    <section className="border-t border-[#1A1A1A] bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-light leading-tight tracking-tight text-white md:text-5xl">
          {content.title}
        </h2>
        <p className="mt-4 text-base text-white/50 md:text-lg">{content.subtitle}</p>
      </div>

      <ol className="mt-14 border-l border-[#1A1A1A] md:mt-20">
        {content.steps.map((step, index) => (
          <motion.li
            key={step.number}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: Math.min(index, 3) * 0.05 }}
            className="relative pb-14 pl-6 last:pb-0 md:pl-12"
          >
            {/* Засечка на линии таймлайна */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-2 h-px w-4 -translate-x-px bg-accent md:w-8"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[7rem_1fr] md:gap-10">
              <span className="font-mono text-xs tracking-[0.2em] text-white/30 md:text-sm">
                {step.number}
              </span>

              <div>
                <h3 className="text-xl font-light tracking-tight text-white md:text-3xl">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50 md:text-base">
                  {step.summary}
                </p>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                  {step.items.map(item => (
                    <li key={item} className="text-sm text-white/55 md:text-base">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  )
}
