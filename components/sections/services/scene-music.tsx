'use client'

import { SceneFrame, SceneTitle } from './scene-frame'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { ProofRail } from './proof-rail'
import type { SceneProps } from './scene-props'

/**
 * Сцена 07 — музыкальные клипы.
 *
 * Единственная сцена, где кадр не стоит в рамке, а занимает весь экран под
 * текстом. Остальные направления показывают продакшн как контролируемый
 * объект; здесь материал выходит из берегов — это другой тип энергии, и
 * отличаться он должен композицией, а не подписью «raw».
 *
 * Зерно поверх кадра — тот же шум, что у фирменного оверлея сайта, но
 * локальный и слабее: глобальный .grain-overlay прибит к вьюпорту и накрыл бы
 * весь монтаж, а зерно здесь принадлежит именно этой сцене.
 */
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function SceneMusic({ id, direction, active, onBrief, onNavigate, onCaseOpen }: SceneProps) {
  const lead = direction.works[0]

  return (
    <SceneFrame id={id} direction={direction} theme="black" className="justify-end">
      <div className="absolute inset-0 -z-10">
        {lead ? (
          <SceneMedia
            work={lead}
            active={active}
            aspect="auto"
            sizes="100vw"
            className="h-full w-full"
          />
        ) : null}

        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
          style={{ backgroundImage: GRAIN_URL }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/75 to-[#0D0D0D]/30"
        />
      </div>

      <div className="mt-auto pt-14">
        <SceneTitle id={id} className="text-[clamp(2.8rem,7vw,6rem)]">
          Трек
          <br />
          задаёт
          <br />
          монтаж.
        </SceneTitle>

        <p className="mt-8 max-w-md text-base leading-relaxed text-white/75 md:text-lg">
          Режиссура и production музыкальных клипов.
        </p>

        <DirectionCta
          direction={direction}
          onBrief={onBrief}
          onNavigate={onNavigate}
          className="mt-10"
        />

        <ProofRail
          direction={direction}
          onCaseOpen={onCaseOpen}
          className="mt-12 border-t border-white/15 pt-6"
        />
      </div>
    </SceneFrame>
  )
}
