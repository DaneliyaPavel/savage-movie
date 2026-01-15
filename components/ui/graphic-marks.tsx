/**
 * Графические марки в стиле Freshman.tv
 * SVG компоненты для декоративных элементов: x, +, стрелки, круги, подчеркивания
 */
'use client'

import { motion, SVGMotionProps } from 'framer-motion'

interface GraphicMarkProps {
  className?: string
  size?: number
  color?: string
  animate?: boolean
}

const defaultSize = 24
const defaultColor = 'currentColor'

/**
 * Крестик (x)
 */
export function CrossMark({ 
  className = '', 
  size = defaultSize, 
  color = defaultColor,
  animate = true 
}: GraphicMarkProps) {
  const pathProps: SVGMotionProps<SVGPathElement> = animate ? {
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: 'easeOut' }
  } : {}

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      initial={animate ? { opacity: 0, scale: 0.8 } : {}}
      whileInView={animate ? { opacity: 1, scale: 1 } : {}}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <motion.path
        d="M6 6L18 18M18 6L6 18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        {...pathProps}
      />
    </motion.svg>
  )
}

/**
 * Плюс (+)
 */
export function PlusMark({ 
  className = '', 
  size = defaultSize, 
  color = defaultColor,
  animate = true 
}: GraphicMarkProps) {
  const pathProps: SVGMotionProps<SVGPathElement> = animate ? {
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: 'easeOut' }
  } : {}

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      initial={animate ? { opacity: 0, scale: 0.8 } : {}}
      whileInView={animate ? { opacity: 1, scale: 1 } : {}}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <motion.path
        d="M12 6V18M6 12H18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        {...pathProps}
      />
    </motion.svg>
  )
}

/**
 * Стрелка вправо (→)
 */
export function ArrowMark({ 
  className = '', 
  size = defaultSize, 
  color = defaultColor,
  animate = true 
}: GraphicMarkProps) {
  const pathProps: SVGMotionProps<SVGPathElement> = animate ? {
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: 'easeOut' }
  } : {}

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      initial={animate ? { opacity: 0, x: -10 } : {}}
      whileInView={animate ? { opacity: 1, x: 0 } : {}}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <motion.path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...pathProps}
      />
    </motion.svg>
  )
}

/**
 * Круг (○)
 */
export function CircleMark({ 
  className = '', 
  size = defaultSize, 
  color = defaultColor,
  animate = true 
}: GraphicMarkProps) {
  const pathProps: SVGMotionProps<SVGCircleElement> = animate ? {
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: 'easeOut' }
  } : {}

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      initial={animate ? { opacity: 0, scale: 0.8 } : {}}
      whileInView={animate ? { opacity: 1, scale: 1 } : {}}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        {...pathProps}
      />
    </motion.svg>
  )
}

/**
 * Подчеркивание (underline)
 */
export function UnderlineMark({ 
  className = '', 
  width = 100, 
  color = defaultColor,
  animate = true 
}: { className?: string; width?: number; color?: string; animate?: boolean }) {
  const pathProps: SVGMotionProps<SVGLineElement> = animate ? {
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: 'easeOut' }
  } : {}

  return (
    <motion.svg
      width={width}
      height="2"
      viewBox={`0 0 ${width} 2`}
      fill="none"
      className={className}
    >
      <motion.line
        x1="0"
        y1="1"
        x2={width}
        y2="1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        {...pathProps}
      />
    </motion.svg>
  )
}

/**
 * Случайная линия/зачеркивание (scribble)
 */
export function ScribbleMark({ 
  className = '', 
  width = 100, 
  color = defaultColor,
  animate = true 
}: { className?: string; width?: number; color?: string; animate?: boolean }) {
  // Легкая случайность в пути для более естественного вида
  const path = `M 0,10 Q ${width * 0.3},8 ${width * 0.5},10 T ${width},10`
  
  const pathProps: SVGMotionProps<SVGPathElement> = animate ? {
    initial: { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: 'easeOut' }
  } : {}

  return (
    <motion.svg
      width={width}
      height="20"
      viewBox={`0 0 ${width} 20`}
      fill="none"
      className={className}
    >
      <motion.path
        d={path}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        {...pathProps}
      />
    </motion.svg>
  )
}
