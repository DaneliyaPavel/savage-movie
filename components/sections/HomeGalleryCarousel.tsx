'use client'

import { useCallback, useEffect, useRef, memo } from 'react'
import type { WheelEvent } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { motion } from 'framer-motion'
import type { Project } from '@/features/projects/api'
import { Play } from 'lucide-react'
import NextImage from 'next/image'
import MuxPlayer, { type MuxPlayerRefAttributes } from '@mux/mux-player-react'

interface HomeGalleryCarouselProps {
  projects: Project[]
  onThumbnailClick?: (project: Project) => void
  onThumbnailChange?: (playbackId: string | null) => void
}

const HOVER_NOTES = ['смотреть', 'включить', 'взглянуть', 'версия режиссера', 'узнать больше']

export function HomeGalleryCarousel({
  projects,
  onThumbnailClick,
}: HomeGalleryCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      containScroll: false,
    },
    [AutoScroll({ speed: 0.5, stopOnInteraction: false, stopOnMouseEnter: false })]
  )

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (!emblaApi || event.ctrlKey) return
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (delta === 0) return
      event.preventDefault()
      const engine = emblaApi.internalEngine()
      engine.scrollBody.useBaseFriction().useBaseDuration()
      engine.scrollTo.distance(engine.axis.direction(delta * 0.7), false)
    },
    [emblaApi]
  )

  const displayProjects = projects.length < 6 ? [...projects, ...projects, ...projects] : projects

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute bottom-0 left-0 right-0 z-30 pb-10 pointer-events-none"
    >
      {/* Track wrapper */}
      <div className="w-full pointer-events-auto">
        <div className="relative">
          {/* Decorative lines - Dashed */}
          <div className="absolute left-0 right-0 top-0 border-t border-dashed border-white/30" />
          <div className="absolute left-0 right-0 bottom-0 border-b border-dashed border-white/30" />

          {/* Carousel Content */}
          <div className="bg-black/40 backdrop-blur-sm py-5 overflow-hidden">
            <div ref={emblaRef} onWheel={handleWheel} className="cursor-grab active:cursor-grabbing">
              <div className="flex">
                {displayProjects.map((project, index) => (
                  <CarouselItem
                    key={`${project.id}-carousel-${index}`}
                    project={project}
                    // Pick a random note based on index + id hash roughly
                    noteText={HOVER_NOTES[index % HOVER_NOTES.length] ?? 'Смотреть'}
                    onClick={() => onThumbnailClick?.(project)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const CarouselItem = memo(function CarouselItem({
  project,
  noteText,
  onClick
}: {
  project: Project
  noteText: string
  onClick: () => void
}) {
  const thumbnailUrl = project.images && project.images[0] ? project.images[0] : null

  const muxRef = useRef<MuxPlayerRefAttributes | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Determine which media source to use for the "GIF" effect
  const isMuxGif = project.carousel_gif_url && !project.carousel_gif_url.includes('/')
  const isUrlGif = project.carousel_gif_url && (project.carousel_gif_url.startsWith('http') || project.carousel_gif_url.startsWith('/'))

  // Intersection Observer for autoplay performance
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (muxRef.current) muxRef.current.play?.()
            if (videoRef.current) videoRef.current.play().catch(() => { })
          } else {
            if (muxRef.current) muxRef.current.pause?.()
            if (videoRef.current) videoRef.current.pause()
          }
        })
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex-shrink-0 mx-6">
      <div
        onClick={onClick}
        className="group flex flex-row items-center cursor-pointer outline-none"
      >
        {/* Media Container - Reduced size for horizontal layout */}
        <div ref={containerRef} className="relative w-[180px] h-[101px] overflow-hidden rounded-sm bg-zinc-900 shadow-xl transition-transform duration-500 group-hover:scale-[1.02]">
          {/* Media Layer */}
          {/* Only play video if it's explicitly a GIF/Video, otherwise just show thumbnail */}
          {isMuxGif ? (
            <MuxPlayer
              ref={muxRef}
              playbackId={project.carousel_gif_url!}
              streamType="on-demand"
              muted
              loop
              playsInline
              preload="auto"
              style={{
                '--controls': 'none',
                '--media-object-fit': 'cover',
              } as any}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : isUrlGif ? (
            <video
              ref={videoRef}
              src={project.carousel_gif_url!}
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : thumbnailUrl ? (
            thumbnailUrl.startsWith('/') ? (
              <NextImage
                src={thumbnailUrl}
                alt={project.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 280px"
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
            <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
              <Play className="w-12 h-12 text-[#FFFFFF]/20" />
            </div>
          )}

          {/* Dark overlay for text contrast on hover, or just general style */}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />

          {/* Hover Overlay with Handwritten Text - Now Red and random */}
          <div className="absolute inset-0 z-[10] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[1px]">
            <span className="font-handwritten text-2xl text-[#FF322E] transform -rotate-12 select-none drop-shadow-lg leading-none">
              {noteText}
            </span>
          </div>
        </div>

        {/* Text Container - To the right */}
        <div className="ml-4 flex flex-col justify-center min-w-[120px]">
          {/* Client - Top */}
          {project.client && (
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-white/50 font-sans font-bold mb-1">
              {project.client}
            </p>
          )}

          {/* Project Title - Bottom */}
          <h3 className="text-lg md:text-xl text-white font-cormorant font-light italic leading-none group-hover:text-[#FF322E] transition-colors duration-300">
            {project.title}
          </h3>
        </div>
      </div>
    </div>
  )
})
