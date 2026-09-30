/**
 * Этапы производства направления.
 *
 * Не сетка одинаковых плиток: этапы идут во времени, поэтому читаются как
 * плёнка — номер-таймкод, тонкая линия, крупная строка этапа. Линия
 * дорисовывается от скролла (transform), текст на месте с первого кадра.
 */
'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

import type { ProcessStep } from '@/lib/services/pages/types'

export interface DirectionProcessProps {
  title: string
  lead?: string
  steps: ProcessStep[]
  index?: string
}

export function DirectionProcess({ title, lead, steps, index }: DirectionProcessProps) {
  const listRef = useRef<HTMLOListElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ['start 75%', 'end 60%'],
  })
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section
      aria-labelledby="direction-process-title"
      className="border-t border-white/10 bg-[#0D0D0D] px-6 py-20 md:px-10 md:py-28 lg:px-20"
    >
      <div className="max-w-3xl">
        {index ? (
          <p className="type-meta font-mono uppercase text-white/50">{index} / Процесс</p>
        ) : null}
        <h2
          id="direction-process-title"
          data-reveal=""
          className="mt-4 font-stage text-[clamp(1.6rem,3.4vw,2.8rem)] uppercase leading-[0.92] tracking-[-0.02em] text-white"
        >
          {title}
        </h2>
        {lead ? (
          <p className="mt-5 text-base leading-relaxed text-white/60 md:text-lg">{lead}</p>
        ) : null}
      </div>

      <ol ref={listRef} className="relative mt-14 md:mt-20">
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 w-px bg-white/10 md:left-[7.5rem]"
        />
        <motion.span
          aria-hidden="true"
          style={{ scaleY: reduced ? 1 : scaleY }}
          className="absolute bottom-0 left-0 top-0 w-px origin-top bg-accent md:left-[7.5rem]"
        />
        {steps.map(step => (
          <li
            key={step.number}
            data-reveal=""
            className="relative grid gap-3 pb-12 pl-6 last:pb-0 md:grid-cols-[7.5rem_1fr] md:gap-0 md:pb-16 md:pl-0"
          >
            <span className="type-meta font-mono uppercase text-white/50 md:pt-3">
              {step.number}
            </span>
            <div className="md:pl-12">
              <h3 className="text-xl font-light tracking-tight text-white md:text-3xl">
                {step.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 md:text-base">
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
