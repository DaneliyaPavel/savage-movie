/**
 * Editorial Correction компонент в стиле Freshman.tv
 * Создает эффект "исправленной ошибки" с зачеркиванием и рукописной правкой
 * Поддерживает множественные перечеркивания (как будто ручкой)
 */
'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface EditorialCorrectionProps {
  wrong: string
  correct: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  delay?: number
  strokeColor?: string
  multipleStrokes?: boolean // Несколько перечеркиваний как ручкой
  inline?: boolean // Если true, то wrong и correct на одной линии
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

export function EditorialCorrection({
  wrong,
  correct,
  className = '',
  size = 'md',
  delay = 0,
  strokeColor = '#FFFFFF',
  multipleStrokes = false,
  inline = false,
}: EditorialCorrectionProps) {
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
    if (wrongRef.current) {
      const width = wrongRef.current.offsetWidth
      setPathWidth(width || 100)
    }
  }, [wrong])

  // Анимация зачеркивания
  useEffect(() => {
    if (shouldAnimate) {
      pathLength.set(1)
    } else {
      pathLength.set(0)
    }
  }, [shouldAnimate, pathLength])

  // Создаем SVG path с легкой волной для более естественного вида
  const createScribblePath = (width: number, offset: number = 0) => {
    const points: number[] = []
    const steps = 15
    const waveAmplitude = width * 0.015

    for (let i = 0; i <= steps; i++) {
      const x = (width / steps) * i
      // Добавляем случайное смещение для каждого stroke
      const y = waveAmplitude * Math.sin((i / steps) * Math.PI * 3) + (width * 0.002) + offset
      points.push(x, y)
    }

    return `M ${points[0]},${points[1]} ${points.slice(2).map((p, i) => 
      i % 2 === 0 ? `L ${p}` : `,${p}`
    ).join(' ')}`
  }

  // Для множественных перечеркиваний создаем несколько путей
  const strokes = multipleStrokes 
    ? [
        createScribblePath(pathWidth || 100, 0),
        createScribblePath(pathWidth || 100, -1),
        createScribblePath(pathWidth || 100, 1.5),
      ]
    : [createScribblePath(pathWidth || 100)]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`${inline ? 'inline-flex items-baseline gap-3' : 'inline-flex flex-col'} ${className}`}
    >
      {/* Неправильный текст с зачеркиванием */}
      <span
        ref={wrongRef}
        className={`${sizeClasses[size].wrong} font-heading font-bold text-[#FFFFFF]/40 relative inline-block`}
      >
        {wrong}
        {/* SVG зачеркивание с анимацией */}
        <svg
          className="absolute top-1/2 left-0 pointer-events-none"
          width={pathWidth || 100}
          height="6"
          viewBox={`0 0 ${pathWidth || 100} 6`}
          style={{ transform: 'translateY(-50%)' }}
        >
          {strokes.map((path, index) => (
            <motion.path
              key={index}
              d={path}
              stroke={strokeColor}
              strokeWidth={multipleStrokes ? "2" : "2.5"}
              fill="none"
              strokeLinecap="round"
              strokeDasharray="1 0"
              style={{
                pathLength: springPathLength,
                opacity: springPathLength,
              }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={shouldAnimate ? { pathLength: 1, opacity: 0.8 } : { pathLength: 0, opacity: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: delay + index * 0.15,
                ease: [0.16, 1, 0.3, 1] 
              }}
            />
          ))}
        </svg>
      </span>

      {/* Правильный текст (рукописный) */}
      <motion.span
        initial={{ opacity: 0, x: -10, y: -5 }}
        animate={shouldAnimate ? { opacity: 1, x: inline ? 8 : 8, y: inline ? 0 : 4 } : { opacity: 0, x: -10, y: -5 }}
        transition={{ duration: 0.6, delay: delay + 0.4 + (multipleStrokes ? 0.3 : 0), ease: [0.16, 1, 0.3, 1] }}
        className={`${sizeClasses[size].correct} italic text-[#CCFF00] ${inline ? '' : 'mt-2'} relative inline-block transform rotate-[-0.5deg]`}
        style={{
          fontFamily: '"Kalam", "Caveat", "Comic Sans MS", cursive',
          fontWeight: 400,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
        }}
      >
        {correct}
      </motion.span>
    </motion.div>
  )
}
