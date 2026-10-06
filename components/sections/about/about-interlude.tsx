/**
 * Пауза между разделами — кадр во всю ширину и три слова, из которых состоит
 * работа студии: «Идея · Съёмка · Монтаж». Кадр медленно едет и приближается
 * за прокруткой, слова расходятся по строкам в разные стороны. Чистый ритм
 * страницы: после плотных текстовых блоков глаз получает цвет и воздух.
 *
 * Декор: кадр без клиента из библиотеки сцен (не работа и не человек из команды),
 * поэтому блок скрыт от скринридеров. Движение — только transform; при
 * prefers-reduced-motion кадр и слова стоят на месте.
 */
'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'

import { sceneFrame } from '@/lib/services/scene-stills'
import { useReduced } from './use-reduced'

const FRAME = sceneFrame('helmet-wide')
const WORDS = ['Идея', 'Съёмка', 'Монтаж'] as const

function Row({
  word,
  index,
  progress,
  reduced,
}: {
  word: string
  index: number
  progress: ReturnType<typeof useScroll>['scrollYProgress']
  reduced: boolean
}) {
  // Нечётные строки едут вправо, чётные влево: слова «расходятся» по мере прохода блока
  const dir = index % 2 === 0 ? 1 : -1
  const x = useTransform(progress, [0, 1], [`${-9 * dir}%`, `${9 * dir}%`])
  return (
    <motion.span
      className="about-interlude-word block whitespace-nowrap"
      style={{ x: reduced ? 0 : x }}
    >
      {`${word} · ${word} · ${word}`}
    </motion.span>
  )
}

export function AboutInterlude() {
  const reduced = useReduced()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const imageScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.18, 1.08, 1.02])

  return (
    <section
      ref={ref}
      aria-hidden="true"
      className="relative isolate h-[72svh] min-h-[26rem] overflow-hidden border-t border-white/10 bg-black md:h-[88svh]"
    >
      <motion.div
        className="absolute inset-[-10%_0] -z-10"
        style={{ y: reduced ? 0 : imageY, scale: reduced ? 1.04 : imageScale }}
      >
        <Image
          src={FRAME.src}
          alt=""
          fill
          quality={65}
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: FRAME.position }}
        />
      </motion.div>
      <span className="absolute inset-0 -z-10 bg-black/35" />
      <span className="absolute inset-x-0 top-0 -z-10 h-1/3 bg-gradient-to-b from-black to-transparent" />
      <span className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black to-transparent" />

      <div className="flex h-full flex-col justify-center gap-[0.15em] font-brand-hero uppercase leading-[0.9] tracking-[-0.03em] text-white">
        {WORDS.map((word, index) => (
          <Row key={word} word={word} index={index} progress={scrollYProgress} reduced={reduced} />
        ))}
      </div>
    </section>
  )
}
