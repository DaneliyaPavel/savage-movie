'use client'

import Link from 'next/link'

import { directionHref } from '@/lib/services/directions'
import type { ResolvedDirection } from '@/lib/services/proof'
import { cn } from '@/lib/utils'

/**
 * Спецификация направлений — рациональный слой под монтажом.
 *
 * Верхний слой страницы сознательно почти бессловесный: там работает кадр.
 * Но поиску и человеку, который принимает решение головой, а не глазами,
 * нужен текст — что именно снимаем, где, чем доказываем и от какой суммы
 * считается. Этот слой и несёт его.
 *
 * Он не превращается в обычный SEO-хвост: те же моноширинные пометки,
 * те же линии в 1px, ни одной карточки и ни одной иконки. Просто здесь
 * страница говорит, а не показывает.
 *
 * Отдельно перечислен состав выдачи регулярного продакшна: на экране он
 * живёт долями монтажного листа, которых до конца сцены ещё нет в раскладке,
 * и текстом он должен существовать всегда.
 */

/** Во что превращается одна смена. Тот же порядок, что на монтажном листе */
const DELIVERABLES = 'HERO · 9:16 · 9:16 · LOOP · PRODUCT · STORY · WEBSITE · RETAIL'

export interface ServicesSpecProps {
  directions: readonly ResolvedDirection[]
  onCaseOpen: (direction: ResolvedDirection, slug: string) => void
  onNavigate: (direction: ResolvedDirection) => void
}

export function ServicesSpec({ directions, onCaseOpen, onNavigate }: ServicesSpecProps) {
  return (
    <section
      aria-labelledby="services-spec-title"
      className="border-t border-[#1A1A1A] bg-[#0D0D0D] px-6 py-20 text-white md:px-10 md:py-24 lg:px-20"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-white/15 pb-4 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-white/45 md:text-[0.66rem]">
        <span>СПЕЦИФИКАЦИЯ НАПРАВЛЕНИЙ</span>
        <span>САНКТ-ПЕТЕРБУРГ · МОСКВА · ПРОЕКТЫ ПО РОССИИ</span>
      </div>

      <h2
        id="services-spec-title"
        className="mt-10 max-w-3xl font-brand text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.9] tracking-[-0.02em]"
      >
        Что именно снимает Savage Movie
      </h2>

      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/60 md:text-base">
        Продакшн полного цикла: креатив, препродакшн, съёмка, постпродакшн и адаптации под площадки.
        Базируемся в Санкт-Петербурге, снимаем в Москве и по России — логистику группы закладываем в
        смету заранее.
      </p>

      <dl className="mt-14">
        {directions.map(direction => (
          <div
            key={direction.id}
            className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-white/10 py-7 lg:grid-cols-12"
          >
            <dt className="lg:col-span-4">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-white/35 md:text-[0.66rem]">
                {direction.index}
              </span>
              <span className="mt-2 block text-lg font-medium md:text-xl">{direction.title}</span>
            </dt>

            <dd className="text-sm leading-relaxed text-white/60 lg:col-span-4 md:text-base">
              {direction.description}
            </dd>

            <dd className="lg:col-span-2">
              {direction.works.length > 0 ? (
                <ul className="flex flex-wrap gap-x-4 gap-y-1">
                  {direction.works.map(work => (
                    <li key={work.slug}>
                      <Link
                        href={`/projects/${work.slug}`}
                        onClick={() => onCaseOpen(direction, work.slug)}
                        className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-[0.66rem]"
                      >
                        {work.client}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </dd>

            <dd
              className={cn(
                'font-mono text-[0.58rem] uppercase tracking-[0.18em] text-white/45 lg:col-span-2 lg:text-right md:text-[0.66rem]'
              )}
            >
              {direction.meta}
              {direction.route.published ? (
                <Link
                  href={directionHref(direction)}
                  onClick={() => onNavigate(direction)}
                  className="mt-2 block text-white/70 underline underline-offset-4 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  Страница направления
                </Link>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-10 border-t border-white/10 pt-6 font-mono text-[0.58rem] uppercase leading-relaxed tracking-[0.18em] text-white/40 md:text-[0.66rem]">
        Состав выдачи регулярного продакшна: {DELIVERABLES}
      </p>
    </section>
  )
}
