/**
 * Титульная карточка /clients.
 *
 * Server Component: анимация появления — чистый CSS, состояния нет.
 *
 * Справа от титра идёт лидер плёнки: несколько кадров из ролла, приглушённых
 * до фона. Раньше правое поле было просто пустым, и первый экран страницы
 * студии видеопродакшна не содержал ни одного кадра. Лидер закрывает эту дыру
 * работой, а не декорацией, продолжает язык главной (титр поверх материала)
 * и вводит ту же метафору окна, на которой построен ролл ниже.
 *
 * Числа в первом экране проверяемые: считаются из базы, не округляются.
 */
import Image from 'next/image'
import Link from 'next/link'
import { pluralRu } from '@/features/clients/mappers'

interface ClientsHeroProps {
  brandCount: number
  projectCount: number
  /** Первые кадры ролла: лидер плёнки в правом поле титра */
  leader: Array<{ id: string; still: string; name: string }>
}

export function ClientsHero({ brandCount, projectCount, leader }: ClientsHeroProps) {
  const frames = leader.slice(0, 3)

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end px-5 pt-28 pb-10 sm:px-8 md:px-10 md:pt-32 md:pb-14 lg:px-16">
      <div className="grid items-end gap-10 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="client-title-reveal relative text-[10px] uppercase tracking-[0.4em] text-white/55 md:text-xs">
            Clients / Selected collaborations
          </p>

          <h1 className="client-title-reveal relative mt-6 max-w-[16ch] pb-2 font-brand-hero text-[clamp(2.75rem,8.2vw,8rem)] uppercase leading-[0.92] tracking-tighter text-white md:mt-8">
            Бренды в кадре.
            <span className="block text-white/45">Savage за камерой.</span>
          </h1>

          {/* Мобильный лидер: работа должна попадать и в первый экран телефона */}
          {frames.length > 0 && (
            <div aria-hidden="true" className="client-title-reveal mt-8 flex gap-2 md:hidden">
              {frames.slice(0, 3).map(frame => (
                <div
                  key={frame.id}
                  className="relative aspect-video flex-1 overflow-hidden border border-white/[0.07]"
                >
                  <Image
                    src={frame.still}
                    alt=""
                    fill
                    sizes="33vw"
                    quality={55}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/45" />
                </div>
              ))}
            </div>
          )}

          <div className="client-title-reveal relative mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between md:mt-14">
            <p className="max-w-md text-[15px] font-light leading-relaxed text-white/65 md:text-base">
              {brandCount} {pluralRu(brandCount, 'бренд', 'бренда', 'брендов')} и {projectCount}{' '}
              {pluralRu(projectCount, 'проект', 'проекта', 'проектов')} в открытом портфолио. Все
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
        </div>

        {/* Лидер плёнки: кадры из ролла ниже. Правое поле титра раньше пустовало,
          и первый экран страницы студии видеопродакшна не содержал ни одного
          кадра. Здесь его закрывает работа, а не декорация. */}
        {frames.length > 0 && (
          <div aria-hidden="true" className="hidden gap-3 md:col-span-3 md:col-start-10 md:grid">
            {frames.map((frame, index) => (
              <div
                key={frame.id}
                className="client-leader-frame relative aspect-video w-full overflow-hidden border border-white/[0.07]"
                style={{ ['--leader-index' as string]: String(index) }}
              >
                <Image
                  src={frame.still}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 24vw, 0px"
                  quality={65}
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
