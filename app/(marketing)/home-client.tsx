/**
 * Клиентский компонент для главной страницы
 * Управляет состоянием fullscreen player и gallery carousel
 */
'use client'

import { useState, useCallback } from 'react'
import { ShowreelHero } from '@/components/sections/ShowreelHero'
import { HomeGalleryCarousel } from '@/components/sections/HomeGalleryCarousel'
import { PremiumFullscreenPlayer } from '@/components/ui/premium-fullscreen-player'
import type { Project } from '@/features/projects/api'

interface HomePageClientProps {
  showreelPlaybackId: string
  projects: Project[]
}

export function HomePageClient({ showreelPlaybackId, projects }: HomePageClientProps) {
  const [currentPlaybackId, setCurrentPlaybackId] = useState<string>(showreelPlaybackId)
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Обработчик изменения миниатюры в carousel (меняет главный showreel)
  const handleThumbnailChange = useCallback((playbackId: string | null) => {
    if (playbackId) {
      setCurrentPlaybackId(playbackId)
    }
  }, [])

  // Обработчик клика на миниатюру (открывает fullscreen player)
  const handleThumbnailClick = useCallback((project: Project) => {
    if (project.video_url) {
      // Extract Mux playback ID from URL
      const muxMatch =
        project.video_url.match(/mux\.com\/([^/?]+)/) ||
        project.video_url.match(/playbackId=([^&]+)/)
      const playbackId = muxMatch ? muxMatch[1] : null

      if (playbackId) {
        setSelectedProject(project)
        setIsPlayerOpen(true)
      }
    }
  }, [])

  // Extract playback ID for fullscreen player
  const getFullscreenPlaybackId = () => {
    if (!selectedProject?.video_url) return null
    const muxMatch =
      selectedProject.video_url.match(/mux\.com\/([^/?]+)/) ||
      selectedProject.video_url.match(/playbackId=([^&]+)/)
    return muxMatch?.[1] ?? null
  }

  const poster =
    selectedProject?.images && selectedProject.images[0] ? selectedProject.images[0] : undefined

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Fullscreen Showreel Hero */}
      <ShowreelHero playbackId={currentPlaybackId} />

      {/* Gallery Carousel внизу */}
      <HomeGalleryCarousel
        projects={projects}
        onThumbnailClick={handleThumbnailClick}
        onThumbnailChange={handleThumbnailChange}
      />

      {/* Premium Fullscreen Player */}
      <PremiumFullscreenPlayer
        playbackId={getFullscreenPlaybackId()}
        title={selectedProject?.title}
        isOpen={isPlayerOpen}
        onClose={() => {
          setIsPlayerOpen(false)
          setSelectedProject(null)
        }}
        poster={poster}
      />
    </div>
  )
}
