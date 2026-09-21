'use client'

import { motion, useTransform } from 'framer-motion'

import {
  SceneCredit,
  SceneFoot,
  STAGE_BOTTOM,
  STAGE_TOP,
  STAGE_TOP_INSET,
  StageRail,
  StageShell,
  StageTitle,
} from './stage-shell'
import { cn } from '@/lib/utils'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { useStage } from './use-stage'
import type { SceneProps } from './scene-props'

/**
 * 05 — корпоративный production. Метафора: ПРОСТРАНСТВО СОБИРАЕТСЯ.
 *
 * Сцена открывается почти пустым белым листом: только заявление. Дальше в этот
 * лист с трёх сторон въезжают плоскости материала и режут его на архитектуру.
 * Бизнес здесь буквально становится физическим — и это делает композиция, а не
 * эпитет в копии.
 *
 * Плоскости въезжают с разным опозданием и с разной скоростью: одновременное
 * прибытие читалось бы как раскрывающаяся галерея, а не как собирающееся
 * пространство.
 *
 * Верхние две плоскости делят ширину листа без зазора и встают на разной
 * высоте: вместе это одна полоса со ступенчатой нижней кромкой. Раньше между
 * ними оставалось белое поле в четырнадцать процентов, и на экране стояли не
 * архитектура, а три прямоугольника, разложенные по углам. Пространство
 * собирается там, где плоскости смыкаются.
 *
 * Ни одного стокового кабинета и ни одного рукопожатия: доказательства —
 * реальные работы для банка, отеля и HoReCa.
 */

export function StageCorporate({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const { containerRef, progress, reduced } = useStage()
  /*
   * Кадры разложены по слотам, а не по порядку списка. Второй работой
   * направления идёт WELLERY — та же съёмка, которой уже построены сцены 01,
   * 04 и 06; отдав ей самую большую плоскость разворота, страница показала бы
   * один и тот же кадр в четвёртый раз подряд. Большую плоскость занимает
   * следующая работа, WELLERY уходит в малую. Состав направления при этом не
   * меняется: это композиция, а не список.
   */
  const [first, second, third] = direction.works
  const wide = third ?? second
  const inset = third ? second : undefined

  // При выключенном движении плоскости уже на местах: смысл сцены не должен
  // зависеть от того, доехала ли прокрутка до нужной отметки
  const still: string[] = ['0%', '0%']
  const fromLeft = useTransform(progress, [0.1, 0.48], reduced ? still : ['-104%', '0%'])
  const fromRight = useTransform(progress, [0.26, 0.68], reduced ? still : ['104%', '0%'])
  const fromBottom = useTransform(progress, [0.44, 0.9], reduced ? still : ['104%', '0%'])

  return (
    <StageShell id={id} direction={direction} containerRef={containerRef} depth={300} theme="white">
      <StageRail direction={direction} theme="white" />

      {/*
        Правая колонна — одна непрерывная полоса от технической строки до
        нижней кромки, разрезанная надвое.
      */}
      {/* bottom-0, а не inset-y-0: inset-y-0 задаёт то же top, и какое из двух
          объявлений победит, решает порядок правил в собранном CSS, а не
          порядок классов в строке */}
      <div className={cn('absolute bottom-0 right-0 hidden w-[54%] md:block', STAGE_TOP_INSET)}>
        <motion.div
          style={{ x: fromRight }}
          className="absolute inset-x-0 top-0 h-[64%] overflow-hidden will-change-transform"
        >
          {wide ? (
            <SceneMedia
              work={{ ...wide, playbackId: null }}
              active={active}
              aspect="auto"
              sizes="54vw"
              className="h-full w-full"
            />
          ) : null}
        </motion.div>

        <motion.div
          style={{ y: fromBottom }}
          className="absolute inset-x-0 bottom-0 h-[36%] overflow-hidden will-change-transform"
        >
          {inset ? (
            <SceneMedia
              work={{ ...inset, playbackId: null }}
              active={active}
              aspect="auto"
              sizes="54vw"
              className="h-full w-full"
            />
          ) : null}
        </motion.div>
      </div>

      {/*
        Левая колонна — плоскость и заявление в одном потоке.

        Высота плоскости не задана долей экрана, а берётся из остатка: набор
        занимает столько, сколько ему нужно, кадр — всё, что осталось сверху.
        На долях это работало ровно до первого короткого ноутбука: на 1440×720
        блок заявления оказывался выше расчётной отметки, и «БИЗНЕС» уезжал
        чёрным по тёмному кадру. Ступенчатая кромка при этом никуда не делась —
        правая колонна идёт во всю высоту, левая обрывается над текстом.
      */}
      <div /* Поле начинается ниже технической строки: на короткой высоте она
             иначе ложится ровно на верхнюю кромку кадра */
        className={cn('absolute inset-y-0 left-0 z-10 flex w-full flex-col md:w-[46%]', STAGE_TOP)}
      >
        <motion.div
          style={{ x: fromLeft }}
          className="min-h-0 w-full flex-1 overflow-hidden will-change-transform max-md:max-h-[34svh]"
        >
          {first ? (
            <SceneMedia
              work={first}
              active={active}
              aspect="auto"
              sizes="(min-width: 768px) 46vw, 100vw"
              className="h-full w-full"
            />
          ) : null}
        </motion.div>

        <div className={cn('shrink-0 px-6 pt-8 md:px-10 lg:px-20', STAGE_BOTTOM)}>
          <StageTitle
            id={id}
            className="max-w-[14ch] text-[clamp(2.1rem,4.2vw,3.8rem)] text-[#0D0D0D]"
          >
            Бизнес
            <br />
            не обязан
            <br />
            выглядеть скучно.
          </StageTitle>

          <p className="mt-7 max-w-sm text-sm leading-relaxed text-black/65 md:text-base">
            Brand films, employer video, производство, люди и события — без постановочных
            рукопожатий.
          </p>

          {/*
            Перечня форматов под этой строкой больше нет. Он повторял её слово
            в слово: «Brand films, employer video, производство, люди и события»
            выше и BRAND FILM / EMPLOYER VIDEO / ПРОИЗВОДСТВО / ЛЮДИ И СОБЫТИЯ
            ниже — одно и то же, набранное дважды подряд. Осталась та строка, в
            которой есть ещё и интонация. Полный перечень — в спецификации внизу
            страницы.
          */}

          <SceneFoot
            className="mt-8 justify-start"
            cta={
              <DirectionCta
                direction={direction}
                onBrief={onBrief}
                onNavigate={onNavigate}
                theme="white"
                className="whitespace-nowrap"
              />
            }
            aside={
              first ? (
                <SceneCredit
                  href={`/projects/${first.slug}`}
                  onClick={() => onCaseOpen(direction, first.slug)}
                  theme="white"
                >
                  {first.client} — {first.title}
                </SceneCredit>
              ) : undefined
            }
          />
        </div>
      </div>
    </StageShell>
  )
}
