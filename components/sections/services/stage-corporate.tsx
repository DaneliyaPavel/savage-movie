'use client'

import { motion, useTransform } from 'framer-motion'

import { StageRail, StageShell, StageTitle } from './stage-shell'
import { SceneMedia } from './scene-media'
import { DirectionCta } from './direction-cta'
import { useStage } from './use-stage'
import type { SceneProps } from './scene-props'

/**
 * 05 — корпоративный production. Метафора: ПРОСТРАНСТВО СОБИРАЕТСЯ.
 *
 * Сцена открывается почти пустым белым экраном: только заявление. Дальше в
 * этот белый лист с трёх сторон въезжают плоскости материала и режут его на
 * архитектуру. Бизнес здесь буквально становится физическим — и это делает
 * композиция, а не эпитет в копии.
 *
 * Плоскости въезжают с разным опозданием и с разной скоростью: одновременное
 * прибытие читалось бы как раскрывающаяся галерея, а не как собирающееся
 * пространство.
 *
 * Собираются они вокруг текста, а не поверх него: заявление остаётся на белом
 * поле в нижней левой четверти, а материал занимает верхнюю полосу и правый
 * нижний угол. Это не две колонки «текст слева, кадр справа» — белое поле
 * здесь тоже часть архитектуры, и к концу сцены оно оказывается вырезанным
 * с трёх сторон.
 *
 * Ни одного стокового кабинета и ни одного рукопожатия: доказательства —
 * реальные работы для банка, отеля и HoReCa.
 */

/** Что снимаем для бизнеса. Это форматы, а не обещания */
const FORMATS = [
  'BRAND FILM',
  'EMPLOYER VIDEO',
  'ПРОИЗВОДСТВО',
  'ЛЮДИ И КОМАНДА',
  'ТЕХНОЛОГИИ',
  'СОБЫТИЯ',
] as const

export function StageCorporate({
  id,
  direction,
  active,
  onBrief,
  onNavigate,
  onCaseOpen,
}: SceneProps) {
  const { containerRef, progress, reduced } = useStage()
  const [first, second, third] = direction.works

  // При выключенном движении плоскости уже на местах: смысл сцены не должен
  // зависеть от того, доехала ли прокрутка до нужной отметки
  const still: string[] = ['0%', '0%']
  const fromLeft = useTransform(progress, [0.1, 0.48], reduced ? still : ['-104%', '0%'])
  const fromRight = useTransform(progress, [0.26, 0.68], reduced ? still : ['104%', '0%'])
  const fromBottom = useTransform(progress, [0.44, 0.9], reduced ? still : ['104%', '0%'])

  return (
    <StageShell id={id} direction={direction} containerRef={containerRef} depth={300} theme="white">
      <StageRail direction={direction} theme="white" />

      {/* Плоскости режут белое поле. Сдвиг — только transform, без перерисовки */}
      <div className="absolute inset-0">
        <motion.div
          style={{ x: fromLeft }}
          className="absolute left-0 top-0 h-[34%] w-[56%] overflow-hidden will-change-transform md:h-[46%] md:w-[40%]"
        >
          {first ? (
            <SceneMedia
              work={first}
              active={active}
              aspect="auto"
              sizes="46vw"
              className="h-full w-full"
            />
          ) : null}
        </motion.div>

        <motion.div
          style={{ x: fromRight }}
          className="absolute right-0 top-0 h-[44%] w-[44%] overflow-hidden will-change-transform md:h-[62%] md:w-[46%]"
        >
          {second ? (
            <SceneMedia
              work={{ ...second, playbackId: null }}
              active={active}
              aspect="auto"
              sizes="40vw"
              className="h-full w-full"
            />
          ) : null}
        </motion.div>

        <motion.div
          style={{ y: fromBottom }}
          className="absolute bottom-0 right-0 hidden h-[34%] w-[32%] overflow-hidden will-change-transform md:block"
        >
          {third ? (
            <SceneMedia
              work={{ ...third, playbackId: null }}
              active={active}
              aspect="auto"
              sizes="26vw"
              className="h-full w-full"
            />
          ) : null}
        </motion.div>
      </div>

      {/* Заявление живёт в нижней левой четверти — на белом, которое плоскости
          не трогают. Ширина ограничена, чтобы строка не заходила под правый
          нижний кадр */}
      <div className="relative z-10 flex h-full max-w-[56%] flex-col justify-end px-6 pb-14 md:max-w-[52%] md:px-10 md:pb-16 lg:px-20">
        <StageTitle
          id={id}
          className="max-w-[16ch] text-[clamp(1.7rem,3.6vw,3.4rem)] text-[#0D0D0D]"
        >
          Бизнес
          <br />
          не обязан
          <br />
          выглядеть скучно.
        </StageTitle>

        <p className="mt-6 max-w-sm text-sm leading-relaxed text-black/65 md:text-base">
          Brand films, employer video, производство, люди и события — без постановочных рукопожатий.
        </p>

        <ul className="mt-6 flex max-w-md flex-wrap gap-x-6 gap-y-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/45 md:text-[0.66rem]">
          {FORMATS.map(format => (
            <li key={format}>{format}</li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-4">
          <DirectionCta
            direction={direction}
            onBrief={onBrief}
            onNavigate={onNavigate}
            theme="white"
          />

          {first ? (
            <a
              href={`/projects/${first.slug}`}
              onClick={() => onCaseOpen(direction, first.slug)}
              className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-black/50 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent md:text-[0.68rem]"
            >
              {first.client} — {first.title}
            </a>
          ) : null}
        </div>
      </div>
    </StageShell>
  )
}
