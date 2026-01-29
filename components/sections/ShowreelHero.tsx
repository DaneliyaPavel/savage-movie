/**
 * Fullscreen Showreel Hero в стиле Freshman.tv
 * Кинематографический fullscreen видео-герой с минимальным UI
 */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import { VideoPlayer } from '@/components/features/mux-player'

interface ShowreelHeroProps {
  playbackId: string
}

export function ShowreelHero({ playbackId }: ShowreelHeroProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Таймаут для показа loading состояния
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-full h-screen h-[100svh] bg-[#000000] overflow-hidden">
      {/* Grain Overlay */}
      <GrainOverlay />

      {/* Video Player - Fullscreen */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 w-full h-full"
      >
        <VideoPlayer
          playbackId={playbackId}
          autoPlay
          muted
          loop
          controls={false}
          className="w-full h-full"
        />
      </motion.div>

      {/* Subtle gradient overlay for better text readability (optional, barely visible) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/20 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
