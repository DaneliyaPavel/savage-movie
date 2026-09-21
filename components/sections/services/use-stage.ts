'use client'

import { useMemo, useRef, useState, type RefObject } from 'react'
import { useMotionValueEvent, useReducedMotion, useScroll, type MotionValue } from 'framer-motion'

/**
 * Положение внутри сцены — источник всей геометрии раздела.
 *
 * Раздел направлений устроен так: каждая территория — высокий контейнер, внутри
 * которого залипает сцена ровно в высоту экрана. Пока контейнер проходит мимо,
 * сцена остаётся на месте, а её прогресс идёт от 0 до 1. Из этого прогресса
 * собирается всё: раскрытие колонок, приближение макро, деление кадра на восемь,
 * движение шва, монтажные удары.
 *
 * Скролл при этом обычный. Перехватывать его было бы честнее к жанру, но у
 * этой страницы есть конверсия, поиск и телефон, а перехваченный скролл ломает
 * ровно их — не говоря о клавиатуре и о том, что жюри самого сильного
 * референса поставило именно usability самый низкий балл.
 */

const STAGE_OFFSET = ['start start', 'end end'] as const

export interface Stage {
  /** Вешается на высокий контейнер территории */
  containerRef: RefObject<HTMLElement | null>
  /** 0 — сцена только встала, 1 — сейчас уедет */
  progress: MotionValue<number>
  /**
   * Человек попросил убрать движение. Сцены в этом состоянии показывают не
   * первый свой кадр, а полную композицию: смысл сцены не должен зависеть от
   * того, доехал ли скролл до нужной отметки.
   */
  reduced: boolean
}

export function useStage(): Stage {
  const containerRef = useRef<HTMLElement>(null)
  const reduced = useReducedMotion() ?? false

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: [...STAGE_OFFSET],
  })

  return useMemo(
    () => ({ containerRef, progress: scrollYProgress, reduced }),
    [scrollYProgress, reduced]
  )
}

/**
 * Дискретный шаг сцены: монтажный удар, а не плавная интерполяция.
 *
 * Нужен там, где геометрия меняется скачком — слово сменилось, кадр разделился
 * на четыре, шов исчез. Плавность для таких событий была бы неправильной:
 * склейка не растворяется, она происходит.
 *
 * При выключенном движении шаг сразу последний — сцена показывает свой итог.
 */

/**
 * Мёртвая зона у границы шага, в долях шага.
 *
 * Без неё шаг считался через Math.floor от голого прогресса, то есть
 * переключался ровно на целом значении. Прокрутка не бывает ровной: инерция
 * тачпада и дрожание колеса дают полпикселя туда-обратно, и остановка ровно
 * на границе заставляла склейку срабатывать несколько раз подряд. На экране
 * это читалось как мигание слова, а не как монтаж — цвет даже не успевал
 * дойти до конца перехода и разворачивался обратно.
 *
 * Шесть процентов шага — это около тридцати пикселей прокрутки в рекламной
 * сцене: дрожание съедается целиком, а намеренное движение пальца проходит
 * границу и не замечает её.
 */
const STEP_DEADBAND = 0.06

export function useStageStep(
  progress: MotionValue<number>,
  steps: number,
  reduced: boolean
): number {
  const [step, setStep] = useState(() => (reduced ? steps - 1 : 0))

  useMotionValueEvent(progress, 'change', value => {
    if (reduced) return
    // Последний шаг занимает остаток шкалы, поэтому итог сцены успевает
    // постоять на экране, а не мелькает на самой кромке контейнера
    const raw = value * steps

    setStep(current => {
      // Вперёд — только когда граница пройдена с запасом; назад — так же
      if (raw >= current + 1 + STEP_DEADBAND) return Math.min(steps - 1, Math.floor(raw))
      if (raw <= current - STEP_DEADBAND) return Math.max(0, Math.floor(raw))
      return current
    })
  })

  return reduced ? steps - 1 : step
}
