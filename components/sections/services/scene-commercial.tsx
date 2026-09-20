'use client'

import { SceneFrame, SceneTitle } from './scene-frame'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { ProofRail } from './proof-rail'
import type { SceneProps } from './scene-props'

/**
 * Сцена 01 — коммерческий production.
 *
 * Самое понятное направление идёт первым и выглядит прямее остальных: кадр
 * уходит за правую кромку экрана, заголовок стоит слева тремя короткими
 * ударами. Вся сцена прижата к нижнему краю — верхняя половина остаётся
 * паузой между технической строкой и первым словом.
 *
 * Единственное направление со своей страницей, поэтому CTA здесь — настоящая
 * ссылка, а не бриф.
 */
export function SceneCommercial({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const lead = direction.works[0]

  return (
    <SceneFrame id={id} direction={direction} theme="black">
      <div className="mt-auto grid grid-cols-1 items-end gap-y-10 pt-14 lg:grid-cols-12 lg:gap-x-10">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <SceneTitle
            id={id}
            /* Кегль привязан к ширине окна, а не к брейкпоинту: строки
               разбиты вручную, и на 1024 «Запомнить.» при фиксированном
               размере вылезало из своей колонки поверх кадра */
            className="text-[clamp(2.4rem,5.6vw,4.8rem)]"
          >
            Запустить.
            <br />
            Показать.
            <br />
            Запомнить.
          </SceneTitle>

          <p className="mt-8 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
            Рекламные ролики для запуска продукта, кампании, retail, digital и экранов.
          </p>

          <DirectionCta
            direction={direction}
            onBrief={onBrief}
            onNavigate={onNavigate}
            className="mt-10"
          />
        </div>

        {/* Кадр уходит за правую кромку: коммерческий блок — единственный,
            где медиа физически больше текста. Дальше по монтажу это меняется. */}
        <div className="order-1 -mr-6 md:-mr-10 lg:order-2 lg:col-span-7 lg:-mr-20">
          {lead ? (
            <SceneMedia
              work={lead}
              active={active}
              aspect="16 / 9"
              sizes="(max-width: 1024px) 100vw, 62vw"
              /* Потолок высоты: без него на невысоком экране кадр выдавливает
                 заголовок и CTA за пределы сцены. Кроп здесь уместен. */
              className="max-h-[52svh]"
            />
          ) : null}
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
