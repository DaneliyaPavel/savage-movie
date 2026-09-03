/**
 * Вопросы о создании рекламных роликов.
 *
 * Нативные details/summary, а не JS-аккордеон: ответы лежат в DOM целиком
 * и читаются без исполнения скриптов, раскрытие работает с клавиатуры
 * из коробки, а поиск видит текст независимо от гидратации.
 *
 * Ответы написаны для человека, а не под rich snippet: конкретные диапазоны
 * и честное «срок зависит от сложности» вместо универсальных «от трёх дней».
 */
'use client'

import { ChevronDown } from 'lucide-react'

import type { FaqContent } from '@/lib/commercial-landing/content'

interface CommercialFaqProps {
  content: FaqContent
}

export function CommercialFaq({ content }: CommercialFaqProps) {
  return (
    <section className="border-t border-[#1A1A1A] bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20">
      <h2 className="max-w-3xl text-3xl font-light leading-tight tracking-tight text-white md:text-5xl">
        {content.title}
      </h2>

      <div className="mt-12 max-w-3xl md:mt-16">
        {content.items.map(item => (
          <details
            key={item.question}
            className="group border-b border-[#1A1A1A] py-6 first:border-t"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-light text-white marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-xl">
              <h3 className="text-inherit font-inherit">{item.question}</h3>
              <ChevronDown
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 group-open:rotate-180"
              />
            </summary>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
