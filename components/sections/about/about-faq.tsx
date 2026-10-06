/**
 * Вопросы о студии. Кнопка-заголовок и панель ответа: раскрытие плавное
 * (строки сетки 0fr → 1fr), ответы лежат в DOM целиком — поиск видит текст
 * сразу. Тот же текст уходит в FAQPage. Стрелки, Home и End — как в аккордеоне APG.
 */
'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { ABOUT_FAQ, ABOUT_READING } from '@/lib/about/content'
import { cn } from '@/lib/utils'
import { KIT_KICKER, setTitle, typo } from '../direction/direction-kit'
import { SplitWords } from './split-words'

export function AboutFaq() {
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]))

  const toggle = (position: number) =>
    setOpen(previous => {
      const next = new Set(previous)
      if (next.has(position)) next.delete(position)
      else next.add(position)
      return next
    })

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, position: number) => {
    const triggers = listRef.current?.querySelectorAll<HTMLButtonElement>('[data-faq-trigger]')
    if (!triggers || triggers.length === 0) return
    const last = triggers.length - 1
    const target =
      event.key === 'ArrowDown'
        ? position === last
          ? 0
          : position + 1
        : event.key === 'ArrowUp'
          ? position === 0
            ? last
            : position - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (target === null) return
    event.preventDefault()
    triggers[target]?.focus()
  }

  return (
    <section
      id="about-faq"
      aria-labelledby="about-faq-title"
      className="relative border-t border-white/10 bg-black px-6 py-20 md:px-10 md:py-32 lg:px-20"
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div data-reveal="" className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            08 / Вопросы
          </div>
          <h2
            id="about-faq-title"
            data-reveal=""
            className="mt-6 font-stage text-[clamp(1.9rem,3.7vw,3.4rem)] uppercase leading-[0.98] tracking-[-0.03em] text-white text-balance [overflow-wrap:anywhere]"
          >
            <SplitWords text={'О студии и работе с нами'} />
          </h2>
          <ul className="mt-8 space-y-3">
            {ABOUT_READING.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-extralight text-white/75 underline decoration-white/35 underline-offset-4 transition-colors hover:text-white hover:decoration-accent focus-visible:decoration-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div ref={listRef} className="border-t border-white/15">
          {ABOUT_FAQ.map((item, position) => {
            const isOpen = open.has(position)
            const panelId = `${baseId}-panel-${position}`
            const triggerId = `${baseId}-trigger-${position}`
            return (
              <div key={item.question} className="border-b border-white/15">
                <h3>
                  <button
                    id={triggerId}
                    type="button"
                    data-faq-trigger=""
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(position)}
                    onKeyDown={event => onKeyDown(event, position)}
                    className="group flex w-full items-center justify-between gap-6 py-6 text-left transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:py-8"
                  >
                    <span className="font-brand-hero text-[clamp(1.15rem,2vw,1.7rem)] uppercase leading-[1.05] tracking-tighter text-white [overflow-wrap:anywhere]">
                      {setTitle(item.question)}
                    </span>
                    <Plus
                      aria-hidden="true"
                      className={cn(
                        'h-6 w-6 shrink-0 text-accent transition-transform duration-300',
                        isOpen && 'rotate-45'
                      )}
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  inert={!isOpen}
                  className={cn('about-faq-panel', isOpen && 'is-open')}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[40rem] pb-8 text-base font-extralight leading-relaxed text-white/75">
                      {typo(item.answer)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
