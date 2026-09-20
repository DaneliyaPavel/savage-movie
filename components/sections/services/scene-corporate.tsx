'use client'

import { SceneFrame, SceneTitle } from './scene-frame'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { ProofRail } from './proof-rail'
import type { SceneProps } from './scene-props'

/**
 * Сцена 05 — корпоративный production.
 *
 * Вторая и последняя белая инверсия монтажа. Здесь она означает не редакцию,
 * как в fashion, а точность: жёсткая колонка, кадр в аккуратном прямоугольнике
 * без выходов за кромку, перечень форматов технической сеткой.
 *
 * Ни одного кадра из стоковой корпоративной вселенной. Доказательства —
 * реальные работы для банка, отеля и HoReCa; рукопожатий и переговорных на
 * этой странице нет и не будет.
 */

/** Что именно снимаем для бизнеса. Формулировки — форматы, а не обещания */
const FORMATS = [
  'BRAND FILM',
  'EMPLOYER VIDEO',
  'ПРОИЗВОДСТВО',
  'ЛЮДИ И КОМАНДА',
  'ТЕХНОЛОГИИ',
  'СОБЫТИЯ',
] as const

export function SceneCorporate({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const lead = direction.works[0]

  return (
    <SceneFrame id={id} direction={direction} theme="white">
      <div className="mt-auto grid grid-cols-1 items-end gap-y-12 pt-14 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-6">
          <SceneTitle
            id={id}
            /* Самая длинная строка монтажа — «выглядеть скучно.»,
               семнадцать знаков. Кегль подобран по ней, иначе строка
               перекрывает соседнюю колонку с кадром. */
            className="text-[clamp(1.9rem,4vw,3.6rem)]"
          >
            Бизнес
            <br />
            не обязан
            <br />
            выглядеть скучно.
          </SceneTitle>

          <p className="mt-9 max-w-lg text-base leading-relaxed text-black/65 md:text-lg">
            Brand films, employer video, производство, люди, технологии и события — без
            постановочных рукопожатий.
          </p>

          <DirectionCta
            direction={direction}
            onBrief={onBrief}
            onNavigate={onNavigate}
            theme="white"
            className="mt-10"
          />
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          {lead ? (
            <SceneMedia
              work={lead}
              active={active}
              aspect="4 / 3"
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="max-h-[40svh]"
            />
          ) : null}

          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-black/50 md:text-[0.68rem]">
            {FORMATS.map(format => (
              <li key={format}>{format}</li>
            ))}
          </ul>
        </div>
      </div>

      <ProofRail
        direction={direction}
        onCaseOpen={onCaseOpen}
        theme="white"
        className="mt-12 border-t border-black/10 pt-6"
      />
    </SceneFrame>
  )
}
