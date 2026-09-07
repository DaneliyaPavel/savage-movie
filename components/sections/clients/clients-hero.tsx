/**
 * Титульная карточка /clients.
 *
 * Server Component: анимация появления — чистый CSS, состояния нет.
 * Вместо обещаний в первом экране стоят проверяемые числа: сколько брендов и
 * сколько опубликованных проектов реально лежит в портфолио.
 */
import Link from 'next/link'
import { pluralRu } from '@/features/clients/mappers'

interface ClientsHeroProps {
  brandCount: number
  projectCount: number
}

export function ClientsHero({ brandCount, projectCount }: ClientsHeroProps) {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end px-5 pt-28 pb-10 sm:px-8 md:px-10 md:pt-32 md:pb-14 lg:px-16">
      <p className="client-title-reveal text-[10px] uppercase tracking-[0.4em] text-white/55 md:text-xs">
        Clients / Selected collaborations
      </p>

      <h1 className="client-title-reveal mt-6 max-w-[16ch] pb-2 font-brand-hero text-[clamp(2.75rem,9.5vw,9.5rem)] uppercase leading-[0.92] tracking-tighter text-white md:mt-8">
        Бренды в кадре.
        <span className="block text-white/45">Savage за камерой.</span>
      </h1>

      <div className="client-title-reveal mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between md:mt-14">
        <p className="max-w-md text-[15px] font-light leading-relaxed text-white/65 md:text-base">
          {brandCount} {pluralRu(brandCount, 'бренд', 'бренда', 'брендов')} и {projectCount}{' '}
          {pluralRu(projectCount, 'проект', 'проекта', 'проектов')} в открытом портфолио. Все —
          ниже, с кадром из работы.
        </p>

        <Link
          href="/projects"
          /* min-h-11 — минимальная тач-цель 44px */
          className="group inline-flex min-h-11 w-fit items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff2936]"
        >
          <span className="inline-flex items-center gap-3 border-b border-white/20 pb-1 text-[11px] uppercase tracking-[0.28em] text-white/70 transition-colors duration-200 group-hover:border-white group-hover:text-white md:text-xs">
            Все проекты
            <span
              aria-hidden="true"
              className="transition-transform duration-300 ease-out group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </Link>
      </div>
    </section>
  )
}
