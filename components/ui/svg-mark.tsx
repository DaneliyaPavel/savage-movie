'use client'

import type React from 'react'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

type MarkType = 'cross' | 'plus' | 'circle' | 'arrow' | 'scribble'

interface SvgMarkProps {
  type: MarkType
  className?: string
  size?: number
  delay?: number
}

export function SvgMark({ type, className = '', size = 24, delay = 0 }: SvgMarkProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const marks: Record<MarkType, React.ReactNode> = {
    cross: (
      <>
        <motion.line
          x1="4"
          y1="4"
          x2="20"
          y2="20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 0.3, delay }}
        />
        <motion.line
          x1="20"
          y1="4"
          x2="4"
          y2="20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 0.3, delay: delay + 0.15 }}
        />
      </>
    ),
    plus: (
      <>
        <motion.line
          x1="12"
          y1="4"
          x2="12"
          y2="20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 0.3, delay }}
        />
        <motion.line
          x1="4"
          y1="12"
          x2="20"
          y2="12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 0.3, delay: delay + 0.15 }}
        />
      </>
    ),
    circle: (
      <motion.circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : {}}
        transition={{ duration: 0.5, delay }}
      />
    ),
    arrow: (
      <motion.path
        d="M4 12h14m-4-4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : {}}
        transition={{ duration: 0.4, delay }}
      />
    ),
    scribble: (
      <motion.path
        d="M3 12c2-3 4-5 7-5s5 2 7 5-2 5-5 5-5-2-7-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : {}}
        transition={{ duration: 0.6, delay }}
      />
    ),
  }

  return (
    <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" className={`${className}`}>
      {marks[type]}
    </svg>
  )
}
