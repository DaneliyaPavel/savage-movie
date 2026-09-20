'use client'

import { SceneFrame, SceneTitle } from './scene-frame'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { ProofRail } from './proof-rail'
import type { SceneProps } from './scene-props'

/**
 * Сцена 03 — beauty.
 *
 * Самый тёмный экран монтажа и единственный, где заголовок делает то же, что
 * камера. «Ближе» стоит над широким планом, «ещё ближе» — рядом с квадратным
 * макро, которое физически наезжает на этот план сверху. Приближение здесь
 * сделано композицией, а не анимацией: перекрытие остаётся и при выключенном
 * движении, и в статичном скриншоте.
 *
 * Второе слово — единственный красный акцент всей страницы. Если бы красным
 * был набран ещё хотя бы один заголовок, этот перестал бы читаться как удар.
 */
export function SceneBeauty({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const [wide, macro] = direction.works

  return (
    <SceneFrame id={id} direction={direction} theme="black" className="bg-[#0A0A0A]">
      <div className="mt-auto pt-8">
        {/* Широкий план во всю ширину экрана, за обе кромки */}
        {wide ? (
          <div className="-mx-6 md:-mx-10 lg:-mx-20">
            <SceneMedia
              work={wide}
              active={active}
              aspect="21 / 9"
              sizes="100vw"
              className="max-h-[32svh]"
            />
          </div>
        ) : null}

        <div className="relative grid grid-cols-1 items-end gap-y-8 lg:grid-cols-12 lg:gap-x-8">
          {/* Макро наезжает на широкий план сверху — это и есть «ещё ближе» */}
          {macro ? (
            <div className="-mt-10 lg:col-span-4 lg:-mt-24">
              <SceneMedia
                work={{ ...macro, playbackId: null }}
                active={active}
                aspect="1 / 1"
                sizes="(max-width: 1024px) 60vw, 30vw"
                className="max-h-[22svh] w-2/3 lg:w-full"
              />
            </div>
          ) : null}

          <div className="lg:col-span-8">
            <SceneTitle id={id} className="text-[clamp(2.5rem,5.6vw,4.8rem)]">
              Ближе.
              <span className="block text-accent">Ещё ближе.</span>
            </SceneTitle>

            <p className="mt-8 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
              Beauty и product video, где фактура ощущается почти физически.
            </p>

            <DirectionCta
              direction={direction}
              onBrief={onBrief}
              onNavigate={onNavigate}
              className="mt-10"
            />
          </div>
        </div>
      </div>

      <ProofRail
        direction={direction}
        onCaseOpen={onCaseOpen}
        className="mt-10 border-t border-white/10 pt-6"
      />
    </SceneFrame>
  )
}
