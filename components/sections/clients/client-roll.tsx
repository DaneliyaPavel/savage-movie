/**
 * Живые титры: список брендов, где каждая строка раскрывается кадром из работы.
 *
 * Раскрытие привязано к прокрутке, а не к ховеру: IntersectionObserver ставит
 * data-focus="true" строке, которая проходит через центр экрана. Ховер и фокус
 * с клавиатуры дают то же состояние поверх. Так страница показывает портфолио
 * и тому, кто скроллит колесом не двигая курсор, и на тач-устройствах, где
 * ховера нет вовсе. Сама анимация живёт в globals.css (.client-roll-*).
 *
 * Видео на странице нет сознательно: шестнадцать одновременных превью — это
 * мегабайты трафика и просадка FPS ради эффекта, который стилл передаёт не хуже.
 */
'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { pluralRu, type ClientRollEntry } from '@/features/clients/mappers'

/*
 * Кадр намеренно запрашивается уже, чем строка, в которой лежит. Полоса высотой
 * около 110 px, обрезанная по object-cover и накрытая затемнением, не отличима
 * от растянутой: 60vw вместо 100vw экономит примерно половину байтов ролла.
 */
const STILL_SIZES = '(min-width: 768px) 60vw, 100vw'

/** Строка ролла, которая сейчас в центре экрана, раскрывает свой кадр */
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
  const meta = [primary?.categoryLabel, primary?.year ? String(primary.year) : null].filter(Boolean)
  const extraProjects = entry.projects.length - 1

  return (
    <>
      {primary?.still && (
        <div className="client-roll-still absolute inset-0 overflow-hidden" aria-hidden="true">
          <Image
            src={primary.still}
            alt=""
            fill
            sizes={STILL_SIZES}
            quality={50}
            /*
             * На узком экране строка — сильно вытянутая полоса, и кадр,
             * обрезанный по центру, режет лица пополам: сюжет у стилла обычно
             * в верхней трети. Сдвигаем точку кадрирования вверх; на десктопе
             * полоса шире и центр работает нормально.
             */
            className="object-cover object-[center_38%] md:object-center"
          />
          <div className="client-roll-scrim" />
        </div>
      )}

      <div className="relative flex items-baseline gap-4 px-5 py-8 sm:px-8 md:grid md:grid-cols-12 md:items-center md:gap-6 md:px-10 md:py-9 lg:px-16">
        <span
          className="client-roll-index shrink-0 text-base text-white/40 md:col-span-1 md:text-xl"
          style={{ fontFamily: 'var(--font-handwritten), cursive' }}
          aria-hidden="true"
        >
          # {String(index + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1 md:col-span-7">
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
            <h3 className="client-roll-name font-brand-hero text-[clamp(1.6rem,7vw,2.4rem)] uppercase leading-[0.95] tracking-tighter text-white/75 md:text-[clamp(2rem,4.4vw,4rem)]">
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

        {/* Метаданные в одну строку: у двух проектов в CMS не проставлен год,
            и в две строки ролл получал рваный ритм на ровном месте */}
        <div className="flex shrink-0 flex-wrap justify-end gap-x-3 text-[10px] uppercase tracking-[0.22em] text-white/70 md:col-span-2 md:justify-start md:text-[11px]">
          {meta.map(item => (
            <span key={item}>{item}</span>
          ))}
          {extraProjects > 0 && (
            <span className="text-white/55">
              +{extraProjects} {pluralRu(extraProjects, 'проект', 'проекта', 'проектов')}
            </span>
          )}
        </div>

        <span
          className="client-roll-cue hidden items-center gap-2 justify-self-end whitespace-nowrap text-[11px] uppercase tracking-[0.22em] text-white md:col-span-2 md:inline-flex"
          aria-hidden="true"
        >
          Смотреть проект
          <span>→</span>
        </span>
      </div>
    </>
  )
}

export function ClientRoll({
  entries,
  yearRange,
}: {
  entries: ClientRollEntry[]
  yearRange: string | null
}) {
  const reduceMotion = useReducedMotion() ?? false
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
      <div className="flex items-baseline justify-between gap-4 px-5 pt-10 pb-4 sm:px-8 md:px-10 md:pt-14 lg:px-16">
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
          <motion.li
            key={entry.id}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="border-b border-white/10"
          >
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
          </motion.li>
        ))}
      </ul>
    </section>
  )
}
