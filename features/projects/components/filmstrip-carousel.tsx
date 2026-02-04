'use client'

import { useCallback, useRef, useEffect, memo } from 'react'
import type { WheelEvent } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import MuxPlayer, { type MuxPlayerRefAttributes } from '@mux/mux-player-react'

interface FilmstripProject {
  id: string
  title: string
  director: string
  client?: string | null
  thumbnail: string
  playbackId?: string | null
  carousel_gif_url?: string | null
  slug?: string
}

interface FilmstripCarouselProps {
  projects: FilmstripProject[]
  onProjectSelect: (project: FilmstripProject) => void
  selectedId: string | null
}

const HOVER_NOTES = ['смотреть', 'включить', 'взглянуть', 'версия режиссера', 'узнать больше']

export function FilmstripCarousel({
  projects,
  onProjectSelect,
  selectedId,
}: FilmstripCarouselProps) {
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
      // Increased sensitivity for better feel
      engine.scrollTo.distance(engine.axis.direction(delta * 2.5), false)
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
          {/* Decorative lines - Dashed & More Visible */}
          <div className="absolute left-0 right-0 top-0 border-t-2 border-dashed border-white/60" />
          <div className="absolute left-0 right-0 bottom-0 border-b-2 border-dashed border-white/60" />

          {/* Carousel Content */}
          <div className="bg-black/40 backdrop-blur-md py-5 overflow-hidden">
            <div ref={emblaRef} onWheel={handleWheel} className="cursor-grab active:cursor-grabbing">
              <div className="flex">
                {displayProjects.map((project, index) => (
                  <FilmstripItem
                    key={`${project.id}-carousel-${index}`}
                    project={project}
                    isSelected={selectedId === project.id}
                    // Pick a random note based on index + id hash roughly
                    noteText={HOVER_NOTES[index % HOVER_NOTES.length] ?? 'Смотреть'}
                    onSelect={() => onProjectSelect(project)}
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

const FilmstripItem = memo(function FilmstripItem({
  project,
  isSelected,
  noteText,
  onSelect,
}: {
  project: FilmstripProject
  isSelected: boolean
  noteText?: string
  onSelect: () => void
}) {
  const muxRef = useRef<MuxPlayerRefAttributes | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Determine which media source to use for the "GIF" effect
  // Priority: carousel_gif_url > playbackId > thumbnail
  const carouselGifUrl = project.carousel_gif_url ?? ''
  const isMuxGif = carouselGifUrl !== '' && !carouselGifUrl.includes('/')
  const isUrlGif = carouselGifUrl.startsWith('http') || carouselGifUrl.startsWith('/')
  const isGifImage = isUrlGif && carouselGifUrl.toLowerCase().includes('.gif')
  const isMuxPlayback = !project.carousel_gif_url && project.playbackId

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

  const content = (
    <div
      className={`
        flex flex-row items-center
        mx-6 transition-all duration-500
        ${isSelected ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}
      `}
    >
      {/* Media container - Reduced size for horizontal layout */}
      <div
        ref={containerRef}
        className="relative w-[180px] h-[101px] overflow-hidden bg-zinc-900 rounded-sm shadow-xl transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      >
        {/* GIF/Video Layer */}
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
          isGifImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={carouselGifUrl}
              alt={project.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              src={carouselGifUrl}
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )
        ) : isMuxPlayback ? (
          <MuxPlayer
            ref={muxRef}
            playbackId={project.playbackId!}
            streamType="on-demand"
            muted
            loop
            playsInline
            preload="metadata"
            style={{
              '--controls': 'none',
              '--media-object-fit': 'cover',
            } as any}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image
            src={project.thumbnail || '/placeholder.svg'}
            alt={project.title}
            fill
            className="object-cover"
          />
        )}

        {/* Dark overlay for text contrast on hover */}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300 pointer-events-none" />

        {/* Hover Overlay with Handwritten Text - Red and random */}
        <div className="absolute inset-0 z-[10] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-transparent">
          <span className="font-handwritten text-2xl text-[#FF322E] transform -rotate-12 select-none drop-shadow-lg leading-none">
            {noteText}
          </span>
        </div>
      </div>

      {/* Text Container - To the right */}
      <div className="ml-4 flex flex-col justify-center min-w-[120px] text-left">
        {/* Client - Top */}
        {project.client && (
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-white/50 font-sans font-bold mb-1">
            {project.client}
          </p>
        )}

        {/* Project Title - Bottom */}
        <h3 className="text-lg md:text-xl text-white font-cormorant font-light italic leading-none transition-colors duration-300 whitespace-nowrap">
          {project.title}
        </h3>
      </div>
    </div>
  )

  return (
    <div className="flex-shrink-0 group cursor-pointer">
      {project.slug ? (
        <Link href={`/projects/${project.slug}`} onClick={onSelect} className="block outline-none">
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onSelect} className="block outline-none text-left">
          {content}
        </button>
      )}
    </div>
  )
})
