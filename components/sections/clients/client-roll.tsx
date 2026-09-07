/**
 * Живые титры: каждая строка — кредит бренда со своим окном кадра.
 *
 * Строка, проходящая через центр экрана, получает data-focus="true" от
 * IntersectionObserver и зажигает свой кадр. На десктопе кадр живёт в
 * отдельном окне справа, поэтому под ним не лежит текст — и затемнение,
 * которое раньше давило картинку до серой мути, больше не нужно. Колонка
 * пустых окон с одним горящим читается как плёнка, идущая через проектор.
 *
 * На узком экране окна нет: там кадр становится подложкой всей строки, и
 * затемнение возвращается, потому что имя бренда лежит прямо на нём.
 *
 * Появление строки при скролле намеренно не анимируется прозрачностью:
 * framer-motion выставляет initial={{opacity:0}} инлайном ещё на SSR, и вся
 * стена клиентов оказывалась невидимой на первом отрисованном кадре, до
 * гидратации. Для страницы, которую открывают ради доказательства, это
 * недопустимо (тот же довод, что в комментарии к .hero-reveal в globals.css).
 */
'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { pluralRu, type ClientRollEntry } from '@/features/clients/mappers'

/* Окно кадра на десктопе не шире 290px, на мобильном кадр во всю строку */
const STILL_SIZES = '(min-width: 768px) 290px, 100vw'

/** Строка ролла, которая сейчас в центре экрана, зажигает свой кадр */
function useScrollFocus(count: number) {
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list || typeof IntersectionObserver === 'undefined') return

    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-roll-row]'))
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const row = entry.target as HTMLElement
          row.dataset.focus = entry.isIntersecting ? 'true' : 'false'
        }
      },
      // Узкая полоса по центру вьюпорта: кадр «проходит через окно проектора»
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    )

    rows.forEach(row => observer.observe(row))
    return () => observer.disconnect()
  }, [count])

  return listRef
}

function RowBody({ entry, index }: { entry: ClientRollEntry; index: number }) {
  const primary = entry.primary
  const extraProjects = entry.projects.length - 1

  return (
    <div className="relative flex items-center gap-5 px-5 py-9 sm:px-8 md:gap-8 md:px-10 md:py-5 lg:px-16">
      <span
        className="client-roll-index relative z-[1] w-9 shrink-0 text-base text-white/40 md:w-12 md:text-xl"
        style={{ fontFamily: 'var(--font-handwritten), cursive' }}
        aria-hidden="true"
      >
        # {String(index + 1).padStart(2, '0')}
      </span>

      <div className="relative z-[1] min-w-0 flex-1 md:order-none">
        {/* Логотип показываем, только если он заведён в CMS. Своих версий чужих
            логотипов мы не рисуем: вордмарк набором честнее подделки.
            Приводим к белому, иначе разнобой фирменных цветов рассыпает ролл. */}
        {entry.logoUrl ? (
          <h3 className="client-roll-name relative h-8 w-40 md:h-12 md:w-56">
            {/* Доступное имя даёт sr-only ниже: alt на картинке продублировал бы его */}
            <Image
              src={entry.logoUrl}
              alt=""
              fill
              sizes="224px"
              className="client-roll-logo object-contain object-left brightness-0 invert"
            />
            <span className="sr-only">{entry.name}</span>
          </h3>
        ) : (
          <h3 className="client-roll-name font-brand-hero text-[clamp(1.6rem,7vw,2.4rem)] uppercase leading-[0.95] tracking-tighter text-white/75 md:text-[clamp(2rem,4.2vw,3.6rem)]">
            {entry.name}
          </h3>
        )}
        {/* Описание из CMS показываем только у брендов без проекта: у остальных
            его работу делают категория, год и сам кадр */}
        {!primary && entry.note && (
          <p className="mt-1.5 max-w-prose text-[13px] font-light leading-snug text-white/60">
            {entry.note}
          </p>
        )}
      </div>

      {/*
        Один <Image> на оба сценария: на мобильном контейнер разворачивается в
        подложку строки, на десктопе становится окном кадра в потоке.
      */}
      {primary?.still && (
        /* Окно кадра видно всегда, проявляется только картинка внутри:
           колонка пустых окон с одним горящим и делает из списка плёнку */
        <div
          className="client-roll-frame absolute inset-0 md:relative md:inset-auto md:aspect-video md:w-[clamp(190px,17vw,290px)] md:shrink-0 md:border md:border-white/[0.09]"
          aria-hidden="true"
        >
          <div className="client-roll-still absolute inset-0 overflow-hidden">
            <Image
              src={primary.still}
              alt=""
              fill
              sizes={STILL_SIZES}
              quality={65}
              /*
               * На узком экране строка — вытянутая полоса, и кадр, обрезанный по
               * центру, режет лица: сюжет у стилла обычно в верхней трети.
               * В окне на десктопе пропорция правильная, центр работает.
               */
              className="object-cover object-[center_38%] md:object-center"
            />
            {/* Затемнение нужно только там, где на кадре лежит текст */}
            <div className="client-roll-scrim md:hidden" />
          </div>
        </div>
      )}

      <div className="relative z-[1] flex shrink-0 flex-col items-end gap-1 text-[10px] uppercase tracking-[0.22em] text-white/70 md:w-[clamp(96px,9vw,132px)] md:items-start md:text-[11px]">
        {primary?.categoryLabel && <span>{primary.categoryLabel}</span>}
        {primary?.year && <span className="text-white/55">{primary.year}</span>}
        {extraProjects > 0 && (
          <span className="text-white/55">
            +{extraProjects} {pluralRu(extraProjects, 'проект', 'проекта', 'проектов')}
          </span>
        )}
        {primary && (
          <span className="client-roll-cue hidden whitespace-nowrap pt-1 text-white md:block">
            Смотреть →
          </span>
        )}
      </div>
    </div>
  )
}

export function ClientRoll({
  entries,
  yearRange,
}: {
  entries: ClientRollEntry[]
  yearRange: string | null
}) {
  const listRef = useScrollFocus(entries.length)

  if (entries.length === 0) {
    return (
      <section className="px-5 py-24 sm:px-8 md:px-10 lg:px-16">
        <h2 className="text-[11px] uppercase tracking-[0.35em] text-white/55">В кадре</h2>
        <p className="mt-6 max-w-lg text-lg font-light text-white/65">
          Портфолио сейчас недоступно. Работы можно посмотреть в разделе{' '}
          <Link href="/projects" className="text-white underline underline-offset-4">
            проекты
          </Link>
          .
        </p>
      </section>
    )
  }

  return (
    <section className="client-roll border-t border-white/10">
      <div className="flex items-baseline justify-between gap-4 px-5 pt-8 pb-4 sm:px-8 md:px-10 md:pt-10 lg:px-16">
        <h2 className="text-[11px] uppercase tracking-[0.35em] text-white/55">В кадре</h2>
        {yearRange && (
          <span className="text-[11px] uppercase tracking-[0.35em] text-white/55">{yearRange}</span>
        )}
        {/* Ролл — шестнадцать ссылок подряд. Без этого обхода клавиатурой
            до кейсов ниже пришлось бы идти шестнадцатью табами */}
        <a
          href="#cases"
          className="sr-only text-[11px] uppercase tracking-[0.28em] text-white underline underline-offset-4 focus:not-sr-only focus:static focus:h-auto focus:w-auto"
        >
          Пропустить список брендов
        </a>
      </div>

      <ul ref={listRef} className="border-t border-white/10">
        {entries.map((entry, index) => (
          <li key={entry.id} className="border-b border-white/10">
            {entry.primary ? (
              <Link
                href={`/projects/${entry.primary.slug}`}
                data-roll-row=""
                aria-label={`${entry.name}: открыть проект «${entry.primary.title}»`}
                onClick={() =>
                  trackMetrikaGoal('clients_project_click', {
                    client: entry.name,
                    project_slug: entry.primary?.slug ?? '',
                    source: 'wall',
                  })
                }
                className="client-roll-row relative block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ff2936]"
              >
                <RowBody entry={entry} index={index} />
              </Link>
            ) : (
              /* Бренд без опубликованного проекта: строка остаётся доказательством
                 работы, но не притворяется ссылкой — вести некуда */
              <div data-roll-row="" className="client-roll-row relative block">
                <RowBody entry={entry} index={index} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
