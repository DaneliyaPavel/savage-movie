/**
 * Выход страницы направления: вопрос крупным курсивом, главная кнопка и прямые
 * контакты для тех, кому проще написать, чем заполнять форму.
 */
'use client'

import { ArrowRight } from 'lucide-react'

import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { TELEGRAM_URL } from '@/lib/commercial-landing/content'
import { EMAIL, EMAIL_HREF } from '@/lib/contacts'
import { useDirectionPage } from './direction-context'
import { Still } from './still'

export interface DirectionEndProps {
  /** Строки вопроса: каждая — отдельная строка набора */
  lines: string[]
  ctaLabel: string
  note?: string
  /** Кадр справа, гаснущий влево; без него — чистое поле */
  frame?: { src: string; alt: string } | null
}

export function DirectionEnd({ lines, ctaLabel, note, frame }: DirectionEndProps) {
  const page = useDirectionPage()

  return (
    <section
      aria-labelledby="direction-end-title"
      className="relative flex min-h-[80svh] flex-col justify-center overflow-hidden border-t border-white/10 bg-[#000000] px-6 py-24 md:px-10 lg:px-20"
    >
      {frame ? (
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <Still src={frame.src} alt="" sizes="100vw" quality={65} className="h-full w-full" />
          <span className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/85 to-[#000000]/20" />
        </div>
      ) : null}

      <div className="relative z-10 max-w-4xl">
        <h2
          id="direction-end-title"
          data-reveal=""
          className="font-brand-hero text-[clamp(2.2rem,7.5vw,6rem)] uppercase leading-[0.92] tracking-tighter text-white"
        >
          {lines.map(line => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>

        <div className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => page.openBrief('end')}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-white px-8 py-4 text-base font-medium text-black transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <span className="relative z-10 transition-colors duration-[var(--motion-move)] group-hover:text-white">
              {ctaLabel}
            </span>
            <ArrowRight className="relative z-10 h-4 w-4 transition-[transform,color] duration-[var(--motion-move)] group-hover:translate-x-1 group-hover:text-white" />
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-0"
            />
          </button>

          <div className="type-meta flex flex-wrap gap-x-6 gap-y-2 font-mono uppercase text-white/60">
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackMetrikaGoal('telegram_click', { location: `${page.id}_end` })}
              className="underline underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              Telegram
            </a>
            <a
              href={EMAIL_HREF}
              onClick={() => trackMetrikaGoal('email_click', { location: `${page.id}_end` })}
              className="underline underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              {EMAIL}
            </a>
          </div>
        </div>

        {note ? (
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/50">{note}</p>
        ) : null}
      </div>
    </section>
  )
}
