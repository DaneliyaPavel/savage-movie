/**
 * Соседние направления: обычные ссылки в разметке первого ответа.
 *
 * Человеку, попавшему не на свою страницу, нужен выход в свою территорию; поиску
 * — внутренние ссылки между страницами одного кластера. Ссылки ставятся только
 * на опубликованные страницы.
 *
 * Каждая ссылка — плашка с красной шторкой: наведение, фокус и нажатие дают
 * одно и то же состояние, поэтому на телефоне отклик есть при касании.
 */
import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import {
  SERVICES_PATH,
  SERVICE_DIRECTIONS,
  type ServiceDirectionId,
} from '@/lib/services/directions'
import { KIT_KICKER, typo } from './direction-kit'

import './direction-kit.css'

export interface OtherDirectionsProps {
  current: ServiceDirectionId
  /** Статьи блога по теме направления: внутренние ссылки для читателя и поиска */
  reading?: { href: string; label: string }[]
}

export function OtherDirections({ current, reading }: OtherDirectionsProps) {
  const others = SERVICE_DIRECTIONS.filter(
    direction => direction.id !== current && direction.route.published
  )

  return (
    <nav
      aria-label="Другие направления"
      className="border-t border-white/10 bg-[#000000] px-6 py-16 md:px-10 md:py-24 lg:px-20"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <p className={KIT_KICKER}>
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          Другие направления
        </p>
        <Link
          href={SERVICES_PATH}
          className="group type-meta inline-flex items-center gap-2.5 font-mono uppercase text-white underline decoration-white/30 underline-offset-[6px] transition-colors duration-[var(--motion-state)] hover:text-accent hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Все семь направлений
          <ArrowRight
            aria-hidden="true"
            className="h-3.5 w-3.5 transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-1 motion-reduce:transition-none"
          />
        </Link>
      </div>

      <ul role="list" className="mt-8 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {others.map(direction => (
          <li key={direction.id} className="flex border-t border-white/10">
            <Link
              href={direction.route.path}
              className="dir-kit-dir group flex min-h-[6.75rem] w-full flex-col justify-between gap-5 px-4 py-4 md:min-h-[10rem] md:px-5 md:py-6"
            >
              <span aria-hidden="true" className="dir-kit-dir-curtain" />
              <span className="flex items-start justify-between gap-4">
                <span className="dir-kit-dir-idx type-meta font-mono uppercase tabular-nums">
                  {direction.index}
                </span>
                <span
                  aria-hidden="true"
                  className="dir-kit-dir-ring grid h-10 w-10 shrink-0 place-items-center rounded-full text-white md:h-11 md:w-11"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </span>
              <span className="dir-kit-dir-name font-stage text-[clamp(1.1rem,1.9vw,1.55rem)] uppercase leading-[1.05] tracking-[-0.01em] text-white [text-wrap:balance]">
                {typo(direction.title)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {reading && reading.length > 0 ? (
        <div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-7 md:flex-row md:items-baseline md:gap-10">
          <p className="type-meta shrink-0 font-mono uppercase text-white/60">Читать в блоге</p>
          <ul role="list" className="flex flex-wrap gap-x-8 gap-y-3">
            {reading.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-white/75 underline decoration-white/25 underline-offset-[6px] transition-colors duration-[var(--motion-state)] hover:text-accent hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-base"
                >
                  {typo(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  )
}
