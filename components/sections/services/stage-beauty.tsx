'use client'

import { useState } from 'react'
import { motion, useTransform } from 'framer-motion'

import {
  SceneCredit,
  SceneFoot,
  STAGE_BOTTOM,
  StageRail,
  StageShell,
  StageTitle,
} from './stage-shell'
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
 * Кадр, а не поток. Территория, которая обещает «почти физически», держалась
 * на роликах, у которых половина хронометража уходит в тёмные планы: на
 * экране стояла чёрная плоскость с белым набором, и всю тактильность
 * приходилось доигрывать заголовку. В галереях тех же работ лежат капли
 * сыворотки на скуле в жёстком свете, макро блеска на губах, рука в вязке и
 * лицо в воде — четыре материала, которые читаются пальцами. Наезд остаётся
 * движением сцены, и на неподвижном кадре он честнее: это ход камеры, а не
 * монтаж чужого ролика.
 *
 * Набор стоит по центру высоты, а не у нижней кромки. Шесть территорий подряд
 * прижимали заявление к низу; beauty — тихое состояние страницы, и тишина
 * начинается с того, что здесь композиция горизонтальная: заявление слева,
 * материалы справа, между ними фактура во весь экран.
 */

/** Материал кадра по работе. Ключ — слаг, чтобы подпись не разъехалась с портфолио */
const MATERIAL_BY_SLUG: Record<string, string> = {
  unna: 'SKIN',
  yadah: 'GLOSS',
  vernel: 'FABRIC',
  biotherm: 'WATER',
}

/**
 * Что держим в рамке.
 *
 * SKIN и WATER сняты горизонтально, и на телефоне полноэкранный слот режет их
 * до центральной трети: капли на скуле и лицо в воде стоят левее центра и
 * уезжали за кадр — оставались ухо и шея. GLOSS и FABRIC сняты вертикально и
 * в центровке не нуждаются.
 */
const FOCUS_BY_SLUG: Record<string, string> = {
  unna: '32% 50%',
  biotherm: '42% 50%',
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
      {/*
        Все четыре материала стоят в разметке сразу, друг под другом.
        Переключение — это склейка, а не загрузка: раньше в кадре жила только
        выбранная работа, и на медленной сети после нажатия на GLOSS ещё
        полсекунды висела SKIN, а потом кадр менялся рывком. Слои лежат внутри
        вьюпорта, поэтому браузер тянет их по приближении сцены, успевает
        раскодировать и отдаёт мгновенно; полноэкранного LCP это не касается —
        территория третья по счёту и до неё два экрана прокрутки.
      */}
      <motion.div style={{ scale }} className="absolute inset-0 will-change-transform">
        {works.map((work, position) => (
          <SceneMedia
            key={work.slug}
            /* Поток не поднимаем: у этих работ фактура живёт в кадре, а не в
               хронометраже, и выбранный план сильнее любой своей секунды */
            work={{ ...work, playbackId: null }}
            active={active && position === index}
            aspect="auto"
            sizes="100vw"
            objectPosition={FOCUS_BY_SLUG[work.slug]}
            hidden={position !== index}
            /* Поверхность слоя — чернота этой сцены, а не базовая страницы */
            className="absolute inset-0 h-full w-full bg-[#070707]"
          />
        ))}
      </motion.div>

      {/*
        Плотность ушла влево вслед за набором. Заливка снизу накрывала ровно ту
        часть кадра, ради которой территория и существует; слева она ложится на
        поле, где фактуры и так нет.
      */}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/70 to-transparent md:via-[#070707]/45"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#070707]/70 to-transparent"
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
                /* Зона нажатия у индекса материалов растянута по вертикали
                   псевдоэлементом: сама строка остаётся строкой */
                className={cn(
                  'type-meta relative block font-mono uppercase',
                  'transition-colors duration-[var(--motion-state)] ease-[var(--ease-out-expo)]',
                  "before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']",
                  'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
                  isCurrent
                    ? 'text-white [text-shadow:0_1px_14px_rgba(0,0,0,0.8)]'
                    : 'text-white/35 hover:text-white/70'
                )}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="relative z-10 flex h-full max-w-[72%] flex-col justify-center px-6 md:max-w-[60%] md:px-10 lg:px-20">
        {/* Интерлиньяж свободнее общего: в этой сцене соседние строки сильно
            разного кегля, и на плотном наборе точки над Ё выросшей строки
            выходят за свой строчный бокс и упираются в уменьшившуюся */}
        <StageTitle id={id} leading={1.12} className="[text-shadow:0_2px_40px_rgba(0,0,0,0.55)]">
          {/* Обе строки всегда в разметке: меняется вес присутствия, а не факт */}
          <span
            className={cn(
              /* Смена кегля — движение камеры, а не смена состояния: она идёт
                 по шкале композиции. Измерено: 0,3 мс раскладки на кадр, ни
                 одного пропущенного кадра — свойство остаётся font-size, а не
                 подменяется масштабированием, которое исказило бы вес шрифта */
              'block origin-left transition-[font-size,color] duration-[var(--motion-move)] ease-[var(--ease-out-expo)]',
              closer
                ? 'text-[clamp(1.1rem,2.4vw,2rem)] text-white/45'
                : 'text-[clamp(2.8rem,7vw,6rem)] text-white'
            )}
          >
            Ближе.
          </span>
          <span
            className={cn(
              'block origin-left transition-[font-size,color] duration-[var(--motion-move)] ease-[var(--ease-out-expo)]',
              closer
                ? 'text-[clamp(2.8rem,7vw,6rem)] text-white'
                : 'text-[clamp(1.1rem,2.4vw,2rem)] text-white/35'
            )}
          >
            Ещё ближе.
          </span>
        </StageTitle>
      </div>

      {/* CTA остаётся у нижней кромки: по центру он спорил бы с заявлением за
          одну и ту же оптическую строку */}
      <SceneFoot
        className={cn('absolute inset-x-0 bottom-0 z-10 px-6 md:px-10 lg:px-20', STAGE_BOTTOM)}
        cta={<DirectionCta direction={direction} onBrief={onBrief} onNavigate={onNavigate} />}
        aside={
          current ? (
            <SceneCredit
              href={`/projects/${current.slug}`}
              onClick={() => onCaseOpen(direction, current.slug)}
            >
              {current.client} — {current.title}
            </SceneCredit>
          ) : undefined
        }
      />
    </StageShell>
  )
}
