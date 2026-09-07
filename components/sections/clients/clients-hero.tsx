/**
 * Титульная карточка /clients.
 *
 * Server Component: анимация появления — чистый CSS, состояния нет.
 * Анимируется только transform: с opacity:0 в нулевом кадре первый
 * отрисованный фрейм был бы пустым, а это первый экран страницы, которую
 * открывают перед обращением (тот же довод, что у .hero-reveal).
 *
 * Титр держит экран один, без картинок: это карточка перед началом ролла,
 * а материал начинается сразу под ней. Числа проверяемые — считаются из базы.
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
      {/* Три слоя титра приходят лесенкой: --title-step задаёт очередь */}
      <p
        style={{ ['--title-step' as string]: '0' }}
        className="client-title-reveal text-[10px] uppercase tracking-[0.4em] text-white/55 md:text-xs"
      >
        Clients / Selected collaborations
      </p>

      <h1
        style={{ ['--title-step' as string]: '1' }}
        /*
          Ширину не ограничиваем: max-w-[16ch] рвал фразу по случайному месту и
          оставлял висячую строку на каждом брейкпоинте. Каждое предложение —
          свой блок, перенос происходит только когда строка правда не влезает.
          Нижняя граница clamp занижена под 360px: там 44px давали четыре
          строки, и заголовок съедал экран целиком.
        */
        className="client-title-reveal mt-6 max-w-[22ch] pb-2 font-brand-hero text-[clamp(2.05rem,8.4vw,8.5rem)] uppercase leading-[0.92] tracking-tighter text-white md:mt-8"
      >
        Бренды в кадре.
        <span className="block text-white/45">Savage за камерой.</span>
      </h1>

      <div
        style={{ ['--title-step' as string]: '2' }}
        className="client-title-reveal mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between md:mt-14"
      >
        <p className="max-w-md text-[15px] font-light leading-relaxed text-white/65 md:text-base">
          {brandCount} {pluralRu(brandCount, 'бренд', 'бренда', 'брендов')} и {projectCount}{' '}
          {pluralRu(projectCount, 'проект', 'проекта', 'проектов')} в открытом портфолио.
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
