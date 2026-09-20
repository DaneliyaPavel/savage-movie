'use client'

import { ArrowDown } from 'lucide-react'

import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from '@/lib/contacts'
import { TELEGRAM_URL } from '@/lib/commercial-landing/content'

/**
 * Сцена 08 — выход из монтажа.
 *
 * Адресована тем, кто просмотрел семь направлений и не узнал свою задачу ни в
 * одном. Поэтому заголовок — вопрос, а не призыв: «оставить заявку» здесь
 * означало бы, что человек уже согласился, хотя он как раз не нашёл своё.
 *
 * Рядом с основным действием стоят живые контакты студии. Человеку, который
 * дочитал до конца длинной страницы, нужно видеть, куда написать прямо
 * сейчас, а не только форму.
 */
/** id выхода из монтажа: по нему страница понимает, что индекс пора убрать */
export const SERVICES_OUTRO_ID = 'services-outro'

export interface ServicesFinalProps {
  /** Прокрутить к брифу */
  onBriefClick: () => void
  onEmailClick: () => void
  onTelegramClick: () => void
}

export function ServicesFinal({ onBriefClick, onEmailClick, onTelegramClick }: ServicesFinalProps) {
  return (
    <section
      id={SERVICES_OUTRO_ID}
      aria-labelledby="services-final-title"
      className="relative flex min-h-[80svh] w-full flex-col justify-end border-t border-[#1A1A1A] bg-[#0D0D0D] px-6 pb-20 pt-24 text-white md:px-10 lg:px-20"
    >
      <h2
        id="services-final-title"
        className="font-brand text-[clamp(2.5rem,6vw,5.2rem)] uppercase leading-[0.84] tracking-[-0.03em] text-balance"
      >
        Не нашли
        <br />
        свою строку?
      </h2>

      <p className="mt-9 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
        Расскажите задачу. За первый разговор определим формат, ориентир бюджета и следующий шаг.
      </p>

      <div className="mt-12 flex flex-col items-start gap-8 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onBriefClick}
          className="group inline-flex items-center gap-3 border-b border-white pb-2 text-lg font-medium transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-xl"
        >
          Обсудить проект
          <ArrowDown
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-1"
          />
        </button>

        {/* Вторичный выход: те же контакты, что в футере и в разметке
            организации — телефон студии здесь не новый и не отдельный */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/50 md:text-[0.7rem]">
          <a
            href={PHONE_HREF}
            className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {PHONE_DISPLAY}
          </a>
          <a
            href={EMAIL_HREF}
            onClick={onEmailClick}
            className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            {EMAIL}
          </a>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onTelegramClick}
            className="transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Telegram
          </a>
        </div>
      </div>
    </section>
  )
}
