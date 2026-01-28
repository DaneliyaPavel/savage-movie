/**
 * VideoStage - премиум видео плеер с crossfade и fullscreen
 */
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { VideoPlayer } from './VideoPlayer'
import { FullScreenVideoPlayer } from './FullScreenVideoPlayer'
import { Maximize2 } from 'lucide-react'
import { GrainOverlay } from '@/components/ui/grain-overlay'

interface VideoStageProps {
  videoUrl?: string
  playbackId?: string
  poster?: string
  title?: string
}

// Извлекаем playback ID из Mux URL
const getPlaybackId = (url: string | null): string | null => {
  if (!url) return null
  const muxMatch = url.match(/mux\.com\/([^/?]+)/)
  return muxMatch?.[1] ?? null
}

export function VideoStage({ videoUrl, playbackId, poster, title }: VideoStageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [showPoster, setShowPoster] = useState(true)
  
  const resolvedPlaybackId = playbackId || (videoUrl ? getPlaybackId(videoUrl) : null)

  // Сбрасываем состояние при смене видео
  useEffect(() => {
    const resetTimer = window.setTimeout(() => {
      setIsVideoLoaded(false)
      setShowPoster(true)
    }, 0)
    
    // После небольшой задержки показываем видео
    let showVideoTimer: number | undefined
    let hidePosterTimer: number | undefined

    if (resolvedPlaybackId || videoUrl) {
      showVideoTimer = window.setTimeout(() => {
        setIsVideoLoaded(true)
        // Плавное переключение с poster на video
        hidePosterTimer = window.setTimeout(() => setShowPoster(false), 300)
      }, 100)
    }

    return () => {
      window.clearTimeout(resetTimer)
      if (showVideoTimer !== undefined) window.clearTimeout(showVideoTimer)
      if (hidePosterTimer !== undefined) window.clearTimeout(hidePosterTimer)
    }
  }, [resolvedPlaybackId, videoUrl, poster])

  const handleFullscreen = () => {
    setIsFullscreen(true)
  }

  return (
    <>
      <div className="relative w-full aspect-video bg-[#000000] overflow-hidden border border-[#1A1A1A] group">
        <GrainOverlay />

        {/* Poster */}
        <AnimatePresence mode="wait">
          {showPoster && poster && (
            <motion.div
              key="poster"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <Image
                src={poster}
                alt={title || 'Video poster'}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video */}
        <AnimatePresence mode="wait">
          {isVideoLoaded && !showPoster && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {resolvedPlaybackId ? (
                <VideoPlayer
                  playbackId={resolvedPlaybackId}
                  autoplay
                  muted
                  loop
                  controls={false}
                  className="w-full h-full object-cover"
                />
              ) : videoUrl ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src={videoUrl} type="video/mp4" />
                </video>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen button */}
        {!showPoster && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleFullscreen}
            className="absolute bottom-4 right-4 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[#000000]/80 hover:bg-[#000000] border border-[#FFFFFF]/20 hover:border-[#ff2936] text-[#FFFFFF] hover:text-[#ff2936] transition-all opacity-0 group-hover:opacity-100"
            aria-label="Полноэкранный режим"
          >
            <Maximize2 className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        )}

        {/* Placeholder если нет видео и poster */}
        {!resolvedPlaybackId && !videoUrl && !poster && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/sm-logo.svg"
              alt="Savage Movie"
              width={220}
              height={86}
              className="w-28 md:w-36 h-auto opacity-10 invert"
            />
          </div>
        )}
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <FullScreenVideoPlayer
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          videoUrl={videoUrl || undefined}
          playbackId={resolvedPlaybackId || undefined}
          title={title}
        />
      )}
    </>
  )
}
