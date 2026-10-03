/**
 * PremiumFullscreenPlayer - Полноэкранный видео-плеер с премиум анимациями
 * Открывается поверх контента, плавно, с возможностью закрытия по ESC
 */
'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useHlsSource } from '@/components/media/use-hls-source'
import { GrainOverlay } from './grain-overlay'
import { getStreamUrl } from '@/lib/integrations/bunny/client'

interface PremiumFullscreenPlayerProps {
  playbackId: string | null
  title?: string
  isOpen: boolean
  onClose: () => void
  poster?: string
}

export function PremiumFullscreenPlayer({
  playbackId,
  title = 'Video',
  isOpen,
  onClose,
  poster,
}: PremiumFullscreenPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when player is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // HLS через единую фабрику, только пока плеер открыт
  useHlsSource(videoRef, {
    src: playbackId ? getStreamUrl(playbackId) : null,
    useCase: 'player',
    enabled: isOpen,
  })

  if (!playbackId) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[200] bg-[#000000]"
            onClick={onClose}
          >
            <GrainOverlay />
          </motion.div>

          {/* Player Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 md:inset-8 lg:inset-12 z-[201] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <motion.button
              onClick={onClose}
              className="absolute top-0 right-0 z-10 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-[#FFFFFF] hover:text-[#ff2936] transition-colors group"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Закрыть"
            >
              <X className="w-6 h-6 md:w-7 md:h-7" />
            </motion.button>

            {/* Video Player */}
            <div className="relative w-full h-full bg-[#000000] rounded-sm overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                loop={false}
                playsInline
                controls
                poster={poster}
                title={title}
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
