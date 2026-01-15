/**
 * Компонент для воспроизведения видео через Mux
 */
'use client'

import MuxPlayer from '@mux/mux-player-react'

interface VideoPlayerProps {
  playbackId: string
  title?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  className?: string
}

export function VideoPlayer({
  playbackId,
  title,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
  className,
}: VideoPlayerProps) {
  return (
    <div className={className}>
      <MuxPlayer
        playbackId={playbackId}
        streamType="on-demand"
        metadata={{
          video_title: title || 'Video',
        }}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        className="w-full h-full"
      />
    </div>
  )
}
