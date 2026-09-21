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
 * Полоса на бренд: активная раскрывается почти во весь разворот, остальные
 * сжимаются до кромок. Одежду снимают в рост, поэтому и кадр здесь
 * вертикальный, а не обрезанный горизонтальной рамкой. Полоса выбирается сама
 * по ходу прокрутки, наведение и касание перехватывают выбор.
 *
 * Разворот, а не полноэкранная заливка. Прежде полосы занимали экран целиком,
 * а чёрный набор читался только под белой пеленой поверх нижней половины
 * кадра — то есть самая editorial территория держалась на том, что портила
 * собственные кадры. Теперь у полос есть поле: они стоят в верхней части
 * листа, а заявление и индекс брендов живут на чистом белом под ними. Белое
 * здесь не «фон другой секции», а бумага, и кадру ничего не мешает.
 *
 * Лента уходит за левую кромку и останавливается по правому полю: разворот
 * продолжается за пределами листа ровно с одной стороны.
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

  /*
   * Работа без единого кадра полосой не становится. Пустой контейнер рисовался
   * чёрным прямоугольником посреди белого разворота — дыра в ленте, которая
   * читается как сбой загрузки, а не как приём.
   */
  const works = direction.works.filter(work => work.posterUrl || work.playbackId).slice(0, 4)
  const autoIndex = useStageStep(progress, Math.max(works.length, 1), reduced)
  const [override, setOverride] = useState<number | null>(null)

  const activeIndex = Math.min(override ?? autoIndex, Math.max(works.length - 1, 0))
  const current = works[activeIndex]

  return (
    <StageShell id={id} direction={direction} containerRef={containerRef} depth={280} theme="white">
      {/*
        В технической строке — форматы направления, а не список брендов:
        имена ZARINA, MAVIN, SENSUAL и NAUMI набраны индексом прямо под
        кадрами, и второй их перечень поверх того же разворота был бы одним
        списком, напечатанным дважды.
      */}
      <StageRail direction={direction} theme="white" meta="CAMPAIGN / DROP / LOOKBOOK" />

      {/* Лента разворота: уходит за левую кромку, встаёт по правому полю */}
      <div className="absolute inset-x-0 bottom-[34%] top-[7rem] flex pr-6 md:bottom-[34%] md:top-[8.5rem] md:pr-10 lg:pr-20">
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
                'group relative flex h-full min-w-0 flex-col',
                'transition-[flex-grow] duration-[620ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
                'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-accent'
              )}
              style={{ flexGrow: isOpen ? 5 : 1, flexBasis: 0 }}
            >
              <span className="relative block min-h-0 w-full flex-1 overflow-hidden bg-[#F2F2F2]">
                {/* Видео — только у раскрытой полосы; остальные живут кадром */}
                <SceneMedia
                  work={isOpen ? work : { ...work, playbackId: null }}
                  active={active && isOpen}
                  aspect="auto"
                  sizes={isOpen ? '70vw' : '16vw'}
                  /* Бумага, а не чёрный: тёмный кадр на сжатой полосе читался
                     дырой в ленте, хотя это просто тёмный кадр */
                  className="h-full w-full bg-[#F2F2F2]"
                />
              </span>

              {/*
                Индекс брендов набран на бумаге под кадром, а не поверх него.
                Вертикальная подпись по шву была меткой только для того, кто
                уже догадался её искать: на светлом кадре она пропадала, а на
                сжатой полосе шириной в палец пропадала совсем.
              */}
              <span
                className={cn(
                  'block truncate pr-3 pt-3 text-left font-mono text-[0.56rem] uppercase tracking-[0.22em] transition-colors md:text-[0.66rem]',
                  /* Первая подпись встаёт по полю листа, хотя её кадр уходит
                     за кромку: поле держит набор, кромку переходит только
                     изображение */
                  index === 0 && 'pl-6 md:pl-10 lg:pl-20',
                  /* На телефоне сжатая полоса шириной в палец, и её имя
                     обрезается до «MAV…». Обрезок читается сбоем набора, а не
                     индексом: подписаны только раскрытая полоса и всё, что
                     помещается начиная с планшета. Место под строку остаётся
                     занятым, иначе сжатые кадры окажутся выше раскрытого */
                  !isOpen && 'opacity-0 md:opacity-100',
                  isOpen ? 'text-[#0D0D0D]' : 'text-black/35 group-hover:text-black/70'
                )}
              >
                {work.client}
              </span>
            </button>
          )
        })}
      </div>

      <div className="relative z-20 flex h-full flex-col justify-end px-6 pb-12 md:px-10 md:pb-14 lg:px-20">
        <StageTitle id={id} className="text-[clamp(2.4rem,7.4vw,6.4rem)] text-[#0D0D0D]">
          Одежда
          <br />
          должна двигаться.
        </StageTitle>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
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
              className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-black/50 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-[0.68rem]"
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
