'use client'

import { SceneFrame, SceneTitle } from './scene-frame'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { ProofRail } from './proof-rail'
import type { SceneProps } from './scene-props'

/**
 * Сцена 06 — AI и гибридный production.
 *
 * Ни фиолетового, ни свечения, ни лиц из нейросети. Технологию здесь
 * показывает не картинка, а словарь: слева — язык съёмки, справа — язык
 * генерации, между ними линия в 1px, которая к низу растворяется. Два
 * словаря постепенно перестают быть разными — это и есть один pipeline.
 *
 * Про кадр рядом сознательно не сказано, что он сгенерирован: какие именно
 * планы в работе сняты, а какие собраны, знает только продакшн, и выдумывать
 * это ради эффектной подписи нельзя. Доказательство честнее — сама работа,
 * которая в портфолио лежит в категории AI.
 */

const CAMERA_TERMS = ['35MM', 'T2.0', 'SHUTTER 180°', 'REC.709', '23.976 FPS'] as const
const MODEL_TERMS = ['MODEL', 'PROMPT', 'SEED', 'FRAME', 'GENERATED'] as const

export function SceneAi({ id, direction, active, onBrief, onNavigate, onCaseOpen }: SceneProps) {
  const lead = direction.works[0]

  return (
    <SceneFrame id={id} direction={direction} theme="black">
      <div className="mt-auto grid grid-cols-1 items-end gap-y-12 pt-14 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-7">
          <SceneTitle id={id} className="text-[clamp(2.2rem,4.8vw,4.4rem)]">
            AI video
            <br />
            без AI-эстетики.
          </SceneTitle>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
            Генерация, live action и постпродакшн в одном pipeline. Используем AI там, где он делает
            идею возможной.
          </p>

          {/* Словарь производства. Левая колонка — камера, правая — генерация,
              разделитель растворяется книзу: границы между ними в готовом
              материале не видно. */}
          <div className="relative mt-10 grid max-w-xl grid-cols-2 gap-x-8">
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-accent/70 via-white/20 to-transparent"
            />
            <ul className="space-y-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/60 md:text-[0.68rem]">
              <li className="text-white/35">REAL</li>
              {CAMERA_TERMS.map(term => (
                <li key={term}>{term}</li>
              ))}
            </ul>
            <ul className="space-y-2 pl-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/60 md:text-[0.68rem]">
              <li className="text-white/35">GENERATED</li>
              {MODEL_TERMS.map(term => (
                <li key={term}>{term}</li>
              ))}
            </ul>
          </div>

          <DirectionCta
            direction={direction}
            onBrief={onBrief}
            onNavigate={onNavigate}
            className="mt-10"
          />
        </div>

        <div className="lg:col-span-5">
          {lead ? (
            <figure>
              <SceneMedia
                work={lead}
                active={active}
                aspect="4 / 5"
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="max-h-[46svh]"
              />
              <figcaption className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/45 md:text-[0.68rem]">
                {lead.client} — {lead.title}
              </figcaption>
            </figure>
          ) : null}
        </div>
      </div>

      <ProofRail
        direction={direction}
        onCaseOpen={onCaseOpen}
        className="mt-12 border-t border-white/10 pt-6"
      />
    </SceneFrame>
  )
}
