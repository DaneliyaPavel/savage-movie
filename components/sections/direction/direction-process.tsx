/**
 * Этапы производства направления.
 *
 * Не сетка одинаковых плиток: этапы идут во времени, поэтому читаются как
 * монтажная дорожка — крупный номер, рельс с ромбами-маркерами, строка этапа.
 * Красная линия рельса доходит до «линии чтения» (55% высоты экрана) и
 * идёт за прокруткой (transform), текущий этап зажигается: номер белеет,
 * маркер краснеет. Текст на месте с первого кадра, движение — только декор.
 */
'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'

import type { ProcessStep } from '@/lib/services/pages/types'
import { KIT_KICKER, KIT_TITLE, KIT_TITLE_SIZE, setTitle, typo } from './direction-kit'

import './direction-kit.css'

export interface DirectionProcessProps {
  title: string
  lead?: string
  steps: ProcessStep[]
  index?: string
}

export function DirectionProcess({ title, lead, steps, index }: DirectionProcessProps) {
  const listRef = useRef<HTMLOListElement>(null)
  // -1 — линия чтения ещё не дошла до первого этапа: все этапы приглушены
  const [active, setActive] = useState(-1)
  // Верхние кромки этапов в координатах списка: измеряются при изменении размера,
  // а не на скролле, поэтому прокрутка не читает layout
  const marks = useRef<{ tops: number[]; height: number }>({ tops: [], height: 1 })

  // Линия чтения на 55% высоты экрана: рельс заполнен ровно до неё
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ['start 55%', 'end 55%'],
  })

  // Прогресс 0…1 — это и есть положение линии чтения внутри списка, так что
  // активный этап — последний, чья кромка выше линии. Работает на телефоне,
  // переживает резкий скачок (якорь, восстановление прокрутки) и не зависит от
  // наблюдателя, который мог бы пропустить пересечение
  const activeAt = useCallback((progress: number) => {
    if (progress <= 0) return -1
    const { tops, height } = marks.current
    const line = progress * height
    let found = 0
    // +24px: этап зажигается, когда линия доходит до его маркера, а не до кромки
    tops.forEach((top, position) => {
      if (top + 24 <= line) found = position
    })
    return found
  }, [])

  useMotionValueEvent(scrollYProgress, 'change', progress => setActive(activeAt(progress)))

  useEffect(() => {
    const list = listRef.current
    if (!list || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const nodes = list.querySelectorAll<HTMLElement>('[data-step]')
      marks.current = { tops: Array.from(nodes, node => node.offsetTop), height: list.offsetHeight }
      setActive(activeAt(scrollYProgress.get()))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [activeAt, scrollYProgress])

  const stateOf = (position: number) =>
    position < active ? 'done' : position === active ? 'active' : 'todo'

  return (
    <section
      aria-labelledby="direction-process-title"
      className="border-t border-white/10 bg-[#0D0D0D] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="max-w-3xl">
        {index ? (
          <p className={KIT_KICKER}>
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            {index} / Процесс
          </p>
        ) : null}
        <h2
          id="direction-process-title"
          data-reveal=""
          className={`${KIT_TITLE} ${KIT_TITLE_SIZE} mt-5`}
        >
          {setTitle(title)}
        </h2>
        {lead ? (
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/65 [text-wrap:pretty] md:text-lg">
            {typo(lead)}
          </p>
        ) : null}
      </div>

      <ol
        ref={listRef}
        role="list"
        // Для сниженного движения CSS подменяет заливку рельса шагом по этапам
        style={{ '--dk-fill': Math.max(0, active + 1) / steps.length } as CSSProperties}
        className="dir-kit-steps mt-14 md:mt-20"
      >
        <span aria-hidden="true" className="dir-kit-rail">
          <motion.span className="dir-kit-rail-fill" style={{ scaleY: scrollYProgress }} />
        </span>

        {steps.map((step, position) => (
          <li
            key={step.number}
            data-step=""
            data-state={stateOf(position)}
            className="dir-kit-step"
          >
            <span
              aria-hidden="true"
              className="dir-kit-step-num font-brand-hero text-[clamp(3.25rem,7.2vw,6.5rem)] leading-[0.82] tracking-[-0.04em]"
            >
              {step.number}
            </span>
            <span aria-hidden="true" className="dir-kit-step-node">
              <span className="dir-kit-node" />
            </span>
            <div className="dir-kit-step-body lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-x-14">
              <h3 className="dir-kit-step-title mt-4 text-[clamp(1.5rem,2.5vw,2.25rem)] font-light leading-[1.1] tracking-[-0.015em] [text-wrap:balance] md:mt-0">
                {typo(step.title)}
              </h3>
              <p className="dir-kit-step-text mt-3 max-w-[30rem] text-[0.9375rem] leading-[1.65] [text-wrap:pretty] md:text-base lg:mt-1">
                {typo(step.text)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
