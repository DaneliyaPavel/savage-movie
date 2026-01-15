/**
 * Премиум Fullscreen Video Player в стиле Freshman.tv
 * Улучшенная версия с плавными анимациями и красивой кнопкой закрытия
 */
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoPlayer } from './VideoPlayer'
import { GrainOverlay } from '@/components/ui/grain-overlay'

interface FullScreenVideoPlayerProps {
  isOpen: boolean
  onClose: () => void
  videoUrl?: string
  playbackId?: string
  title?: string
}

export function FullScreenVideoPlayer({
  isOpen,
  onClose,
  videoUrl,
  playbackId,
  title,
}: FullScreenVideoPlayerProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setIsReady(true)
    } else {
      document.body.style.overflow = 'unset'
      setIsReady(false)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Закрытие по ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] bg-[#000000] flex items-center justify-center"
          onClick={onClose}
        >
          <GrainOverlay />
          
          {/* Красивая кнопка закрытия - top-right corner */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: 20, y: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20, y: -20 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="absolute top-6 right-6 md:top-8 md:right-8 z-20 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-[#FFFFFF] hover:text-[#CCFF00] transition-colors group"
            aria-label="Закрыть"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 md:w-7 md:h-7"
            >
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </motion.button>

          {/* Видео контейнер */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full flex items-center justify-center p-4 md:p-8 lg:p-16"
            onClick={(e) => e.stopPropagation()}
          >
            {isReady && (
              <div className="w-full max-w-7xl aspect-video relative">
                {playbackId ? (
                  <VideoPlayer
                    playbackId={playbackId}
                    title={title}
                    controls
                    autoplay
                    className="w-full h-full"
                  />
                ) : videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full"
                  />
                ) : null}
              </div>
            )}
          </motion.div>

          {/* Заголовок (если есть) */}
          {title && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-center max-w-4xl px-4"
            >
              <h3 className="font-heading font-bold text-xl md:text-2xl lg:text-3xl text-[#FFFFFF] drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                {title}
              </h3>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
