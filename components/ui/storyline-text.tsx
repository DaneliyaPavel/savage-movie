/**
 * StorylineText - текст с перечеркнутым словом внутри предложения
 * Используется для креативных блоков в стиле Freshman.tv
 */
'use client'

import { motion, useMotionValue } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface StorylineTextProps {
  text: string
  crossedWord: string
  replacement: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  delay?: number
}

const sizeClasses = {
  sm: 'text-base md:text-lg',
  md: 'text-lg md:text-xl lg:text-2xl',
  lg: 'text-xl md:text-2xl lg:text-3xl xl:text-4xl',
  xl: 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl',
}

export function StorylineText({
  text,
  crossedWord,
  replacement,
  className = '',
  size = 'lg',
  delay = 0,
}: StorylineTextProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLSpanElement>(null)
  const [pathWidth, setPathWidth] = useState(0)
  const pathLength = useMotionValue(0)

  // Разбиваем текст на части
  const parts = text.split(new RegExp(`(${crossedWord})`, 'gi'))

  // Триггер анимации при скролле
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldAnimate(true)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Обновляем ширину для SVG path
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (wordRef.current) {
        const width = wordRef.current.offsetWidth
        setPathWidth(width || 100)
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [crossedWord])

  // Анимация зачеркивания
  useEffect(() => {
    if (shouldAnimate) {
      pathLength.set(1)
    } else {
      pathLength.set(0)
    }
  }, [shouldAnimate, pathLength])

  // Создаем несколько перечеркиваний (как ручкой)
  const createScribblePath = (width: number, offset: number = 0) => {
    const points: number[] = []
    const steps = 20
    const waveAmplitude = width * 0.02

    for (let i = 0; i <= steps; i++) {
      const x = (width / steps) * i
      const y = waveAmplitude * Math.sin((i / steps) * Math.PI * 2.5) + (width * 0.003) + offset
      points.push(x, y)
    }

    return `M ${points[0]},${points[1]} ${points.slice(2).map((p, i) => 
      i % 2 === 0 ? `L ${p}` : `,${p}`
    ).join(' ')}`
  }

  // Множественные перечеркивания
  const strokes = [
    createScribblePath(pathWidth || 100, 0),
    createScribblePath(pathWidth || 100, -1.5),
    createScribblePath(pathWidth || 100, 2),
    createScribblePath(pathWidth || 100, -0.5),
  ]

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`${sizeClasses[size]} font-light leading-relaxed text-[#FFFFFF]/80 ${className}`}
    >
      {parts.map((part, index) => {
        const isCrossedWord = part.toLowerCase() === crossedWord.toLowerCase()
        
        if (isCrossedWord) {
          return (
            <span key={index} className="relative inline-block mx-1 align-baseline">
              <span
                ref={index === 0 && wordRef ? wordRef : undefined}
                className="font-bold text-[#FFFFFF]/40 relative inline-block"
              >
                {part}
                {/* Множественные перечеркивания (как ручкой) - 4 перечеркивания */}
                <svg
                  className="absolute top-1/2 left-0 pointer-events-none"
                  width={pathWidth || 100}
                  height="12"
                  viewBox={`0 0 ${pathWidth || 100} 12`}
                  style={{ transform: 'translateY(-50%)' }}
                >
                  {strokes.map((path, strokeIndex) => (
                    <motion.path
                      key={strokeIndex}
                      d={path}
                      stroke="#FFFFFF"
                      strokeWidth={strokeIndex === 0 ? "2.5" : "2"}
                      fill="none"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={shouldAnimate ? { pathLength: 1, opacity: strokeIndex === 0 ? 0.9 : 0.5 } : { pathLength: 0, opacity: 0 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: delay + strokeIndex * 0.12,
                        ease: [0.16, 1, 0.3, 1] 
                      }}
                    />
                  ))}
                </svg>
              </span>
              
              {/* Замена рукописным текстом ниже - меньшего размера */}
              <motion.span
                initial={{ opacity: 0, y: -5, x: -5 }}
                animate={shouldAnimate ? { opacity: 1, y: 12, x: 4 } : { opacity: 0, y: -5, x: -5 }}
                transition={{ 
                  duration: 0.5, 
                  delay: delay + 0.6, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="absolute top-full left-0 text-sm md:text-base lg:text-lg italic text-[#ff2936] whitespace-nowrap transform rotate-[-1deg] mt-1"
                style={{
                  fontFamily: '"Kalam", "Caveat", cursive',
                  fontWeight: 400,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                }}
              >
                {replacement}
              </motion.span>
            </span>
          )
        }
        
        return <span key={index}>{part}</span>
      })}
    </motion.div>
  )
}
