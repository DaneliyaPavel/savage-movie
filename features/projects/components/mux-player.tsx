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

    // Только Safari действительно умеет нативный HLS. Chrome 149+ возвращает
    // canPlayType="maybe" для HLS, но реально декодить не может — видео зависает
    // с readyState=0. Всё, что не Safari, гоним через hls.js.
    const isAppleSafari =
      typeof navigator !== 'undefined' &&
      /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent)

    if (isAppleSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
        // Старт сразу с высокого качества — без 2–5с замера канала на низком битрейте
        abrEwmaDefaultEstimate: 5_000_000,
        testBandwidth: false,
      })
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        hls.startLevel = data.levels.length - 1
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
