"use client"

import type React from "react"

import { useState, useRef, useEffect, useId } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface HoverNoteProps {
  children: React.ReactNode
  note?: string
  // Backward-compatible alias (legacy call sites)
  text?: string
  // Backward-compatible prop (not used, kept for compatibility)
  position?: string
  className?: string
}

export function HoverNote({ children, note, text, className = "" }: HoverNoteProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()
  const label = note ?? text ?? ""
  const showTooltip = isHovered && Boolean(label)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current && isHovered) {
        const rect = containerRef.current.getBoundingClientRect()
        setPosition({
          x: e.clientX - rect.left + 15,
          y: e.clientY - rect.top - 10,
        })
      }
    }

    if (isHovered) {
      window.addEventListener("mousemove", handleMouseMove)
    }

    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isHovered])

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      tabIndex={label ? 0 : undefined}
      aria-describedby={showTooltip ? tooltipId : undefined}
    >
      {children}
      <AnimatePresence>
        {showTooltip && (
          <motion.span
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-none absolute z-50 whitespace-nowrap text-sm text-accent"
            style={{
              left: position.x,
              top: position.y,
              fontFamily: "var(--font-handwritten), cursive",
            }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
