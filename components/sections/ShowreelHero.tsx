/**
 * Fullscreen Showreel Hero в стиле Freshman.tv
 * Кинематографический fullscreen видео-герой с минимальным UI
 */
'use client'

import { GrainOverlay } from '@/components/ui/grain-overlay'
import { VideoPlayer } from '@/components/features/mux-player'
import { getThumbnailUrl } from '@/lib/integrations/bunny/client'

interface ShowreelHeroProps {
  playbackId: string
}

export function ShowreelHero({ playbackId }: ShowreelHeroProps) {
  const poster = getThumbnailUrl(playbackId)

  return (
    <div className="relative w-full h-screen h-[100svh] bg-[#000000] overflow-hidden">
      {/* Grain Overlay */}
      <GrainOverlay />

      {/* Video Player - Fullscreen */}
      <div className="absolute inset-0 w-full h-full">
        <VideoPlayer
          playbackId={playbackId}
          poster={poster}
          autoPlay
          muted
          loop
          controls={false}
          className="w-full h-full"
        />
      </div>

      {/* Subtle gradient overlay for better text readability (optional, barely visible) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/20 via-transparent to-transparent pointer-events-none" />
    </div>
  )
}
