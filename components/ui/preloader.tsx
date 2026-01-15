/**
 * Премиум Preloader в стиле Freshman.tv
 * Брендированная анимация 1-1.5 сек, минималистичный дизайн
 */
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PreloaderProps {
  onComplete?: () => void
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Симуляция прогресса с плавным увеличением
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        // Плавное увеличение с замедлением в конце
        const increment = prev < 70 ? 8 : prev < 90 ? 3 : 1
        return Math.min(prev + increment, 100)
      })
    }, 50)

    // Минимальное время показа (1-1.5 сек)
    const minDisplayTime = setTimeout(() => {
      if (progress >= 100) {
        setIsLoading(false)
        setTimeout(() => {
          onComplete?.()
        }, 500) // Задержка для плавного исчезновения
      }
    }, 1200)

    return () => {
      clearInterval(interval)
      clearTimeout(minDisplayTime)
    }
  }, [progress, onComplete])

  useEffect(() => {
    if (progress >= 100 && isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false)
        setTimeout(() => {
          onComplete?.()
        }, 500)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [progress, isLoading, onComplete])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-[#000000] flex items-center justify-center"
        >
          {/* Логотип/Текст с анимацией */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl mb-12 text-[#FFFFFF] tracking-tight"
            >
              SAVAGE MOVIE
            </motion.h1>
            
            {/* Минималистичный прогресс бар */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '200px', opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-[1px] bg-[#404040] mx-auto mb-4 overflow-hidden relative"
            >
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full bg-[#FFFFFF]"
              />
            </motion.div>

            {/* Процент загрузки - минималистично */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-xs text-[#404040] font-mono tracking-wider"
            >
              {Math.round(progress)}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
