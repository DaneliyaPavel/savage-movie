/**
 * Language Toggle - RU/EN stamp toggle in a circle
 * Top-left of fullscreen menu
 */
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HoverNote } from './hover-note'

export function LanguageToggle() {
  const [language, setLanguage] = useState<'RU' | 'EN'>('RU')

  const buttonVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    hover: { scale: 1.05, rotate: 2 },
    tap: { scale: 0.95 },
  }

  const circleVariants = {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 0.4 },
    hover: { opacity: 0.6 },
  }

  const innerCircleVariants = {
    initial: { pathLength: 0, opacity: 0 },
    hover: { pathLength: 1, opacity: 0.6 },
  }

  const toggleLanguage = () => {
    setLanguage(language === 'RU' ? 'EN' : 'RU')
    // TODO: Implement actual language switching logic
  }

  return (
    <HoverNote text={language === 'RU' ? 'switch to EN' : 'переключить на RU'} position="bottom">
      <motion.button
        variants={buttonVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        whileHover="hover"
        whileTap="tap"
        onClick={toggleLanguage}
        className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center group cursor-pointer"
        aria-label="Переключить язык"
      >
        {/* Circle outline - animated draw */}
        <motion.svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0">
          <motion.circle
            cx="28"
            cy="28"
            r="26"
            stroke="#FFFFFF"
            strokeWidth="1"
            fill="none"
            variants={circleVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* Inner dashed circle on hover */}
          <motion.circle
            cx="28"
            cy="28"
            r="22"
            stroke="#ff2936"
            strokeWidth="1"
            fill="none"
            strokeDasharray="3 3"
            variants={innerCircleVariants}
            initial="initial"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.svg>

        {/* Text */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={language}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="text-xs md:text-sm font-medium text-[#FFFFFF]/70 group-hover:text-[#ff2936] transition-colors relative z-10"
          >
            {language}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </HoverNote>
  )
}
