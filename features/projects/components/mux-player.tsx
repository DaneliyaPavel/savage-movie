/**
 * Компонент для воспроизведения видео через Bunny Stream (HLS)
 * Используется в showreel hero и других полноэкранных контекстах
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Hls from 'hls.js'
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
  const hlsRef = useRef<Hls | null>(null)
  const effectiveMuted = autoPlay ? true : muted

  useEffect(() => {
    const video = videoRef.current
    if (!video || !playbackId) return

    const src = getStreamUrl(playbackId)

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
        startLevel: -1,
        maxBufferLength: 30,
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      hlsRef.current = hls
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [playbackId])

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
