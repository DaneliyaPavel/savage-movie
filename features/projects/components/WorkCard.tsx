/**
 * Work Card (Grid View) в стиле Freshman.tv
 * Poster-like карточка проекта с hover эффектами
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { VideoPlayer } from './VideoPlayer'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import { HoverNote } from '@/components/ui/hover-note'
import { useState } from 'react'
import type { Project } from '../api'

interface WorkCardProps {
  project: Project
}

const categoryLabels: Record<string, string> = {
  commercial: 'Коммерция',
  'ai-content': 'ИИ-контент',
  'music-video': 'Клип',
  other: 'Другое',
}

// Извлекаем playback ID из Mux URL
const getPlaybackId = (url: string | null): string | null => {
  if (!url) return null
  const muxMatch = url.match(/mux\.com\/([^/?]+)/)
  return muxMatch?.[1] ?? null
}

export function WorkCard({ project }: WorkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const playbackId = project.video_url ? getPlaybackId(project.video_url) : null

  return (
    <HoverNote text="watch" position="top" className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative"
      >
        <Link href={`/projects/${project.slug}`}>
        <div className="relative aspect-video overflow-hidden bg-[#050505] border border-[#1A1A1A] hover:border-[#FFFFFF]/30 transition-colors duration-500">
          {/* Thumbnail или видео */}
          {project.images?.[0] && !isHovered && (
            <Image
              src={project.images[0]}
              alt={project.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}

          {/* Hover видео preview */}
          {isHovered && playbackId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <VideoPlayer
                playbackId={playbackId}
                autoplay
                muted
                loop
                controls={false}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}

          {isHovered && project.video_url && !playbackId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={project.video_url} type="video/mp4" />
              </video>
            </motion.div>
          )}

          {/* Grain overlay */}
          <GrainOverlay />

          {/* Overlay с градиентом */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Контент - крупный заголовок */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="opacity-0 group-hover:opacity-100"
            >
              {/* Category */}
              {project.category && (
                <div className="mb-2 text-xs md:text-sm text-[#FFFFFF]/60 font-medium uppercase tracking-wider">
                  {categoryLabels[project.category]}
                </div>
              )}
              {/* Title - крупный */}
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-[#FFFFFF] mb-2 leading-tight">
                {project.title}
              </h3>
              {/* Meta информация */}
              <div className="flex flex-wrap gap-4 text-sm text-[#FFFFFF]/60">
                {project.client && <span>{project.client}</span>}
                {project.duration && (
                  <span>
                    {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
    </HoverNote>
  )
}
