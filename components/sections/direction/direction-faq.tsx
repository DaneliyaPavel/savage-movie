/**
 * Вопросы направления. Кнопка-заголовок и панель ответа: раскрытие плавное
 * (строки сетки 0fr → 1fr), а ответы лежат в DOM целиком — поиск видит текст
 * сразу, закрытая панель только скрыта от фокуса и скринридера.
 * Тот же текст уходит в FAQPage — разметка описывает только то, что видно.
 *
 * Первый вопрос раскрыт с сервера: блок не выглядит пустым списком, а ответ
 * не требует клика, чтобы его прочитали.
 */
'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight } from 'lucide-react'

import type { FaqItem } from '@/lib/services/pages/types'
import { useDirectionPage } from './direction-context'
import { KIT_KICKER, KIT_TITLE, setTitle, typo } from './direction-kit'

import './direction-kit.css'

export interface DirectionFaqProps {
  title: string
  items: FaqItem[]
  /** Номер раздела в техническом ряду: «07» */
  index?: string
}

export function DirectionFaq({ title, items, index }: DirectionFaqProps) {
  const page = useDirectionPage()
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set([0]))

  const toggle = (position: number) =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(position)) next.delete(position)
      else next.add(position)
      return next
    })

  // Стрелки, Home и End — по заголовкам вопросов, как в аккордеоне APG
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
      aria-labelledby="direction-faq-title"
      className="border-t border-white/10 bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            {index ? (
              <p className={KIT_KICKER}>
                <span aria-hidden="true" className="h-px w-8 bg-accent" />
                {index} / Вопросы
              </p>
            ) : null}
            <h2
              id="direction-faq-title"
              data-reveal=""
              className={`${KIT_TITLE} mt-5 text-[clamp(1.5rem,2.7vw,2.75rem)]`}
            >
              {setTitle(title)}
            </h2>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div ref={listRef}>
            {items.map((item, position) => {
              const isOpen = open.has(position)
              const triggerId = `${baseId}-q${position}`
              const panelId = `${baseId}-a${position}`
              return (
                <div key={item.question} data-open={isOpen} className="dir-kit-faq-item">
                  <h3 className="m-0 text-inherit font-inherit">
                    <button
                      type="button"
                      id={triggerId}
                      data-faq-trigger=""
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(position)}
                      onKeyDown={event => onKeyDown(event, position)}
                      className="dir-kit-faq-trigger"
                    >
                      <span
                        aria-hidden="true"
                        className="dir-kit-faq-idx type-meta font-mono uppercase tabular-nums"
                      >
                        {String(position + 1).padStart(2, '0')}
                      </span>
                      <span className="dir-kit-faq-q text-[clamp(1.125rem,1.7vw,1.5rem)] leading-[1.25] tracking-[-0.005em] [text-wrap:balance]">
                        {typo(item.question)}
                      </span>
                      <span aria-hidden="true" className="dir-kit-faq-icon">
                        <span className="dir-kit-faq-glyph" />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={triggerId}
                    className="dir-kit-faq-panel"
                  >
                    <div>
                      <p className="max-w-[40rem] pb-8 pl-[2.5rem] pr-12 text-[clamp(1rem,1.25vw,1.1875rem)] leading-[1.65] text-white/75 [text-wrap:pretty] md:pb-10 md:pl-[3.75rem] md:pr-16">
                        {typo(item.answer)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-10 md:pl-[3.75rem]">
            <p className="text-sm text-white/60 md:text-base">
              {typo('Нет вашего вопроса? Задайте его в брифе.')}
            </p>
            <button
              type="button"
              onClick={() => page.openBrief('faq')}
              className="group type-meta inline-flex items-center gap-3 font-mono uppercase text-white underline decoration-white/30 underline-offset-[6px] transition-colors duration-[var(--motion-state)] hover:text-accent hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              К брифу
              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform duration-[var(--motion-move)] ease-[var(--ease-out-expo)] group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
