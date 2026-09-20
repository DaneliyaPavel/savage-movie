'use client'

import { useState } from 'react'

import { StageRail, StageShell, StageTitle } from './stage-shell'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { useStage, useStageStep } from './use-stage'
import { cn } from '@/lib/utils'
import type { SceneProps } from './scene-props'

/**
 * 02 — fashion. Метафора: ДВИЖУЩИЙСЯ EDITORIAL INDEX.
 *
 * Экран разрезан на вертикальные полосы — по одной на бренд. Имена брендов
 * набраны вдоль швов и работают навигацией: активная полоса раскрывается почти
 * во весь экран, остальные сжимаются до кромок. Одежду снимают в рост, поэтому
 * и кадр здесь вертикальный, а не обрезанный горизонтальной рамкой.
 *
 * Полоса выбирается сама по ходу прокрутки — тогда история рассказывается и
 * без единого жеста. Наведение, фокус и касание перехватывают выбор, пока
 * человек им занят: на телефоне наведения нет, а механика обязана работать
 * одинаково.
 *
 * Поток поднимает только раскрытая полоса. Четыре одновременных кадра — это
 * четыре HLS ради одного видимого.
 */
export function StageFashion({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const { containerRef, progress, reduced } = useStage()
  const works = direction.works.slice(0, 4)
  const autoIndex = useStageStep(progress, Math.max(works.length, 1), reduced)
  const [override, setOverride] = useState<number | null>(null)

  const activeIndex = override ?? Math.min(autoIndex, works.length - 1)
  const current = works[activeIndex]

  return (
    <StageShell id={id} direction={direction} containerRef={containerRef} depth={280} theme="white">
      <div className="absolute inset-0 flex">
        {works.map((work, index) => {
          const isOpen = index === activeIndex

          return (
            <button
              key={work.slug}
              type="button"
              aria-pressed={isOpen}
              aria-label={`Показать работу ${work.client}`}
              onMouseEnter={() => setOverride(index)}
              onFocus={() => setOverride(index)}
              onClick={() => setOverride(index)}
              className={cn(
                'group relative h-full min-w-0 overflow-hidden border-l border-black/10 first:border-l-0',
                'transition-[flex-grow] duration-[620ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent'
              )}
              style={{ flexGrow: isOpen ? 7 : 1, flexBasis: 0 }}
            >
              {/* Видео — только у раскрытой полосы; остальные живут кадром */}
              <SceneMedia
                work={isOpen ? work : { ...work, playbackId: null }}
                active={active && isOpen}
                aspect="auto"
                sizes={isOpen ? '75vw' : '15vw'}
                className="h-full w-full"
              />

              {/* Имя бренда вдоль шва — это и подпись, и навигация */}
              <span
                className={cn(
                  'absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[0.62rem] uppercase tracking-[0.3em] transition-colors md:text-[0.7rem]',
                  '[writing-mode:vertical-rl] rotate-180',
                  isOpen ? 'text-white' : 'text-white/70 group-hover:text-white'
                )}
                style={{ textShadow: '0 1px 14px rgba(0,0,0,0.65)' }}
              >
                {work.client}
              </span>
            </button>
          )
        })}
      </div>

      <StageRail direction={direction} theme="white" className="text-white/75" />

      {/* Белое поле под заголовком: чёрная типографика обязана читаться на
          любом кадре, а плашка превратила бы полосу в карточку */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[46%] bg-gradient-to-t from-white via-white/85 to-transparent"
      />

      <div className="pointer-events-none relative z-20 flex h-full flex-col justify-end px-6 pb-12 md:px-10 md:pb-14 lg:px-20">
        {/* Последняя строка уходит за правую кромку экрана — полоса
            продолжается за пределами листа, как в лукбуке */}
        <StageTitle id={id} className="-mr-[12vw] text-[clamp(2.6rem,8vw,7rem)] text-[#0D0D0D]">
          Одежда
          <br />
          должна
          <br />
          двигаться.
        </StageTitle>

        <div className="pointer-events-auto mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <DirectionCta
            direction={direction}
            onBrief={onBrief}
            onNavigate={onNavigate}
            theme="white"
          />

          {current ? (
            <a
              href={`/projects/${current.slug}`}
              onClick={() => onCaseOpen(direction, current.slug)}
              className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-black/55 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-[0.68rem]"
            >
              {current.client} — {current.title}
              {current.year ? ` · ${current.year}` : ''}
            </a>
          ) : null}
        </div>
      </div>
    </StageShell>
  )
}
