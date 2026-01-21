/**
 * HomeGalleryCarousel - Embla carousel с миниатюрами проектов
 * Расположен внизу home page, с hover notes и интерактивными миниатюрами
 */
'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { HoverNote } from '@/components/ui/hover-note'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import type { Project } from '@/lib/api/projects'
import { Play } from 'lucide-react'
import NextImage from 'next/image'

interface HomeGalleryCarouselProps {
  projects: Project[]
  onThumbnailClick?: (project: Project) => void
  onThumbnailChange?: (playbackId: string | null) => void
}

export function HomeGalleryCarousel({ 
  projects, 
  onThumbnailClick,
  onThumbnailChange 
}: HomeGalleryCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    slidesToScroll: 1,
    dragFree: true,
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    const index = emblaApi.selectedScrollSnap()
    setSelectedIndex(index)
    
    // Callback для изменения главного плеера
    if (onThumbnailChange && projects[index]) {
      const project = projects[index]
      if (project.video_url) {
        // Extract Mux playback ID from URL
        const muxMatch = project.video_url.match(/mux\.com\/([^/?]+)/) || 
                        project.video_url.match(/playbackId=([^&]+)/)
        const playbackId = muxMatch?.[1] ?? null
        onThumbnailChange(playbackId)
      }
    }
  }, [emblaApi, projects, onThumbnailChange])

  useEffect(() => {
    if (!emblaApi) return
    const initTimer = window.setTimeout(() => onSelect(), 0)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      window.clearTimeout(initTimer)
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  // Auto-scroll (optional, медленно)
  useEffect(() => {
    if (!emblaApi) return
    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, 5000) // Каждые 5 секунд

    return () => clearInterval(interval)
  }, [emblaApi])

  if (!projects || projects.length === 0) {
    return null
  }

  return (
    <div className="relative w-full bg-[#000000] border-t border-[#1A1A1A] overflow-hidden">
      <GrainOverlay />
      
      <div className="relative z-10 px-4 md:px-8 lg:px-12 py-8 md:py-12">
        {/* Carousel Container */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 md:gap-6">
            {projects.map((project, index) => {
              const isSelected = index === selectedIndex
              // Get thumbnail URL - use first image or create placeholder
              const thumbnailUrl = project.images && project.images[0] 
                ? project.images[0] 
                : null
              
              return (
                <motion.div
                  key={project.id}
                  className="flex-[0_0_280px] md:flex-[0_0_320px] lg:flex-[0_0_360px] cursor-pointer group"
                  onClick={() => {
                    if (onThumbnailClick) {
                      onThumbnailClick(project)
                    } else {
                      scrollTo(index)
                    }
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <HoverNote text={isSelected ? "playing" : "watch"} position="top" className="w-full">
                    <div className="relative aspect-video bg-[#1A1A1A] overflow-hidden rounded-sm group">
                      {/* Grain overlay on hover */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 z-10 pointer-events-none"
                      >
                        <GrainOverlay />
                      </motion.div>
                      
                      {/* Thumbnail Image */}
                      <motion.div 
                        className="absolute inset-0"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {thumbnailUrl ? (
                          thumbnailUrl.startsWith('/') ? (
                            <NextImage
                              src={thumbnailUrl}
                              alt={project.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 280px, (max-width: 1024px) 320px, 360px"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumbnailUrl}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          // Placeholder если нет изображения
                          <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                            <Play className="w-12 h-12 text-[#FFFFFF]/20" />
                          </div>
                        )}
                      </motion.div>
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/80 via-transparent to-transparent z-[1]" />
                      
                      {/* Subtle overlay on hover */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute inset-0 bg-[#ff2936]/5 z-[2]"
                        transition={{ duration: 0.3 }}
                      />
                      
                      {/* Selected indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 border-2 border-[#ff2936] z-[3]"
                        />
                      )}
                      
                      {/* Play icon on hover */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-[#000000]/30 z-[4]"
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Play className="w-12 h-12 text-[#FFFFFF] fill-[#FFFFFF]" />
                      </motion.div>
                      
                      {/* Project title at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 z-[5]">
                        <h3 className="text-sm md:text-base font-heading font-bold text-[#FFFFFF] truncate">
                          {project.title}
                        </h3>
                        {project.client && (
                          <p className="text-xs text-[#FFFFFF]/60 mt-1 truncate">
                            {project.client}
                          </p>
                        )}
                      </div>
                      
                      {/* Underline draw on hover - editorial style */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff2936] z-[6]"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        style={{ transformOrigin: 'left' }}
                      />
                    </div>
                  </HoverNote>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
