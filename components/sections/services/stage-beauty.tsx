'use client'

import { useState } from 'react'
import { motion, useTransform } from 'framer-motion'

import { StageRail, StageShell, StageTitle } from './stage-shell'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { useStage, useStageStep } from './use-stage'
import { cn } from '@/lib/utils'
import type { SceneProps } from './scene-props'

/**
 * 03 — beauty. Метафора: ПРИБЛИЖЕНИЕ.
 *
 * Заголовок здесь не описывает действие, а совпадает с ним: пока идёт сцена,
 * кадр физически наезжает на зрителя, а типографика меняется местами по
 * размеру — «ближе» отступает, «ещё ближе» занимает экран. Обещание фактуры
 * выполняется самим экраном, а не прилагательным в копии.
 *
 * Материал переключается индексом у правой кромки. Подписи не выдуманы: они
 * описывают то, что действительно снято в этих работах.
 */

/** Материал кадра по работе. Ключ — слаг, чтобы подпись не разъехалась с портфолио */
const MATERIAL_BY_SLUG: Record<string, string> = {
  unna: 'SKIN',
  yadah: 'LIGHT',
  vernel: 'FABRIC',
  biotherm: 'WATER',
}

export function StageBeauty({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const { containerRef, progress, reduced } = useStage()
  const step = useStageStep(progress, 2, reduced)
  const works = direction.works.slice(0, 4)
  const [index, setIndex] = useState(0)

  const current = works[index]
  const closer = step >= 1

  // Кадр идёт навстречу. Движение только по transform — композитор браузера
  // справляется с этим без перерисовки слоя.
  const scale = useTransform(progress, [0, 1], reduced ? [1.2, 1.2] : [1, 1.55])

  return (
    <StageShell
      id={id}
      direction={direction}
      containerRef={containerRef}
      depth={300}
      surfaceClassName="bg-[#070707]"
    >
      <motion.div style={{ scale }} className="absolute inset-0 will-change-transform">
        {current ? (
          <SceneMedia
            work={current}
            active={active}
            aspect="auto"
            sizes="100vw"
            className="h-full w-full"
          />
        ) : null}
      </motion.div>

      {/*
        Ни грамма плотности на самой фактуре. Прежняя заливка держала 45%
        черноты по верхней кромке и 30% посередине — то есть территория,
        которая обещает «почти физически», показывала макро через закопчённое
        стекло. Затемнение осталось только там, где лежит набор.
      */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-[#070707] via-[#070707]/65 to-transparent"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#070707]/60 to-transparent"
      />

      <StageRail direction={direction} />

      {/* Индекс материалов у правой кромки: переключает не карточку, а весь экран */}
      <ul className="absolute right-6 top-1/2 z-20 -translate-y-1/2 space-y-3 text-right md:right-10 lg:right-20">
        {works.map((work, position) => {
          const label = MATERIAL_BY_SLUG[work.slug] ?? work.client.toUpperCase()
          const isCurrent = position === index

          return (
            <li key={work.slug}>
              <button
                type="button"
                aria-pressed={isCurrent}
                onMouseEnter={() => setIndex(position)}
                onFocus={() => setIndex(position)}
                onClick={() => setIndex(position)}
                className={cn(
                  'font-mono text-[0.62rem] uppercase tracking-[0.28em] transition-colors md:text-[0.7rem]',
                  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
                  isCurrent ? 'text-white' : 'text-white/35 hover:text-white/70'
                )}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-14 md:px-10 md:pb-16 lg:px-20">
        {/* Интерлиньяж свободнее общего: в этой сцене соседние строки сильно
            разного кегля, и на плотном наборе точки над Ё выросшей строки
            выходят за свой строчный бокс и упираются в уменьшившуюся */}
        <StageTitle id={id} leading={1.12} className="[text-shadow:0_2px_40px_rgba(0,0,0,0.55)]">
          {/* Обе строки всегда в разметке: меняется вес присутствия, а не факт */}
          <span
            className={cn(
              'block origin-left transition-[font-size,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
              closer
                ? 'text-[clamp(1.1rem,2.4vw,2rem)] text-white/45'
                : 'text-[clamp(2.8rem,8vw,7rem)] text-white'
            )}
          >
            Ближе.
          </span>
          <span
            className={cn(
              'block origin-left transition-[font-size,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
              closer
                ? 'text-[clamp(2.8rem,8vw,7rem)] text-white'
                : 'text-[clamp(1.1rem,2.4vw,2rem)] text-white/35'
            )}
          >
            Ещё ближе.
          </span>
        </StageTitle>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <DirectionCta direction={direction} onBrief={onBrief} onNavigate={onNavigate} />

          {current ? (
            <a
              href={`/projects/${current.slug}`}
              onClick={() => onCaseOpen(direction, current.slug)}
              className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-white/50 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-[0.68rem]"
            >
              {current.client} — {current.title}
            </a>
          ) : null}
        </div>
      </div>
    </StageShell>
  )
}
