/**
 * Работы направления как титры: строка — проект, справа кадр, год и стрелка.
 *
 * Кадр стоит в строке всегда, приглушённый; «зажигается» у строки под
 * курсором или фокусом, а на телефоне — у строки, которая проходит через
 * центр экрана (тот же жест, что в ролле /clients: наведения там нет).
 * Кадр и цвет меняются слоями и transform — без layout.
 */
'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { firstSentence, type DirectionPageWork } from '@/lib/services/pages/resolve'
import { useDirectionPage } from './direction-context'
import { KIT_KICKER, KIT_TITLE, KIT_TITLE_SIZE, setTitle, typo } from './direction-kit'
import { Still } from './still'

import './direction-kit.css'

export interface DirectionCreditsProps {
  title: string
  works: DirectionPageWork[]
  index?: string
  /** Подпись справа над списком: что объединяет работы */
  note?: string
}

const excerpt = (work: DirectionPageWork) => firstSentence(work.description)

const delay = (position: number) =>
  ({ '--reveal-delay': `${Math.min(position, 5) * 60}ms` }) as CSSProperties

export function DirectionCredits({ title, works, index, note }: DirectionCreditsProps) {
  const page = useDirectionPage()
  const listRef = useRef<HTMLUListElement>(null)

  // Без курсора строку зажигает положение на экране. Состояние лежит в
  // data-focus, а не в React: строки не перерисовываются на каждом скролле
  useEffect(() => {
    const list = listRef.current
    if (!list || typeof IntersectionObserver === 'undefined') return
    const touch = window.matchMedia('(hover: none)')
    let observer: IntersectionObserver | null = null

    const connect = () => {
      observer?.disconnect()
      observer = null
      const rows = list.querySelectorAll<HTMLElement>('[data-credit]')
      rows.forEach(row => row.removeAttribute('data-focus'))
      if (!touch.matches) return
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            ;(entry.target as HTMLElement).dataset.focus = String(entry.isIntersecting)
          }
        },
        { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
      )
      rows.forEach(row => observer?.observe(row))
    }

    connect()
    touch.addEventListener('change', connect)
    return () => {
      touch.removeEventListener('change', connect)
      observer?.disconnect()
    }
  }, [works.length])

  if (works.length === 0) return null

  return (
    <section
      aria-labelledby="direction-credits-title"
      className="border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-b border-white/15 pb-6">
        <div>
          {index ? (
            <p className={KIT_KICKER}>
              <span aria-hidden="true" className="h-px w-8 bg-accent" />
              {index} / Работы
            </p>
          ) : null}
          <h2
            id="direction-credits-title"
            data-reveal=""
            className={`${KIT_TITLE} ${KIT_TITLE_SIZE} mt-5`}
          >
            {setTitle(title)}
          </h2>
        </div>
        {note ? (
          <p className="type-meta max-w-xs font-mono uppercase leading-relaxed text-white/55">
            {typo(note)}
          </p>
        ) : null}
      </div>

      {/* Шапка таблицы титров: только на широком экране, декор */}
      <div
        aria-hidden="true"
        className="type-meta hidden grid-cols-[3rem_minmax(0,1fr)_11rem_4.5rem] gap-x-6 lg:grid-cols-[4.5rem_minmax(0,1fr)_16rem_6rem] border-b border-white/10 py-3 font-mono uppercase text-white/45 md:grid"
      >
        <span />
        <span>Клиент / работа</span>
        <span>Кадр</span>
        <span className="text-right">Год</span>
      </div>

      <ul ref={listRef} role="list">
        {works.map((work, position) => (
          <li
            key={work.slug}
            data-reveal=""
            style={delay(position)}
            className="border-b border-white/10"
          >
            <Link
              href={`/projects/${work.slug}`}
              prefetch={false}
              data-credit=""
              onClick={() => page.openCase(work.slug)}
              className="dir-kit-credit grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 py-7 md:grid-cols-[3rem_minmax(0,1fr)_11rem_4.5rem] md:min-h-[12.25rem] md:items-center lg:grid-cols-[4.5rem_minmax(0,1fr)_16rem_6rem] md:gap-x-6 md:py-8"
            >
              <span className="dir-kit-credit-idx type-meta font-mono uppercase tabular-nums md:self-start md:pt-3">
                {String(position + 1).padStart(2, '0')}
              </span>

              <span className="min-w-0">
                <span className="dir-kit-credit-name block break-words font-stage text-[clamp(1.85rem,6.2vw,3.6rem)] uppercase md:text-[clamp(1.6rem,4.2vw,3.6rem)] leading-[0.95] tracking-[-0.02em] text-white">
                  {work.client}
                </span>
                <span className="mt-3 block text-sm text-white/75 md:text-base">
                  {typo(work.title)}
                </span>
                {excerpt(work) ? (
                  <span className="mt-2 hidden max-w-xl text-sm leading-relaxed text-white/55 [text-wrap:pretty] md:block">
                    {typo(excerpt(work) ?? '')}
                  </span>
                ) : null}
              </span>

              <span className="col-start-2 mt-4 flex items-center gap-3 md:col-start-4 md:row-start-1 md:mt-0 md:justify-end md:self-start md:pt-3">
                <span className="type-meta font-mono uppercase tabular-nums text-white/60">
                  {work.year ?? ' '}
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="dir-kit-credit-arrow h-4 w-4 shrink-0"
                />
              </span>

              {work.posterUrl ? (
                <span
                  aria-hidden="true"
                  className="dir-kit-credit-thumb col-start-2 mt-5 block md:col-start-3 md:row-start-1 md:mt-0"
                >
                  <Still
                    src={work.posterUrl}
                    alt=""
                    sizes="(min-width: 1024px) 16rem, (min-width: 768px) 11rem, 90vw"
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
