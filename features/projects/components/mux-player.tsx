/**
 * Компонент для воспроизведения видео через Bunny Stream (HLS)
 * Используется в showreel hero и других полноэкранных контекстах
 */
'use client'

import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useHlsSource } from '@/components/media/use-hls-source'
import { getStreamUrl } from '@/lib/integrations/bunny/client'

interface VideoPlayerProps {
  playbackId: string
  poster?: string
  className?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
}

export function VideoPlayer({
  playbackId,
  poster,
  className = '',
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const effectiveMuted = autoPlay ? true : muted

  // Единая фабрика: стратегия по движку, уровень под размер блока, destroy при размонтировании
  useHlsSource(videoRef, {
    src: playbackId ? getStreamUrl(playbackId) : null,
    useCase: controls ? 'player' : 'background',
  })

  const handleError = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[VideoPlayer] Media error suppressed')
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`relative overflow-hidden ${className}`}
    >
      <video
        ref={videoRef}
        poster={poster}
        autoPlay={autoPlay}
        muted={effectiveMuted}
        loop={loop}
        playsInline
        controls={controls}
        onError={handleError}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: 'center' }}
      />
    </motion.div>
  )
}
