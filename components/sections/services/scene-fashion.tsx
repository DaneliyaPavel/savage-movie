'use client'

import { SceneFrame, SceneTitle } from './scene-frame'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { ProofRail } from './proof-rail'
import type { SceneProps } from './scene-props'

/**
 * Сцена 02 — fashion.
 *
 * Первый слом ритма: белая инверсия. После двух чёрных экранов лист внезапно
 * становится белым — так в монтаже работает смена света, и так выглядит
 * редакционная полоса, на языке которой говорят fashion-бренды.
 *
 * Кадр здесь вертикальный. Не из-за формата доставки, а потому что fashion
 * снимают в рост: горизонтальная рамка обрезает ровно то, ради чего снимают
 * одежду — движение тела целиком.
 */
export function SceneFashion({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const [portrait, second] = direction.works

  return (
    <SceneFrame id={id} direction={direction} theme="white">
      <div className="mt-10 grid grid-cols-1 gap-y-12 lg:mt-14 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-6">
          <SceneTitle id={id} className="text-[clamp(2.5rem,5.8vw,5rem)]">
            Одежда
            <br />
            должна
            <br />
            двигаться.
          </SceneTitle>

          <p className="mt-10 max-w-md text-base leading-relaxed text-black/65 md:text-lg">
            Campaign films, launches, drops и контент для fashion-брендов.
          </p>

          <DirectionCta
            direction={direction}
            onBrief={onBrief}
            onNavigate={onNavigate}
            theme="white"
            className="mt-10"
          />

          <ProofRail
            direction={direction}
            onCaseOpen={onCaseOpen}
            theme="white"
            className="mt-10 border-t border-black/10 pt-6"
          />
        </div>

        {/* Правая колонка — вертикальный кадр и подпись под ним. Второй кадр
            появляется только на широком экране и стоит со сдвигом вниз:
            выровненная пара читалась бы как каталог, а не как полоса. */}
        <div className="lg:col-span-5 lg:col-start-8">
          {portrait ? (
            <figure>
              <SceneMedia
                work={portrait}
                active={active}
                aspect="3 / 4"
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="max-h-[46svh]"
              />
              <figcaption className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-black/45 md:text-[0.68rem]">
                {portrait.client} — {portrait.title}
                {portrait.year ? ` · ${portrait.year}` : ''}
              </figcaption>
            </figure>
          ) : null}

          {second ? (
            <figure className="mt-6 hidden xl:ml-16 xl:block">
              {/* Второй кадр — сознательно статичный: в сцене играет один
                  поток, иначе на широком экране fashion тянет два HLS сразу */}
              <SceneMedia
                work={{ ...second, playbackId: null }}
                active={active}
                aspect="4 / 5"
                sizes="30vw"
                className="max-h-[22svh]"
              />
              <figcaption className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-black/45">
                {second.client} — {second.title}
              </figcaption>
            </figure>
          ) : null}
        </div>
      </div>
    </SceneFrame>
  )
}
