/**
 * ProjectRow3Column - 3-колоночный layout для проектов в стиле Freshman.tv
 * Колонка 1: Рукописный номер + скриншоты
 * Колонка 2: Видео с автоплеем на hover + рукописная надпись "смотреть"
 * Колонка 3: Название, описание + тематика справа рукописным шрифтом
 */
'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { VideoPlayer } from './VideoPlayer'
import type { Project } from '@/lib/api/projects'

interface ProjectRow3ColumnProps {
  project: Project
  index: number
}

const categoryLabels: Record<string, string> = {
  commercial: 'Коммерция',
  'ai-content': 'AI',
  'music-video': 'Music Video',
  other: 'Другое',
}

// Извлекаем playback ID из Mux URL
const getPlaybackId = (url: string | null): string | null => {
  if (!url) return null
  const muxMatch = url.match(/mux\.com\/([^/?]+)/)
  return muxMatch?.[1] ?? null
}

export function ProjectRow3Column({ project, index }: ProjectRow3ColumnProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  const playbackId = project.video_url ? getPlaybackId(project.video_url) : null
  const screenshots = project.images || []
  const categoryLabel = project.category ? categoryLabels[project.category] : ''

  // Обработка hover для видео
  const handleMouseEnter = () => {
    setIsHovered(true)
    if (videoRef.current && !playbackId) {
      // Для обычного video элемента
      videoRef.current.play().then(
        () => setIsVideoPlaying(true),
        () => {}
      )
    } else if (playbackId && videoContainerRef.current) {
      // Для Mux Player ищем элемент video внутри контейнера
      const muxVideo = videoContainerRef.current.querySelector('video')
      if (muxVideo) {
        muxVideo.play().then(
          () => setIsVideoPlaying(true),
          () => {}
        )
      }
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (videoRef.current && !playbackId) {
      videoRef.current.pause()
    } else if (playbackId && videoContainerRef.current) {
      const muxVideo = videoContainerRef.current.querySelector('video')
      if (muxVideo) {
        muxVideo.pause()
      }
    }
    setIsVideoPlaying(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="border-b border-[#1A1A1A] py-8 md:py-12 lg:py-16"
    >
      <Link href={`/projects/${project.slug}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-12">
          {/* Колонка 1: Номер + Скриншоты */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Рукописный номер */}
            <div
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#FFFFFF]/20"
              style={{
                fontFamily: 'var(--font-handwritten), "Kalam", "Caveat", cursive',
                fontWeight: 400,
              }}
            >
              #{index + 1}
            </div>

            {/* Скриншоты */}
            {screenshots.length > 0 && (
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {screenshots.slice(0, 4).map((image, imgIndex) => (
                  <div
                    key={imgIndex}
                    className="relative aspect-video overflow-hidden bg-[#050505] border border-[#1A1A1A]"
                  >
                    <Image
                      src={image}
                      alt={`${project.title} screenshot ${imgIndex + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Колонка 2: Видео с hover-автоплеем */}
          <div
            ref={videoContainerRef}
            className="lg:col-span-6 relative group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative w-full aspect-video bg-[#000000] overflow-hidden border border-[#1A1A1A]">
              {/* Poster/Thumbnail - показываем когда не hover или видео не играет */}
              {(!isHovered || !isVideoPlaying) && screenshots[0] && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: isHovered && isVideoPlaying ? 0 : 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-0"
                >
                  <Image
                    src={screenshots[0]}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              )}

              {/* Video */}
              {playbackId ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-[1]"
                >
                  <VideoPlayer
                    playbackId={playbackId}
                    autoplay={isHovered}
                    muted={true}
                    loop={true}
                    controls={false}
                    className="w-full h-full"
                  />
                </motion.div>
              ) : project.video_url ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered && isVideoPlaying ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 z-[1]"
                >
                  <video
                    ref={videoRef}
                    src={project.video_url}
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    preload="metadata"
                  />
                </motion.div>
              ) : null}

              {/* Рукописная надпись "смотреть" при hover */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
              >
                <span
                  className="text-2xl md:text-3xl lg:text-4xl text-[#ff2936] cursor-pointer pointer-events-auto"
                  style={{
                    fontFamily: 'var(--font-handwritten), "Kalam", "Caveat", cursive',
                    fontWeight: 400,
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                    transform: 'rotate(-2deg)',
                  }}
                >
                  смотреть
                </span>
              </motion.div>
            </div>
          </div>

          {/* Колонка 3: Название, описание + тематика */}
          <div className="lg:col-span-3 flex flex-col justify-between">
            <div>
              {/* Название */}
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-[#FFFFFF] mb-4 leading-tight">
                {project.title}
              </h3>

              {/* Описание */}
              {project.description && (
                <p className="text-base md:text-lg text-[#FFFFFF]/70 font-light leading-relaxed mb-6">
                  {project.description}
                </p>
              )}
            </div>

            {/* Тематика справа рукописным шрифтом */}
            {categoryLabel && (
              <div className="mt-auto pt-4 border-t border-[#1A1A1A]">
                <div
                  className="text-right text-xl md:text-2xl text-[#ff2936]"
                  style={{
                    fontFamily: 'var(--font-handwritten), "Kalam", "Caveat", cursive',
                    fontWeight: 400,
                    transform: 'rotate(1deg)',
                  }}
                >
                  {categoryLabel}
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
