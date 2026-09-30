/**
 * Работы направления как титры: строка — проект, кадр открывается по наведению
 * и фокусу (тот же жест, что в ролле /clients). На телефоне кадр стоит
 * под строкой постоянно — наведения там нет.
 */
'use client'

import Link from 'next/link'

import { cn } from '@/lib/utils'
import { firstSentence, type DirectionPageWork } from '@/lib/services/pages/resolve'
import { useDirectionPage } from './direction-context'
import { Still } from './still'

export interface DirectionCreditsProps {
  title: string
  works: DirectionPageWork[]
  index?: string
  /** Подпись справа над списком: что объединяет работы */
  note?: string
}

const excerpt = (work: DirectionPageWork) => firstSentence(work.description)

export function DirectionCredits({ title, works, index, note }: DirectionCreditsProps) {
  const page = useDirectionPage()
  if (works.length === 0) return null

  return (
    <section
      aria-labelledby="direction-credits-title"
      className="border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b border-white/15 pb-5">
        <div>
          {index ? (
            <p className="type-meta font-mono uppercase text-white/50">{index} / Работы</p>
          ) : null}
          <h2
            id="direction-credits-title"
            data-reveal=""
            className="mt-4 font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
          >
            {title}
          </h2>
        </div>
        {note ? (
          <p className="type-meta max-w-xs font-mono uppercase leading-relaxed text-white/45">
            {note}
          </p>
        ) : null}
      </div>

      <ul>
        {works.map((work, position) => (
          <li key={work.slug} className="border-b border-white/10">
            <Link
              href={`/projects/${work.slug}`}
              prefetch={false}
              onClick={() => page.openCase(work.slug)}
              className="group relative grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-4 py-7 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent md:grid-cols-[4rem_1fr_12rem] md:py-9"
            >
              <span className="type-meta font-mono uppercase text-white/45 transition-colors duration-[var(--motion-state)] group-hover:text-accent group-focus-visible:text-accent">
                {String(position + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className="block font-stage text-[clamp(1.5rem,4.6vw,3.6rem)] uppercase leading-[0.95] tracking-[-0.02em] text-white transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-2 group-focus-visible:translate-x-2 motion-reduce:transition-none">
                  {work.client}
                </span>
                <span className="mt-2 block text-sm text-white/70 md:text-base">{work.title}</span>
                {excerpt(work) ? (
                  <span className="mt-2 hidden max-w-xl text-sm leading-relaxed text-white/45 md:block">
                    {excerpt(work)}
                  </span>
                ) : null}
              </span>
              <span className="type-meta col-start-2 font-mono uppercase text-white/45 md:col-start-auto md:text-right">
                {work.year ?? ' '}
              </span>

              {work.posterUrl ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'col-span-2 block md:col-span-1',
                    // Десктоп: кадр вылетает справа по hover через clip-path
                    'md:pointer-events-none md:absolute md:right-[12rem] md:top-1/2 md:z-10 md:w-[22rem] md:-translate-y-1/2',
                    'md:[clip-path:inset(0_0_0_100%)] md:transition-[clip-path] md:duration-[var(--motion-move)] md:ease-[var(--ease-out-expo)]',
                    'md:group-hover:[clip-path:inset(0)] md:group-focus-visible:[clip-path:inset(0)]',
                    'motion-reduce:md:transition-none'
                  )}
                >
                  <Still
                    src={work.posterUrl}
                    alt=""
                    sizes="(min-width: 768px) 22rem, 100vw"
                    quality={65}
                    className="aspect-video w-full"
                  />
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
