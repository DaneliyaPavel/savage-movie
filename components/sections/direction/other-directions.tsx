/**
 * Соседние направления: обычные ссылки в разметке первого ответа.
 *
 * Человеку, попавшему не на свою страницу, нужен выход в свою территорию; поиску
 * — внутренние ссылки между страницами одного кластера. Ссылки ставятся только
 * на опубликованные страницы.
 */
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import {
  SERVICES_PATH,
  SERVICE_DIRECTIONS,
  type ServiceDirectionId,
} from '@/lib/services/directions'

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
      className="border-t border-white/10 bg-[#000000] px-6 py-16 md:px-10 md:py-20 lg:px-20"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <p className="type-meta font-mono uppercase text-white/50">Другие направления</p>
        <Link
          href={SERVICES_PATH}
          className="type-meta font-mono uppercase text-white/70 underline underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Все семь направлений
        </Link>
      </div>

      <ul className="mt-8 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
        {others.map(direction => (
          <li key={direction.id} className="border-t border-white/10">
            <Link
              href={direction.route.path}
              className="group flex items-baseline justify-between gap-4 py-5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
            >
              <span>
                <span className="type-meta block font-mono uppercase text-white/40">
                  {direction.index}
                </span>
                <span className="mt-1 block text-lg font-light text-white transition-colors group-hover:text-accent md:text-xl">
                  {direction.title}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-white/40 transition-[transform,color] duration-[var(--motion-state)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
              />
            </Link>
          </li>
        ))}
      </ul>

      {reading && reading.length > 0 ? (
        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="type-meta font-mono uppercase text-white/50">Читать в блоге</p>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {reading.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-white/65 underline underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-base"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  )
}
