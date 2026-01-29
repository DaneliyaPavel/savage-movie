'use client'

import { useCallback, useState } from 'react'
import type { WheelEvent } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { HoverNote } from '@/components/ui/hover-note'

interface FilmstripProject {
  id: string
  title: string
  director: string
  client?: string | null
  thumbnail: string
  playbackId: string
  slug?: string
}

interface FilmstripCarouselProps {
  projects: FilmstripProject[]
  onProjectSelect: (project: FilmstripProject) => void
  selectedId: string | null
}

const HOVER_NOTES = ['play', 'watch', 'view', "director's cut", 'explore']

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
    [AutoScroll({ speed: 0.5, stopOnInteraction: false, stopOnMouseEnter: true })]
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

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute bottom-0 left-0 right-0 z-30 pb-8"
    >
      {/* Track wrapper (Freshman-like "dotted rails") */}
      <div className="px-6 md:px-10">
        <div className="relative">
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 border-t-2 border-dashed border-white/90" />
          <div className="pointer-events-none absolute left-0 right-0 bottom-0 z-20 border-b-2 border-dashed border-white/90" />

          <div className="relative z-10 bg-black/20 backdrop-blur-md py-4">
            <div className="overflow-hidden" ref={emblaRef} onWheel={handleWheel}>
              <div className="flex gap-0">
                {/* Для бесконечной прокрутки дублируем только если проектов меньше 6 */}
                {(projects.length < 6 ? [...projects, ...projects] : projects).map(
                  (project, index) => (
                    <FilmstripItem
                      key={`${project.id}-${index}`}
                      project={project}
                      isSelected={selectedId === project.id}
                      onSelect={() => onProjectSelect(project)}
                      noteText={HOVER_NOTES[index % HOVER_NOTES.length] ?? HOVER_NOTES[0] ?? ''}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function FilmstripItem({
  project,
  isSelected,
  onSelect,
  noteText,
}: {
  project: FilmstripProject
  isSelected: boolean
  onSelect: () => void
  noteText: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  const clientLabel = project.client?.trim()

  const content = (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex-shrink-0 flex items-start gap-4 md:gap-5 px-4 md:px-5 group after:content-[''] after:absolute after:right-0 after:top-[-10px] after:bottom-[-10px] after:border-r after:border-dashed after:border-white/40 last:after:hidden"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-[120px] md:w-[160px] aspect-video overflow-hidden rounded-sm">
        {/* Thumbnail */}
        <Image
          src={project.thumbnail || '/placeholder.svg'}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Grain overlay on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/20 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Selection indicator */}
        <motion.div
          className="absolute inset-0 border-2 border-accent pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isSelected ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      <div className="min-w-[140px] md:min-w-[190px] max-w-[200px] md:max-w-[240px] pt-[2px]">
        {clientLabel && (
          <p className="text-[12px] md:text-[14px] uppercase tracking-[0.22em] text-white/85 font-heading font-semibold">
            {clientLabel}
          </p>
        )}
        <p className="mt-1 text-[11px] md:text-[13px] uppercase tracking-[0.2em] text-white/95 font-heading font-medium leading-snug line-clamp-2">
          {project.title}
        </p>
      </div>
    </motion.div>
  )

  return (
    <HoverNote note={noteText}>
      {project.slug ? (
        <Link href={`/projects/${project.slug}`} onClick={onSelect} className="block">
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onSelect} className="w-full">
          {content}
        </button>
      )}
    </HoverNote>
  )
}
