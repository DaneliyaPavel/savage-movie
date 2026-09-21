'use client'

import { SceneFoot, STAGE_BOTTOM, StageRail, StageShell, StageTitle } from './stage-shell'
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
            /*
              Ни priority, ни eager. Сцена 01 стоит ровно на экран ниже
              первого, и браузер поднимает такой кадр сам: порог отложенной
              загрузки в Chrome — 1250px на быстрой сети и 2500px на
              медленной, то есть на медленной он приходит раньше, а не позже.
              А вот второй <link rel=preload> в голове документа отбирал канал
              у кадра первого экрана — у того самого, ради которого priority и
              существует. На странице он теперь ровно один.
            */
            className="h-full w-full"
          />
        ) : null}
        {/* Кадр рекламы бывает светлым: без затемнения снизу заявление
            перестаёт читаться ровно в тот момент, когда оно и произносится.
            Плотность держится в нижней половине — верх кадра остаётся кадром */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/70 to-transparent"
        />
      </div>

      <StageRail direction={direction} />

      <div
        className={cn(
          'relative z-10 flex h-full flex-col justify-end px-6 md:px-10 lg:px-20',
          STAGE_BOTTOM
        )}
      >
        <StageTitle id={id} className="text-[clamp(2.6rem,7.5vw,6.5rem)]">
          {BEATS.map((beat, index) => (
            <span
              key={beat}
              /* Удар, а не проявление: цвет меняется мгновенно, без transition
                 по длительности — гаснет только уже сказанное */
              /*
                Тень лежит только под произнесённым словом. Общая на все три
                строки давала несказанным чёрный ореол, и они читались не как
                погашенные, а как вытисненные: на кадре стояли три заголовка
                одинаковой громкости вместо одного.
              */
              className={cn(
                'block transition-colors duration-200',
                index === step
                  ? 'text-white [text-shadow:0_2px_40px_rgba(0,0,0,0.5)]'
                  : index < step
                    ? 'text-white/22'
                    : 'text-white/[0.07]'
              )}
            >
              {beat}
            </span>
          ))}
        </StageTitle>

        <p className="mt-7 max-w-md text-sm leading-relaxed text-white/60 md:text-base">
          Рекламные ролики для запуска продукта, кампании, retail, digital и экранов.
        </p>

        <SceneFoot
          className="mt-8"
          cta={<DirectionCta direction={direction} onBrief={onBrief} onNavigate={onNavigate} />}
          aside={
            <ProofRail
              direction={direction}
              onCaseOpen={onCaseOpen}
              brandsOnly
              className="opacity-60 transition-opacity hover:opacity-100"
            />
          }
        />
      </div>
    </StageShell>
  )
}
