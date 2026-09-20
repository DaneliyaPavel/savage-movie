'use client'

import { SceneFrame, SceneTitle } from './scene-frame'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { ProofRail } from './proof-rail'
import type { SceneProps } from './scene-props'

/**
 * Сцена 04 — регулярный production.
 *
 * Коммерчески самая важная сцена раздела и единственная, где главный объект —
 * не кадр, а система. Один мастер-кадр сверху, под ним восемь ячеек выдачи:
 * то, во что одна смена превращается к концу проекта.
 *
 * Сетка нарисована линиями в 1px и набрана техническим шрифтом сознательно —
 * это спецификация производства, а не список услуг с иконками.
 */

/**
 * Что получается из одной съёмочной смены. Порядок — производственный:
 * сначала главный ролик, потом вертикали, потом всё остальное.
 */
const DELIVERABLES = [
  { index: '01', label: 'HERO' },
  { index: '02', label: '9:16' },
  { index: '03', label: '9:16' },
  { index: '04', label: 'LOOP' },
  { index: '05', label: 'PRODUCT' },
  { index: '06', label: 'STORY' },
  { index: '07', label: 'WEBSITE' },
  { index: '08', label: 'RETAIL' },
] as const

export function SceneContent({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const master = direction.works[0]

  return (
    <SceneFrame id={id} direction={direction} theme="black">
      <div className="mt-auto grid grid-cols-1 gap-y-12 pt-14 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-5">
          <SceneTitle id={id} className="text-[clamp(2.2rem,4.6vw,4rem)]">
            Одна смена.
            <br />
            Не один ролик.
          </SceneTitle>

          <p className="mt-8 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
            Планируем систему контента до съёмки: campaign film, vertical, website, social и retail.
          </p>

          <DirectionCta
            direction={direction}
            onBrief={onBrief}
            onNavigate={onNavigate}
            className="mt-10"
          />
        </div>

        <div className="lg:col-span-7">
          {master ? (
            <figure>
              <SceneMedia
                work={master}
                active={active}
                aspect="16 / 9"
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="max-h-[34svh]"
              />
              <figcaption className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/45 md:text-[0.68rem]">
                Мастер-материал — {master.client}
              </figcaption>
            </figure>
          ) : null}

          {/* Раскладка выдачи. Линии сетки собраны из border-t/border-l на
              контейнере и border-r/border-b на ячейках — так в стыках не
              появляется двойной толщины. */}
          <ol className="mt-8 grid grid-cols-2 border-l border-t border-white/12 sm:grid-cols-4">
            {DELIVERABLES.map(item => (
              <li
                key={`${item.index}-${item.label}`}
                className="border-b border-r border-white/12 px-4 py-5"
              >
                <span className="block font-mono text-[0.58rem] tracking-[0.22em] text-white/35">
                  {item.index}
                </span>
                <span className="mt-2 block font-mono text-xs uppercase tracking-[0.18em] text-white/80 md:text-sm">
                  {item.label}
                </span>
              </li>
            ))}
          </ol>
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
