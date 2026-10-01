/**
 * Выход страницы направления — последнее слово перед брифом.
 *
 * Композиция: служебная строка, вопрос гигантским курсивом (последняя строка
 * красная), главная кнопка (DirectionButton lg — та же, что на всех страницах
 * семейства), прямые контакты для тех, кому проще написать, и пустой контурный
 * бегущий титр с названием действия. Форма брифа идёт сразу ниже, поэтому
 * кнопка прокручивает на считаные пиксели.
 *
 * Публичные пропсы:
 *  - lines — строки вопроса. Пробелы на концах строк блок обрезает сам и
 *    ставит один между строками, поэтому в textContent заголовок читается
 *    фразой («Какая коллекция следующая?»), а хвостовые пробелы в контенте
 *    больше не нужны. Каждая строка проходит typo(): предлог не виснет в конце.
 *  - aside — знак сцены справа на lg (значок, линейка, кольцо): декор, блок
 *    сам ставит aria-hidden и pointer-events: none. Ниже lg не показывается.
 *  - frame — кадр справа, гаснущий влево; метки остаются в левой защищённой
 *    зоне, поэтому читаются и на светлом кадре.
 *
 * Кнопка — всегда плашка, а не «призрак»: на телефоне ховера нет, и главное
 * действие страницы не должно ждать наведения, чтобы быть видным.
 */
'use client'

import { Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'

import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { TELEGRAM_URL } from '@/lib/commercial-landing/content'
import { EMAIL, EMAIL_HREF } from '@/lib/contacts'
import { cn } from '@/lib/utils'
import { useDirectionPage } from './direction-context'
import { DirectionButton, typo } from './direction-kit'
import { Still } from './still'

export interface DirectionEndProps {
  /** Строки вопроса: каждая — отдельная строка набора */
  lines: string[]
  ctaLabel: string
  note?: string
  /** Кадр справа, гаснущий влево; без него — чистое поле */
  frame?: { src: string; position?: string } | null
  /** Подпись над вопросом */
  kicker?: string
  /** Знак сцены справа на lg; декор */
  aside?: ReactNode
}

const delay = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties

export function DirectionEnd({
  lines,
  ctaLabel,
  note,
  frame,
  kicker = 'Следующий шаг',
  aside,
}: DirectionEndProps) {
  const page = useDirectionPage()
  const marqueeRef = useRef<HTMLDivElement>(null)
  const last = lines.length - 1

  // Бегущий титр — бесконечный цикл: вне экрана он стоит на паузе
  useEffect(() => {
    const node = marqueeRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      node.dataset.paused = String(entry ? !entry.isIntersecting : false)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="direction-end"
      aria-labelledby="direction-end-title"
      className="dir-end relative isolate flex min-h-[92svh] flex-col justify-between overflow-hidden border-t border-white/10 bg-[#000000] px-6 pt-12 md:px-10 md:pt-16 lg:px-20"
    >
      {frame ? (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Still
            src={frame.src}
            alt=""
            sizes="100vw"
            quality={65}
            objectPosition={frame.position}
            className="h-full w-full"
          />
          <span className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/85 to-[#000000]/25" />
          <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#000000] to-transparent" />
        </div>
      ) : null}

      {/* Обе метки в левой зоне, где кадр закрыт градиентом: на светлом кадре не теряют контраст */}
      <div
        data-reveal=""
        className="dir-kit-meta flex flex-wrap items-center gap-x-4 gap-y-2 font-mono uppercase text-white/70"
      >
        <span className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-accent" />
          {kicker}
        </span>
        <span aria-hidden="true" className="hidden h-3 w-px bg-white/30 sm:block" />
        <span className="hidden sm:inline">Бриф · два шага</span>
      </div>

      <div className="py-12 md:py-16">
        <div className="dir-end-head">
          <h2
            id="direction-end-title"
            className="dir-end-title font-brand-hero uppercase tracking-tighter text-white"
          >
            {lines.map((line, index) => (
              <Fragment key={`${index}-${line}`}>
                {index > 0 ? ' ' : null}
                <span
                  data-reveal=""
                  style={delay(index * 90)}
                  className={cn('block', index === last && 'text-accent')}
                >
                  {typo(line.trim())}
                </span>
              </Fragment>
            ))}
          </h2>
        </div>

        <div className="mt-10 grid gap-10 md:mt-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <div className="max-w-[40rem]">
              <div data-reveal="" style={delay(lines.length * 90 + 120)}>
                <DirectionButton
                  size="lg"
                  label={ctaLabel}
                  onClick={() => page.openBrief('end')}
                  className="w-full"
                />
              </div>

              <div
                data-reveal=""
                style={delay(lines.length * 90 + 220)}
                className="mt-8 grid gap-x-10 border-b border-white/15 sm:grid-cols-2"
              >
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackMetrikaGoal('telegram_click', { location: `${page.id}_end` })}
                  className="dir-end-contact"
                >
                  <span>
                    <span className="dir-kit-meta dir-end-contact-label block font-mono uppercase">
                      Telegram
                    </span>
                    <span className="dir-end-contact-value mt-1 block text-base text-white md:text-lg">
                      Написать в мессенджер
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="dir-end-contact-arrow h-5 w-5 shrink-0"
                  />
                </a>
                <a
                  href={EMAIL_HREF}
                  onClick={() => trackMetrikaGoal('email_click', { location: `${page.id}_end` })}
                  className="dir-end-contact"
                >
                  <span>
                    <span className="dir-kit-meta dir-end-contact-label block font-mono uppercase">
                      Email
                    </span>
                    <span className="dir-end-contact-value mt-1 block text-base text-white md:text-lg">
                      {EMAIL}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="dir-end-contact-arrow h-5 w-5 shrink-0"
                  />
                </a>
              </div>

              {note ? (
                <p
                  data-reveal=""
                  style={delay(lines.length * 90 + 300)}
                  className="mt-6 max-w-lg text-sm leading-relaxed text-white/65 [text-wrap:pretty] md:text-base"
                >
                  {typo(note)}
                </p>
              ) : null}
            </div>
          </div>

          {aside ? (
            <div
              aria-hidden="true"
              className="pointer-events-none hidden select-none lg:col-span-5 lg:flex lg:justify-end"
            >
              {aside}
            </div>
          ) : null}
        </div>
      </div>

      <div
        ref={marqueeRef}
        aria-hidden="true"
        className="dir-end-marquee-wrap pointer-events-none -mx-6 select-none overflow-hidden whitespace-nowrap pb-2 md:-mx-10 lg:-mx-20"
      >
        <div className="dir-end-marquee flex w-max">
          {[0, 1].map(half => (
            <span
              key={half}
              className="dir-outline flex shrink-0 font-stage text-[clamp(4.5rem,15vw,14rem)] uppercase leading-[0.95] opacity-45"
            >
              {[0, 1].map(repeat => (
                <span key={repeat} className="pr-[0.5em]">
                  {ctaLabel}
                  <span className="px-[0.35em] text-accent/60">/</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
