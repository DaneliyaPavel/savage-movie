/**
 * Заголовок секции с опциональной графической маркой
 */
'use client'

import { motion } from 'framer-motion'
import { CrossMark, PlusMark, ArrowMark, CircleMark, ScribbleMark } from './graphic-marks'

type MarkType = 'cross' | 'plus' | 'arrow' | 'circle' | 'scribble' | null

interface SectionTitleProps {
  children: React.ReactNode
  mark?: MarkType
  markPosition?: 'before' | 'after' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
}

const sizeClasses = {
  sm: 'text-4xl md:text-5xl',
  md: 'text-5xl md:text-6xl lg:text-7xl',
  lg: 'text-6xl md:text-7xl lg:text-8xl',
  xl: 'text-7xl md:text-8xl lg:text-9xl',
}

const MarkComponent = {
  cross: CrossMark,
  plus: PlusMark,
  arrow: ArrowMark,
  circle: CircleMark,
  scribble: ScribbleMark,
}

export function SectionTitle({
  children,
  mark = null,
  markPosition = 'before',
  className = '',
  size = 'md',
  animate = true,
}: SectionTitleProps) {
  const Mark = mark ? MarkComponent[mark] : null

  const getMarkPositionClasses = () => {
    switch (markPosition) {
      case 'before':
        return 'flex items-center gap-4'
      case 'after':
        return 'flex items-center gap-4'
      case 'top-left':
        return 'relative'
      case 'top-right':
        return 'relative'
      case 'bottom-left':
        return 'relative'
      case 'bottom-right':
        return 'relative'
      default:
        return ''
    }
  }

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : {}}
      whileInView={animate ? { opacity: 1, y: 0 } : {}}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={getMarkPositionClasses()}
    >
      {mark && markPosition === 'before' && Mark && (
        <Mark size={24} className="text-muted-foreground shrink-0" animate={animate} />
      )}
      {mark && ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(markPosition) && Mark && (
        <div className={`absolute ${
          markPosition === 'top-left' ? 'top-0 left-0 -translate-x-full -translate-y-full' :
          markPosition === 'top-right' ? 'top-0 right-0 translate-x-full -translate-y-full' :
          markPosition === 'bottom-left' ? 'bottom-0 left-0 -translate-x-full translate-y-full' :
          'bottom-0 right-0 translate-x-full translate-y-full'
        } text-muted-foreground`}>
          <Mark size={20} animate={animate} />
        </div>
      )}
      <h2 className={`font-heading font-bold ${sizeClasses[size]} text-foreground ${className}`}>
        {children}
      </h2>
      {mark && markPosition === 'after' && Mark && (
        <Mark size={24} className="text-muted-foreground shrink-0" animate={animate} />
      )}
    </motion.div>
  )
}
