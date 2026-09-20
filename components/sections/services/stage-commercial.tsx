'use client'

import { StageRail, StageShell, StageTitle } from './stage-shell'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { ProofRail } from './proof-rail'
import { useStage, useStageStep } from './use-stage'
import { cn } from '@/lib/utils'
import type { SceneProps } from './scene-props'

/**
 * 01 — коммерческий production. Метафора: МОНТАЖНЫЙ УДАР.
 *
 * Кадр занимает экран целиком и не делится ни с чем. Заявление приходит тремя
 * ударами по ходу сцены: сказанное слово гаснет до трети, ещё не сказанное
 * едва различимо. Ни одно из них не исчезает из разметки — без JS и в поиске
 * видны все три строки сразу, просто без монтажа.
 */

const BEATS = ['Запустить.', 'Показать.', 'Запомнить.'] as const

export function StageCommercial({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const { containerRef, progress, reduced } = useStage()
  const step = useStageStep(progress, BEATS.length, reduced)
  const lead = direction.works[0]

  return (
    <StageShell id={id} direction={direction} containerRef={containerRef} depth={260}>
      <div className="absolute inset-0">
        {lead ? (
          <SceneMedia
            work={lead}
            active={active}
            aspect="auto"
            sizes="100vw"
            eager
            className="h-full w-full"
          />
        ) : null}
        {/* Кадр рекламы бывает светлым: без затемнения снизу заявление
            перестаёт читаться ровно в тот момент, когда оно и произносится */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/45 to-transparent"
        />
      </div>

      <StageRail direction={direction} />

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-14 md:px-10 md:pb-16 lg:px-20">
        <StageTitle
          id={id}
          className="text-[clamp(2.6rem,7.5vw,6.5rem)] [text-shadow:0_2px_40px_rgba(0,0,0,0.5)]"
        >
          {BEATS.map((beat, index) => (
            <span
              key={beat}
              /* Удар, а не проявление: цвет меняется мгновенно, без transition
                 по длительности — гаснет только уже сказанное */
              className={cn(
                'block transition-colors duration-200',
                index === step ? 'text-white' : index < step ? 'text-white/30' : 'text-white/10'
              )}
            >
              {beat}
            </span>
          ))}
        </StageTitle>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-white/60 md:text-base">
          Рекламные ролики для запуска продукта, кампании, retail, digital и экранов.
        </p>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <DirectionCta direction={direction} onBrief={onBrief} onNavigate={onNavigate} />
          <ProofRail
            direction={direction}
            onCaseOpen={onCaseOpen}
            className="opacity-70 transition-opacity hover:opacity-100"
          />
        </div>
      </div>
    </StageShell>
  )
}
