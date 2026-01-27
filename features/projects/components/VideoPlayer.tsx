/**
 * Компонент для воспроизведения видео через Mux
 */
'use client'

import type React from 'react'
import MuxPlayer from '@mux/mux-player-react'

type MuxStyle = React.CSSProperties & Record<`--${string}`, string>

interface VideoPlayerProps {
  playbackId: string
  title?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
  objectFit?: 'cover' | 'contain'
  className?: string
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
}: VideoPlayerProps) {
  const playerStyle = {
    '--controls': controls ? 'flex' : 'none',
    ...(objectFit ? { '--media-object-fit': objectFit } : {}),
  } as MuxStyle

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
        style={playerStyle}
        className="w-full h-full"
      />
    </div>
  )
}
