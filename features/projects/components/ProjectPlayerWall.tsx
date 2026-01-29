/**
 * ProjectPlayerWall - главная 3-колоночная секция с проектами
 * Левая колонка: миниатюры, Центр: видео плеер, Правая: описание
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ProjectThumbRail } from './ProjectThumbRail'
import { VideoStage } from './VideoStage'
import { ProjectMetaPanel } from './ProjectMetaPanel'
import { EditorialCorrection } from '@/components/ui/editorial-correction'
import { HoverNote } from '@/components/ui/hover-note'
import type { Project } from '../api'

interface ProjectPlayerWallProps {
  projects: Project[]
  initialProjectId?: string
}

// Извлекаем playback ID из Mux URL
const getPlaybackId = (url: string | null): string | null => {
  if (!url) return null
  const muxMatch = url.match(/mux\.com\/([^/?]+)/)
  return muxMatch?.[1] ?? null
}

export function ProjectPlayerWall({ projects, initialProjectId }: ProjectPlayerWallProps) {
  const router = useRouter()
  const [selectedProject, setSelectedProject] = useState<Project | null>(
    projects.find(p => p.id === initialProjectId) ?? projects[0] ?? null
  )
  const [selectedIndex, setSelectedIndex] = useState(
    projects.findIndex(p => p.id === initialProjectId) !== -1
      ? projects.findIndex(p => p.id === initialProjectId)
      : 0
  )
  const containerRef = useRef<HTMLDivElement>(null)

  // Клавиатурная навигация - работает когда секция видна
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверяем, что фокус в пределах секции или документ в фокусе
      const isFocused =
        document.activeElement?.tagName === 'BODY' ||
        containerRef.current?.contains(document.activeElement)

      if (!isFocused) return

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const newIndex = selectedIndex > 0 ? selectedIndex - 1 : projects.length - 1
        const nextProject = projects[newIndex]
        if (!nextProject) return
        setSelectedIndex(newIndex)
        setSelectedProject(nextProject)
        // Скролл к выбранному элементу в thumb rail
        const thumbElement = document.querySelector(`[data-project-id="${nextProject.id}"]`)
        thumbElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const newIndex = selectedIndex < projects.length - 1 ? selectedIndex + 1 : 0
        const nextProject = projects[newIndex]
        if (!nextProject) return
        setSelectedIndex(newIndex)
        setSelectedProject(nextProject)
        // Скролл к выбранному элементу в thumb rail
        const thumbElement = document.querySelector(`[data-project-id="${nextProject.id}"]`)
        thumbElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } else if (e.key === 'Enter' && selectedProject) {
        router.push(`/projects/${selectedProject.slug}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, projects, selectedProject, router])

  const handleProjectSelect = (project: Project) => {
    const index = projects.findIndex(p => p.id === project.id)
    setSelectedProject(project)
    setSelectedIndex(index !== -1 ? index : 0)
  }

  if (projects.length === 0) {
    return null
  }

  const selectedVideoUrl = selectedProject?.video_url || undefined
  const selectedPlaybackId = selectedProject?.video_url
    ? (getPlaybackId(selectedProject.video_url) ?? undefined)
    : undefined
  const selectedPoster = selectedProject?.images?.[0]

  return (
    <section
      ref={containerRef}
      className="relative py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A1A] bg-[#000000]"
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header с Editorial Correction */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 md:mb-16"
        >
          <HoverNote text="featured" position="top">
            <div className="mb-12">
              <EditorialCorrection
                wrong="Наши работы"
                correct="Избранное"
                size="lg"
                inline
                delay={0.2}
              />
            </div>
          </HoverNote>
        </motion.div>

        {/* 3-колоночная layout */}
        {/* Desktop: 3 колонки, Mobile: вертикальный стек */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* LEFT: Thumbnails Rail */}
          {/* Mobile: горизонтальный скролл, Desktop: вертикальный rail */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
              {/* Mobile: горизонтальный скролл */}
              <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-3 w-max">
                  {projects.map(project => {
                    const isSelected = project.id === selectedProject?.id
                    const thumbnail = project.images?.[0]
                    return (
                      <motion.button
                        key={project.id}
                        data-project-id={project.id}
                        onClick={() => handleProjectSelect(project)}
                        className={`relative shrink-0 w-32 h-20 overflow-hidden bg-[#050505] border transition-all ${
                          isSelected
                            ? 'border-[#ff2936] scale-105'
                            : 'border-[#1A1A1A] hover:border-[#FFFFFF]/30'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {thumbnail ? (
                          <Image
                            src={thumbnail}
                            alt={project.title}
                            fill
                            sizes="128px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-[#FFFFFF]/20 font-heading">
                              {project.title.charAt(0)}
                            </span>
                          </div>
                        )}
                        {isSelected && <div className="absolute inset-0 bg-[#ff2936]/10" />}
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Desktop: вертикальный rail */}
              <div className="hidden lg:block">
                <ProjectThumbRail
                  projects={projects}
                  selectedId={selectedProject?.id || ''}
                  onSelect={handleProjectSelect}
                />
              </div>
            </div>
          </div>

          {/* CENTER: Video Player */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <motion.div
              key={selectedProject?.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <VideoStage
                videoUrl={selectedVideoUrl}
                playbackId={selectedPlaybackId || undefined}
                poster={selectedPoster}
                title={selectedProject?.title}
              />
            </motion.div>
          </div>

          {/* RIGHT: Description Panel */}
          <div className="lg:col-span-3 order-3">
            <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
              <ProjectMetaPanel project={selectedProject} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
