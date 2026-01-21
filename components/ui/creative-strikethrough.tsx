/**
 * Creative Strikethrough - креативное зеленое перечеркивание как ручкой
 * Используется для заголовка "Проекты" с заменой на "Истории"
 */
'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface CreativeStrikethroughProps {
  wrong: string
  correct: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  delay?: number
}

const sizeClasses = {
  sm: {
    wrong: 'text-xl md:text-2xl',
    correct: 'text-base md:text-lg',
  },
  md: {
    wrong: 'text-2xl md:text-3xl lg:text-4xl',
    correct: 'text-lg md:text-xl lg:text-2xl',
  },
  lg: {
    wrong: 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
    correct: 'text-xl md:text-2xl lg:text-3xl',
  },
  xl: {
    wrong: 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
    correct: 'text-2xl md:text-3xl lg:text-4xl',
  },
}

export function CreativeStrikethrough({
  wrong,
  correct,
  className = '',
  size = 'xl',
  delay = 0,
}: CreativeStrikethroughProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const wrongRef = useRef<HTMLSpanElement>(null)
  const [pathWidth, setPathWidth] = useState(0)
  const pathLength = useMotionValue(0)
  const springPathLength = useSpring(pathLength, {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  })

  // Триггер анимации при скролле
  useEffect(() => {
    if (!wrongRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldAnimate(true)
          }
        })
      },
      { threshold: 0.5 }
    )
    observer.observe(wrongRef.current)
    return () => observer.disconnect()
  }, [])

  // Обновляем ширину для SVG path
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (wrongRef.current) {
        const width = wrongRef.current.offsetWidth
        setPathWidth(width || 100)
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [wrong])

  // Анимация зачеркивания
  useEffect(() => {
    if (shouldAnimate) {
      pathLength.set(1)
    } else {
      pathLength.set(0)
    }
  }, [shouldAnimate, pathLength])

  // Создаем SVG path с креативными неровностями для эффекта "как ручкой"
  const createScribblePath = (width: number, offset: number = 0) => {
    const points: number[] = []
    const steps = 20
    const waveAmplitude = width * 0.02
    const roughness = width * 0.008 // Неровность для эффекта ручки

    for (let i = 0; i <= steps; i++) {
      const x = (width / steps) * i
      // Создаем волнистую линию с случайными неровностями
      const baseY = waveAmplitude * Math.sin((i / steps) * Math.PI * 2.5)
      // Детерминированный "noise" вместо Math.random (React purity)
      const seed = i * 12.9898 + offset * 78.233 + width * 0.1
      const raw = Math.sin(seed) * 10000
      const noise = raw - Math.floor(raw)
      const randomOffset = (noise - 0.5) * roughness
      const y = baseY + randomOffset + offset
      points.push(x, y)
    }

    return `M ${points[0]},${points[1]} ${points.slice(2).map((p, i) => 
      i % 2 === 0 ? `L ${p}` : `,${p}`
    ).join(' ')}`
  }

  // Несколько перечеркиваний для эффекта "как ручкой" - зеленым цветом
  const strokes = [
    createScribblePath(pathWidth || 100, 0),
    createScribblePath(pathWidth || 100, -1.5),
    createScribblePath(pathWidth || 100, 2),
    createScribblePath(pathWidth || 100, -0.8),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-baseline gap-4 ${className}`}
    >
      {/* Неправильный текст с зеленым перечеркиванием */}
      <span
        ref={wrongRef}
        className={`${sizeClasses[size].wrong} font-heading font-bold text-[#FFFFFF]/40 relative inline-block`}
      >
        {wrong}
        {/* SVG перечеркивание зеленым цветом с анимацией */}
        <svg
          className="absolute top-1/2 left-0 pointer-events-none"
          width={pathWidth || 100}
          height="12"
          viewBox={`0 0 ${pathWidth || 100} 12`}
          style={{ transform: 'translateY(-50%)' }}
        >
          {strokes.map((path, index) => (
            <motion.path
              key={index}
              d={path}
              stroke="#00FF00" // Зеленый цвет для перечеркивания
              strokeWidth={index === 0 ? "3" : "2"}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="1 0"
              style={{
                pathLength: springPathLength,
                opacity: springPathLength,
              }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={shouldAnimate ? { pathLength: 1, opacity: index === 0 ? 0.9 : 0.6 } : { pathLength: 0, opacity: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: delay + index * 0.1,
                ease: [0.16, 1, 0.3, 1] 
              }}
            />
          ))}
        </svg>
      </span>

      {/* Правильный текст (рукописный) - "Истории" */}
      <motion.span
        initial={{ opacity: 0, x: -10, y: -5 }}
        animate={shouldAnimate ? { opacity: 1, x: 8, y: 4 } : { opacity: 0, x: -10, y: -5 }}
        transition={{ duration: 0.6, delay: delay + 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`${sizeClasses[size].correct} italic text-[#ff2936] relative inline-block transform rotate-[-0.5deg]`}
        style={{
          fontFamily: 'var(--font-handwritten), "Kalam", "Caveat", cursive',
          fontWeight: 400,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        }}
      >
        {correct}
      </motion.span>
    </motion.div>
  )
}
