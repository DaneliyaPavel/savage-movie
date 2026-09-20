'use client'

import { ArrowDown } from 'lucide-react'

import { SceneMedia } from './scene-media'
import { EMAIL, EMAIL_HREF, PHONE_DISPLAY, PHONE_HREF } from '@/lib/contacts'
import { TELEGRAM_URL } from '@/lib/commercial-landing/content'
import type { DirectionWork } from '@/lib/services/proof'

/**
 * 08 — выход. Метафора: ПОСЛЕДНИЙ КАДР.
 *
 * Раньше после музыкального клипа монтаж заканчивался и начинался
 * функциональный хвост из формы. Здесь последний кадр — это и есть форма:
 * экран уходит в чёрное, на нём остаётся вопрос, и прямо из него, без шва и
 * без смены языка, начинается бриф. Страница не «закончилась и вот заявка»,
 * а досняла свою последнюю сцену.
 *
 * Вопрос, а не призыв: человек, дошедший сюда и не узнавший свою задачу ни в
 * одной из семи территорий, ещё ни на что не согласился.
 */
export const SERVICES_OUTRO_ID = 'services-outro'

export interface ServicesEndFrameProps {
  /** Кадр последней сцены — из него экран и уходит в чёрное */
  closing: DirectionWork | null
  onBriefClick: () => void
  onEmailClick: () => void
  onTelegramClick: () => void
}

export function ServicesEndFrame({
  closing,
  onBriefClick,
  onEmailClick,
  onTelegramClick,
}: ServicesEndFrameProps) {
  return (
    <section
      id={SERVICES_OUTRO_ID}
      aria-labelledby="services-endframe-title"
      className="relative flex min-h-[100svh] w-full flex-col justify-end overflow-hidden bg-[#000000] px-6 pb-16 pt-28 text-white md:px-10 lg:px-20"
    >
      {/* Кадр уходит почти в чёрное: это последняя секунда, а не ещё одна сцена */}
      <div className="absolute inset-0 -z-10">
        {closing ? (
          <SceneMedia
            work={{ ...closing, playbackId: null }}
            active={false}
            aspect="auto"
            sizes="100vw"
            className="h-full w-full opacity-40"
          />
        ) : null}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/85 to-[#000000]/55"
        />
      </div>

      <p className="font-mono text-[0.58rem] uppercase tracking-[0.26em] text-white/45 md:text-[0.66rem]">
        08 / BRIEF
        <span className="pl-6">SAVAGE MOVIE / SPB + MOSCOW</span>
      </p>

      <h2
        id="services-endframe-title"
        className="mt-8 font-brand text-[clamp(2.6rem,7.5vw,6.5rem)] uppercase leading-[0.84] tracking-[-0.03em]"
      >
        Не нашли
        <br />
        свою строку?
      </h2>

      <p className="mt-8 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
        Расскажите задачу. За первый разговор определим формат, ориентир бюджета и следующий шаг.
      </p>

      <div className="mt-10 flex flex-col items-start gap-7 pb-6 sm:flex-row sm:items-center sm:gap-12">
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

        {/* Те же контакты, что в футере и в разметке организации */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/45 md:text-[0.68rem]">
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
