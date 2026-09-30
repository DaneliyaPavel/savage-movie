/**
 * Вопросы направления. Нативные details/summary: ответы лежат в DOM целиком,
 * раскрытие работает с клавиатуры и без скриптов, поиск видит текст сразу.
 * Тот же текст уходит в FAQPage — разметка описывает только то, что видно.
 */
import { ChevronDown } from 'lucide-react'

import type { FaqItem } from '@/lib/services/pages/types'

export interface DirectionFaqProps {
  title: string
  items: FaqItem[]
  /** Номер раздела в техническом ряду: «07» */
  index?: string
}

export function DirectionFaq({ title, items, index }: DirectionFaqProps) {
  return (
    <section
      aria-labelledby="direction-faq-title"
      className="border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          {index ? (
            <p className="type-meta font-mono uppercase text-white/50">{index} / Вопросы</p>
          ) : null}
          <h2
            id="direction-faq-title"
            data-reveal=""
            className="mt-4 font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
          >
            {title}
          </h2>
        </div>

        <div className="lg:col-span-8">
          {items.map(item => (
            <details
              key={item.question}
              className="group border-b border-white/10 py-6 first:border-t"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-light text-white marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-xl">
                <h3 className="text-inherit font-inherit">{item.question}</h3>
                <ChevronDown
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-white/40 transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-open:rotate-180"
                />
              </summary>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
