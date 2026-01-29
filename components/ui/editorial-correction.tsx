'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface EditorialCorrectionProps {
  wrong: string
  correct: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  inline?: boolean
  delay?: number
}

const sizeClasses: Record<NonNullable<EditorialCorrectionProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
}

export function EditorialCorrection({
  wrong,
  correct,
  className = '',
  size = 'md',
  inline = false,
  delay = 0,
}: EditorialCorrectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <span ref={ref} className={`relative ${inline ? 'inline-block' : 'block'} ${className}`}>
      <span className="relative">
        <span className="text-muted-foreground/60">{wrong}</span>
        {isInView && (
          <motion.svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="0"
              y1="10"
              x2="100"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
              className="text-accent"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay, ease: 'easeInOut' }}
            />
          </motion.svg>
        )}
      </span>
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: delay + 0.3 }}
        className={`absolute -bottom-6 left-0 text-foreground ${sizeClasses[size]}`}
        style={{ fontFamily: 'var(--font-handwritten), cursive' }}
      >
        {correct}
      </motion.span>
    </span>
  )
}
