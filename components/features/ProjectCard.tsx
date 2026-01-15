/**
 * Карточка проекта для главной страницы в премиум стиле Freshman.tv
 * Poster-like карточка с hover видео эффектами
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { VideoPlayer } from './VideoPlayer'
import { GrainOverlay } from '@/components/ui/grain-overlay'

interface ProjectCardProps {
  id: string
  title: string
  slug: string
  category: 'commercial' | 'ai-content' | 'music-video' | 'other'
  thumbnail?: string
  videoUrl?: string
  videoPlaybackId?: string
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
  if (muxMatch) return muxMatch[1]
  return null
}

export function ProjectCard({
  title,
  slug,
  category,
  thumbnail,
  videoUrl,
  videoPlaybackId: propsVideoPlaybackId,
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Определяем playback ID
  const playbackId = propsVideoPlaybackId || (videoUrl ? getPlaybackId(videoUrl) : null)
  const hasVideo = !!playbackId || !!videoUrl

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group h-full flex flex-col"
    >
      <Link href={`/projects/${slug}`}>
        <div className="relative overflow-hidden bg-[#050505] border border-[#1A1A1A] hover:border-[#FFFFFF]/30 transition-all duration-500 h-full flex flex-col">
          <div className="relative aspect-video overflow-hidden bg-[#000000]">
            {/* Thumbnail */}
            {thumbnail && !isHovered && (
              <Image
                src={thumbnail}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            )}

            {/* Hover видео */}
            {isHovered && hasVideo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {playbackId ? (
                  <VideoPlayer
                    playbackId={playbackId}
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

            {/* Placeholder */}
            {!thumbnail && !hasVideo && (
              <div className="w-full h-full flex items-center justify-center bg-[#050505]">
                <GrainOverlay />
                <span className="text-6xl font-heading font-bold text-[#FFFFFF]/10">
                  {title.charAt(0)}
                </span>
              </div>
            )}

            <GrainOverlay />
            
            {/* Overlay с градиентом */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Category Badge */}
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1 bg-[#000000]/80 backdrop-blur-sm border border-[#1A1A1A]">
                <span className="text-xs font-medium text-[#FFFFFF]/60 uppercase tracking-wider">
                  {categoryLabels[category]}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 flex-1 flex flex-col">
            {/* Title - крупный */}
            <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-[#FFFFFF] mb-2 group-hover:text-[#CCFF00] transition-colors leading-tight">
              {title}
            </h3>
            
            {/* Подчеркивание при hover */}
            <motion.div
              className="mt-4 h-[1px] bg-[#FFFFFF]"
              initial={{ width: 0 }}
              whileHover={{ width: '100%' }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
