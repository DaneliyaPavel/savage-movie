/**
 * Клиентский компонент детальной страницы проекта с анимациями
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { FullScreenVideoPlayer } from '@/components/features/FullScreenVideoPlayer'
import { SectionTitle } from '@/components/ui/section-title'
import { EditorialCorrection } from '@/components/ui/editorial-correction'
import { BackButton } from '@/components/ui/back-button'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import ReactMarkdown from 'react-markdown'
import type { Project } from '@/lib/api/projects'

interface ProjectDetailClientProps {
  project: Project
  nextProject: Project | null
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

export function ProjectDetailClient({ project, nextProject }: ProjectDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const playbackId = project.video_url ? getPlaybackId(project.video_url) : null

  return (
    <>
      <div className="min-h-screen bg-[#000000]">
        {/* Hero Video/Image - полноэкранное или почти */}
        <div className="relative w-full min-h-[60vh] md:min-h-[80vh] bg-[#050505]">
          {playbackId ? (
            <VideoPlayer
              playbackId={playbackId}
              title={project.title}
              controls
              className="w-full h-full min-h-[60vh] md:min-h-[80vh] object-cover"
            />
          ) : project.video_url ? (
            <video
              src={project.video_url}
              controls
              className="w-full h-full min-h-[60vh] md:min-h-[80vh] object-cover"
            />
          ) : project.images?.[0] ? (
            <Image
              src={project.images[0]}
              alt={project.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[#050505] flex items-center justify-center">
              <GrainOverlay />
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            {/* Навигация назад */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12"
            >
              <BackButton href="/projects" className="text-[#FFFFFF]/60 hover:text-[#FFFFFF]" />
            </motion.div>

            {/* Заголовок - очень крупный */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12 md:mb-16 editorial-spacing"
            >
              <div className="flex items-center gap-4 mb-6">
                <span className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider">
                  {categoryLabels[project.category]}
                </span>
              </div>
              <SectionTitle size="xl" className="text-[#FFFFFF] mb-8">
                {project.title}
              </SectionTitle>

              {/* Editorial Correction на детальной странице */}
              <div className="mb-8">
                <EditorialCorrection
                  wrong="Видео"
                  correct="Работа"
                  size="md"
                  delay={0.2}
                />
              </div>

              {project.description && (
                <div className="text-editorial text-[#FFFFFF]/80 font-light leading-relaxed max-w-4xl prose prose-invert prose-headings:text-[#FFFFFF] prose-p:text-[#FFFFFF]/80">
                  <ReactMarkdown>{project.description}</ReactMarkdown>
                </div>
              )}
            </motion.div>

            {/* Meta Block - редакторский стиль */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-16 md:mb-24 border-t border-[#1A1A1A] pt-12"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {project.client && (
                  <div>
                    <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-2">
                      Клиент
                    </div>
                    <div className="text-lg md:text-xl text-[#FFFFFF] font-medium">
                      {project.client}
                    </div>
                  </div>
                )}
                {project.duration && (
                  <div>
                    <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-2">
                      Длительность
                    </div>
                    <div className="text-lg md:text-xl text-[#FFFFFF] font-medium">
                      {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                )}
                {project.role && (
                  <div>
                    <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-2">
                      Роль
                    </div>
                    <div className="text-lg md:text-xl text-[#FFFFFF] font-medium">
                      {project.role}
                    </div>
                  </div>
                )}
                {project.tools && project.tools.length > 0 && (
                  <div>
                    <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-2">
                      Инструменты
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tools.map((tool, index) => (
                        <span key={index} className="text-sm text-[#FFFFFF]/60">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Gallery - masonry или stacked */}
            {project.images && project.images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16 md:mb-24"
              >
                <SectionTitle mark="plus" markPosition="top-left" size="lg" className="mb-12 text-[#FFFFFF]">
                  Галерея
                </SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {project.images.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="relative aspect-video overflow-hidden bg-[#050505] border border-[#1A1A1A] cursor-pointer group"
                      onClick={() => setSelectedImage(image)}
                    >
                      <Image
                        src={image}
                        alt={`${project.title} - изображение ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <GrainOverlay />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Behind the Scenes */}
            {project.behind_scenes && project.behind_scenes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16 md:mb-24"
              >
                <SectionTitle mark="circle" markPosition="top-left" size="lg" className="mb-12 text-[#FFFFFF]">
                  За кадром
                </SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {project.behind_scenes.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className="relative aspect-video overflow-hidden bg-[#050505] border border-[#1A1A1A] cursor-pointer group"
                      onClick={() => setSelectedImage(image)}
                    >
                      <Image
                        src={image}
                        alt={`${project.title} - за кадром ${index + 1}`}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <GrainOverlay />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Next Project Navigation */}
            {nextProject && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="border-t border-[#1A1A1A] pt-12"
              >
                <Link href={`/projects/${nextProject.slug}`}>
                  <motion.div
                    className="flex items-center justify-between group"
                    whileHover={{ x: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div>
                      <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-2">
                        Следующий проект
                      </div>
                      <div className="text-2xl md:text-3xl font-heading font-bold text-[#FFFFFF] group-hover:text-[#CCFF00] transition-colors">
                        {nextProject.title}
                      </div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-[#FFFFFF]/40 group-hover:text-[#FFFFFF] transition-colors" />
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Viewer */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#000000] flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <motion.button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImage(null)
            }}
            className="absolute top-6 right-6 text-[#FFFFFF] hover:text-[#CCFF00] transition-colors z-10"
            aria-label="Закрыть"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </motion.button>
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="max-w-7xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt={project.title}
              width={1920}
              height={1080}
              className="max-h-[90vh] w-auto object-contain"
            />
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
