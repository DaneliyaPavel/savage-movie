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
 *
 * Кадр здесь видно. Прежде он лежал на сорока процентах прозрачности под
 * заливкой в восемьдесят пять, то есть его не было вовсе, — и последним, что
 * оставалось от монтажа, был пустой чёрный прямоугольник высотой в половину
 * экрана с текстом, прижатым к нижней кромке. Теперь кадр гаснет слева
 * направо: набор стоит на чистом поле, а справа остаётся то, чем страница
 * занималась все восемь сцен.
 *
 * Набор держится по центру высоты, а не по нижнему краю. Семь территорий
 * подряд прижимали заявление к низу; финальный кадр обязан отличаться от
 * очередной сцены хотя бы тем, где в нём стоит текст.
 */
export const SERVICES_OUTRO_ID = 'services-outro'

export interface ServicesEndFrameProps {
  /** Кадр, которым закрывается монтаж */
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
      className="relative flex min-h-[100svh] w-full flex-col justify-center overflow-hidden bg-[#000000] px-6 py-28 text-white md:px-10 lg:px-20"
    >
      {/*
        Кадр гаснет влево: слева поле под набор, справа — последняя секунда.
        
        Слой лежит на z-0, а не на -z-10. Отрицательный z уводил его за
        собственный фон секции — та красилась в чистый чёрный поверх кадра, и
        последняя сцена монтажа всё это время была пустым прямоугольником.
        Набор ниже поэтому поднят на свой слой явно.
      */}
      <div className="absolute inset-0 z-0">
        {closing ? (
          <SceneMedia
            work={{ ...closing, playbackId: null }}
            active={false}
            aspect="auto"
            sizes="100vw"
            className="h-full w-full bg-transparent"
          />
        ) : null}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/80 to-[#000000]/15"
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#000000]/70 to-transparent"
        />
      </div>

      {/*
        Наклон возвращается. Курсив на этой странице — не украшение и не
        значение по умолчанию: им набраны только две вещи, вопрос на входе и
        вопрос на выходе. Семь территорий между ними стоят прямым. Тем же
        наклоном набран финал /clients — страница заканчивается голосом сайта,
        а не собственным.
      */}
      <div className="relative z-10">
        <h2
          id="services-endframe-title"
          className="max-w-[13ch] pb-2 font-brand-hero text-[clamp(2.8rem,8vw,7rem)] uppercase italic leading-[0.88] tracking-[-0.03em]"
        >
          Не нашли
          <br />
          свою строку?
        </h2>

        <p className="mt-8 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
          Расскажите задачу. За первый разговор определим формат, ориентир бюджета и следующий шаг.
        </p>

        <div className="mt-10 flex flex-col items-start gap-7 sm:flex-row sm:items-center sm:gap-12">
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
      </div>
    </section>
  )
}
