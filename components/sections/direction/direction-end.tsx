/**
 * Выход страницы направления — последнее слово перед брифом.
 *
 * Композиция: служебная строка, вопрос гигантским курсивом (последняя строка
 * красная), главная кнопка во всю ширину колонки — титровая плашка с красной
 * шторкой на ховере, — прямые контакты для тех, кому проще написать, и пустой
 * контурный бегущий титр с названием действия. Форма брифа идёт сразу ниже,
 * поэтому кнопка прокручивает на считаные пиксели.
 *
 * Кнопка — всегда белая плашка, а не «призрак»: на телефоне ховера нет, и
 * главное действие страницы не должно ждать наведения, чтобы быть видным.
 */
'use client'

import type { CSSProperties } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { TELEGRAM_URL } from '@/lib/commercial-landing/content'
import { EMAIL, EMAIL_HREF } from '@/lib/contacts'
import { cn } from '@/lib/utils'
import { useDirectionPage } from './direction-context'
import { Still } from './still'

export interface DirectionEndProps {
  /** Строки вопроса: каждая — отдельная строка набора */
  lines: string[]
  ctaLabel: string
  note?: string
  /** Кадр справа, гаснущий влево; без него — чистое поле */
  frame?: { src: string; alt: string } | null
  /** Подпись над вопросом */
  kicker?: string
}

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties

const contactClass =
  'group flex items-center justify-between gap-6 border-t border-white/15 py-4 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent md:py-5'

export function DirectionEnd({
  lines,
  ctaLabel,
  note,
  frame,
  kicker = 'Следующий шаг',
}: DirectionEndProps) {
  const page = useDirectionPage()
  const last = lines.length - 1

  return (
    <section
      id="direction-end"
      aria-labelledby="direction-end-title"
      className="relative isolate flex min-h-[92svh] flex-col justify-between overflow-hidden border-t border-white/10 bg-[#000000] px-6 pt-12 md:px-10 md:pt-16 lg:px-20"
    >
      {frame ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Still src={frame.src} alt="" sizes="100vw" quality={65} className="h-full w-full" />
          <span className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/85 to-[#000000]/25" />
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#000000] to-transparent" />
        </div>
      ) : null}

      <div
        data-reveal=""
        className="type-meta flex items-center justify-between gap-6 font-mono uppercase text-white/60"
      >
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          {kicker}
        </span>
        <span className="hidden sm:inline">Бриф · два шага</span>
      </div>

      <div className="py-14 md:py-16">
        <h2
          id="direction-end-title"
          className="font-brand-hero text-[clamp(2.6rem,9.5vw,8.5rem)] uppercase leading-[0.9] tracking-tighter text-white"
        >
          {lines.map((line, index) => (
            <span
              key={line}
              data-reveal=""
              style={delay(index * 90)}
              className={cn('block', index === last && 'text-accent')}
            >
              {line}
            </span>
          ))}
        </h2>

        <button
          type="button"
          data-reveal=""
          style={delay(lines.length * 90 + 120)}
          onClick={() => page.openBrief('end')}
          className="group relative mt-12 flex w-full max-w-4xl items-center justify-between gap-6 overflow-hidden rounded-sm bg-white px-6 py-6 text-left text-black transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:mt-14 md:px-10 md:py-9"
        >
          <span className="relative z-10 font-stage text-[clamp(1.2rem,3.3vw,2.7rem)] uppercase leading-[1.05] tracking-tight transition-colors duration-[var(--motion-move)] group-hover:text-white">
            {ctaLabel}
          </span>
          <span className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-black text-white transition-[background-color,color] duration-[var(--motion-move)] group-hover:bg-white group-hover:text-black md:h-16 md:w-16">
            <ArrowRight
              aria-hidden="true"
              className="h-5 w-5 transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:-rotate-45 md:h-6 md:w-6"
            />
          </span>
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full bg-accent transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-0"
          />
        </button>

        <div
          data-reveal=""
          style={delay(lines.length * 90 + 220)}
          className="mt-8 grid max-w-4xl gap-x-10 border-b border-white/15 sm:grid-cols-2"
        >
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackMetrikaGoal('telegram_click', { location: `${page.id}_end` })}
            className={contactClass}
          >
            <span>
              <span className="type-meta block font-mono uppercase text-white/45">Telegram</span>
              <span className="mt-1 block text-base text-white transition-colors group-hover:text-accent md:text-lg">
                Написать в мессенджер
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-white/50 transition-[transform,color] duration-[var(--motion-state)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            />
          </a>
          <a
            href={EMAIL_HREF}
            onClick={() => trackMetrikaGoal('email_click', { location: `${page.id}_end` })}
            className={cn(contactClass, 'sm:border-b-0')}
          >
            <span>
              <span className="type-meta block font-mono uppercase text-white/45">Email</span>
              <span className="mt-1 block text-base text-white transition-colors group-hover:text-accent md:text-lg">
                {EMAIL}
              </span>
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-white/50 transition-[transform,color] duration-[var(--motion-state)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
            />
          </a>
        </div>

        {note ? (
          <p
            data-reveal=""
            style={delay(lines.length * 90 + 300)}
            className="mt-6 max-w-lg text-sm leading-relaxed text-white/55 md:text-base"
          >
            {note}
          </p>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none -mx-6 select-none overflow-hidden whitespace-nowrap pb-2 md:-mx-10 lg:-mx-20"
      >
        <div className="dir-end-marquee flex w-max">
          {[0, 1].map(half => (
            <span
              key={half}
              className="dir-outline flex shrink-0 font-stage text-[clamp(4.5rem,15vw,14rem)] uppercase leading-[0.95] opacity-45"
            >
              {[0, 1].map(repeat => (
                <span key={repeat} className="pr-[0.5em]">
                  {ctaLabel}
                  <span className="px-[0.35em] text-accent/60">/</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
