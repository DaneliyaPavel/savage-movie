'use client'

import { useEffect, useState } from 'react'

import { StageRail, StageShell, StageTitle } from './stage-shell'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { ProofRail } from './proof-rail'
import { useStage } from './use-stage'
import { cn } from '@/lib/utils'
import type { SceneProps } from './scene-props'

/**
 * 07 — музыкальные клипы. Метафора: РИТМ МОНТАЖА.
 *
 * Единственная сцена, где темп задаёт не прокрутка, а доля. Слово меняется по
 * ровному такту, таймкод идёт вперёд — страница на этом экране перестаёт
 * подчиняться пользователю и начинает подчиняться треку. Это и есть разница
 * между клипом и остальным продакшном.
 *
 * Буквального плеера здесь нет: полоса воспроизведения и кнопка play
 * превратили бы кадр в интерфейс, хотя кадр и должен оставаться главным.
 */

const BEATS = ['Трек', 'задаёт', 'монтаж.'] as const

/** Доля. 480 мс — примерно 125 BPM: темп, на котором смена слова читается */
const BEAT_MS = 480

/** Производственная скорость: по ней и считается таймкод */
const FPS = 24

function timecode(beat: number): string {
  const frames = Math.round((beat * BEAT_MS * FPS) / 1000)
  const seconds = Math.floor(frames / FPS)
  const mm = String(Math.floor(seconds / 60) % 60).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const ff = String(frames % FPS).padStart(2, '0')
  return `TC 00:${mm}:${ss}:${ff}`
}

export function StageMusic({ id, direction, active, onBrief, onNavigate, onCaseOpen }: SceneProps) {
  const { containerRef, reduced } = useStage()
  const [beat, setBeat] = useState(0)
  const lead = direction.works[0]

  /*
   * Такт идёт только пока сцена на экране: фоновый счётчик на странице,
   * которую никто не смотрит, — это работа таймера впустую и лишний рендер
   * на каждые полсекунды. Скрытая вкладка останавливает его по той же причине.
   */
  useEffect(() => {
    if (!active || reduced) return

    const tick = () => {
      if (document.visibilityState === 'visible') setBeat(current => current + 1)
    }

    const timer = window.setInterval(tick, BEAT_MS)
    return () => window.clearInterval(timer)
  }, [active, reduced])

  const spoken = reduced ? BEATS.length - 1 : beat % BEATS.length

  return (
    <StageShell id={id} direction={direction} containerRef={containerRef} depth={240}>
      <div className="absolute inset-0">
        {lead ? (
          <SceneMedia
            work={lead}
            active={active}
            aspect="auto"
            sizes="100vw"
            className="h-full w-full"
          />
        ) : null}
        {/* Зерно принадлежит этой сцене: фирменный оверлей сайта прибит к
            вьюпорту и накрыл бы весь монтаж */}
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/40 to-transparent"
        />
      </div>

      <StageRail direction={direction} />

      {/* Таймкод — та же производственная правда, что и 24 кадра в секунду */}
      <span
        aria-hidden="true"
        className="absolute right-6 top-1/2 z-20 font-mono text-[0.6rem] uppercase tracking-[0.24em] text-white/45 md:right-10 md:text-[0.68rem] lg:right-20"
      >
        {timecode(beat)}
      </span>

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-14 md:px-10 md:pb-16 lg:px-20">
        <StageTitle
          id={id}
          className="text-[clamp(2.8rem,9vw,7.5rem)] [text-shadow:0_2px_40px_rgba(0,0,0,0.5)]"
        >
          {BEATS.map((word, index) => (
            <span
              key={word}
              className={cn('block', index === spoken ? 'text-white' : 'text-white/25')}
            >
              {word}
            </span>
          ))}
        </StageTitle>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
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
