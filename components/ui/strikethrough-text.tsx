/**
 * Улучшенный Strikethrough эффект в стиле Freshman.tv
 * SVG stroke анимация с легкой случайностью (как рука человека)
 */
'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface StrikethroughTextProps {
  mainText: string
  subText?: string
  className?: string
  animate?: boolean
  delay?: number
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  strokeColor?: string
  onHover?: boolean
}

const sizeClasses = {
  sm: 'text-base md:text-lg',
  md: 'text-lg md:text-xl',
  lg: 'text-xl md:text-2xl lg:text-3xl',
  xl: 'text-2xl md:text-3xl lg:text-4xl',
  '2xl': 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl',
}

export function StrikethroughText({
  mainText,
  subText,
  className = '',
  animate = true,
  delay = 0,
  size = 'md',
  strokeColor = 'currentColor',
  onHover = false,
}: StrikethroughTextProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [scrollTriggered, setScrollTriggered] = useState(false)
  const textRef = useRef<HTMLSpanElement>(null)
  const pathLength = useMotionValue(0)
  const springPathLength = useSpring(pathLength, {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  })

  // Создаем SVG path с легкой случайностью для более естественного вида
  const createPath = (width: number) => {
    // Легкая волна для более естественного зачеркивания
    const waveAmplitude = width * 0.01 // 1% от ширины
    const points: number[] = []
    const steps = 20
    
    for (let i = 0; i <= steps; i++) {
      const x = (width / steps) * i
      // Легкая синусоида для волны
      const y = waveAmplitude * Math.sin((i / steps) * Math.PI * 2)
      points.push(x, y + (width * 0.001)) // Небольшой сдвиг для реалистичности
    }
    
    return `M ${points[0]},${points[1]} ${points.slice(2).map((p, i) => 
      i % 2 === 0 ? `L ${p}` : `,${p}`
    ).join(' ')}`
  }

  useEffect(() => {
    if (!textRef.current || !animate || onHover) return

    // Intersection Observer для триггера при скролле
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setScrollTriggered(true)
          }
        })
      },
      { threshold: 0.5 }
    )
    observer.observe(textRef.current)
    return () => observer.disconnect()
  }, [animate, onHover])

  const shouldAnimate = onHover ? isHovered : scrollTriggered

  useEffect(() => {
    if (shouldAnimate) {
      pathLength.set(1)
    } else {
      pathLength.set(0)
    }
  }, [shouldAnimate, pathLength])

  // Получаем ширину текста для SVG path
  const [pathWidth, setPathWidth] = useState(0)

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      if (textRef.current) {
        const width = textRef.current.offsetWidth
        setPathWidth(width || 100)
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [mainText])

  const path = createPath(pathWidth || 100)

  const content = (
    <div 
      className={`inline-flex flex-col ${className}`}
      onMouseEnter={() => onHover && setIsHovered(true)}
      onMouseLeave={() => onHover && setIsHovered(false)}
    >
      <span
        ref={textRef}
        className={`${sizeClasses[size]} font-heading font-bold relative inline-block`}
      >
        {mainText}
        {/* SVG strikethrough с анимацией */}
        {animate && (
          <svg
            className="absolute top-1/2 left-0 pointer-events-none"
            width={pathWidth || 100}
            height="3"
            viewBox={`0 0 ${pathWidth || 100} 3`}
            style={{ transform: 'translateY(-50%)' }}
          >
            <motion.path
              d={path}
              stroke={strokeColor}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="1 0"
              style={{
                pathLength: springPathLength,
                opacity: springPathLength,
              }}
            />
          </svg>
        )}
      </span>
      {subText && (
        <motion.span
          initial={animate && !onHover ? { opacity: 0, y: -10 } : { opacity: 1, y: 0 }}
          animate={shouldAnimate || !animate ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
          className={`${sizeClasses[size]} text-muted-foreground font-light mt-1`}
        >
          {subText}
        </motion.span>
      )}
    </div>
  )

  if (animate && !onHover) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
      >
        {content}
      </motion.div>
    )
  }

  return content
}
