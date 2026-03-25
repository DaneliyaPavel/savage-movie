/**
 * Компонент для воспроизведения видео через Bunny Stream (HLS)
 */
'use client'

import { useEffect, useRef } from 'react'
import Hls from 'hls.js'
import { getStreamUrl } from '@/lib/integrations/bunny/client'

interface VideoPlayerProps {
  playbackId: string
  title?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  objectFit?: 'cover' | 'contain'
  className?: string
  onCanPlay?: () => void
}

export function VideoPlayer({
  playbackId,
  title,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  objectFit,
  className,
  onCanPlay,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const effectiveMuted = autoplay ? true : muted

  useEffect(() => {
    const video = videoRef.current
    if (!video || !playbackId) return

    const src = getStreamUrl(playbackId)

    // Safari supports HLS natively
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        startLevel: -1,
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

  return (
    <div className={className}>
      <video
        ref={videoRef}
        autoPlay={autoplay}
        muted={effectiveMuted}
        loop={loop}
        playsInline
        controls={controls}
        onCanPlay={onCanPlay}
        title={title}
        className="w-full h-full"
        style={objectFit ? { objectFit } : undefined}
      />
    </div>
  )
}
