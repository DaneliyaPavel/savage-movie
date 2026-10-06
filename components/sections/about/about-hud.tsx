/**
 * Монтажная линейка страницы: красная нить прогресса сверху и таймкод внизу слева.
 *
 * Страница читается как плёнка: скролл — это воспроизведение, а ТС — позиция
 * кадра (24 к/с, вся страница — три минуты экранного времени). Таймкод пишется
 * прямо в узел, без перерисовки React; полоса — transform. Декор: aria-hidden,
 * pointer-events: none, таймкод только от md, чтобы не спорить с sticky-полосой
 * на телефоне.
 */
'use client'

import { useRef } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'

const FPS = 24
/** Вся страница = три минуты экранного времени */
const TOTAL_FRAMES = 3 * 60 * FPS

const two = (value: number) => String(value).padStart(2, '0')

export function formatTimecode(progress: number): string {
  const frame = Math.round(Math.min(1, Math.max(0, progress)) * TOTAL_FRAMES)
  const ff = frame % FPS
  const seconds = Math.floor(frame / FPS)
  return `${two(Math.floor(seconds / 3600))}:${two(Math.floor(seconds / 60) % 60)}:${two(seconds % 60)}:${two(ff)}`
}

export function AboutHud() {
  const { scrollYProgress } = useScroll()
  const tcRef = useRef<HTMLSpanElement>(null)

  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (tcRef.current) tcRef.current.textContent = formatTimecode(value)
  })

  return (
    <div aria-hidden="true" className="pointer-events-none">
      <motion.span
        className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-accent"
        style={{ scaleX: scrollYProgress }}
      />
      <span className="about-hud-tc dir-kit-meta fixed bottom-6 left-6 z-30 hidden items-center gap-2 font-mono uppercase tabular-nums text-white/60 md:flex lg:left-20">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        TC&nbsp;
        <span ref={tcRef}>00:00:00:00</span>
      </span>
    </div>
  )
}
