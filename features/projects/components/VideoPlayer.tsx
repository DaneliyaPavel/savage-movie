/**
 * Компонент для воспроизведения видео через Bunny Stream (HLS)
 */
'use client'

import { useRef } from 'react'
import { useHlsSource } from '@/components/media/use-hls-source'
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
  const effectiveMuted = autoplay ? true : muted

  // Плеер с контролами: обычный ABR, стратегия (нативный HLS / hls.js) — в фабрике
  useHlsSource(videoRef, {
    src: playbackId ? getStreamUrl(playbackId) : null,
    useCase: 'player',
  })

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
        className={`w-full h-full${objectFit ? ` object-${objectFit}` : ''}`}
      />
    </div>
  )
}
