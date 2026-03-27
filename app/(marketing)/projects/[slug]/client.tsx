/**
 * Клиентский компонент детальной страницы проекта с анимациями
 */
'use client'

import { useCallback, useRef, useState, type MouseEvent } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { VideoPlayer } from '@/features/projects/components/VideoPlayer'
import { FullScreenVideoPlayer } from '@/features/projects/components/FullScreenVideoPlayer'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { BackButton } from '@/components/ui/back-button'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { ProjectsJalousieFooter } from '@/components/sections/ProjectsJalousieFooter'
import type { Project, ProjectVideo } from '@/features/projects/api'

type Orientation = 'landscape' | 'portrait' | 'unknown'

function GalleryImage({
  src,
  alt,
  index,
  onClick,
}: {
  src: string
  alt: string
  index: number
  onClick: () => void
}) {
  const [orientation, setOrientation] = useState<Orientation>('unknown')

  const handleLoad = useCallback((e: { target: EventTarget }) => {
    const img = e.target as HTMLImageElement
    if (img.naturalWidth && img.naturalHeight) {
      setOrientation(img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait')
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden bg-[#050505] border border-[#1A1A1A] cursor-pointer group ${
        orientation === 'portrait'
          ? 'aspect-[3/4] md:col-span-1'
          : orientation === 'landscape'
            ? 'aspect-video md:col-span-1'
            : 'aspect-video md:col-span-1'
      }`}
      onClick={onClick}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        onLoad={handleLoad}
      />
    </motion.div>
  )
}

interface ProjectDetailClientProps {
  project: Project
  nextProject: Project | null
  projectVideos?: ProjectVideo[]
}

export function ProjectDetailClient({ project, nextProject, projectVideos = [] }: ProjectDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [activeVideoPlaybackId, setActiveVideoPlaybackId] = useState<string | null>(null)
  const [activeVideoTitle, setActiveVideoTitle] = useState<string | undefined>(undefined)
  // Предпочитаем mux_playback_id (Bunny Video ID), fallback на video_url
  const playbackId = project.mux_playback_id || project.video_url || null
  const hasVideo = Boolean(playbackId || project.video_url)
  const hasGallery = (project.images?.length ?? 0) > 0 || (project.behind_scenes?.length ?? 0) > 0
  const heroRef = useRef<HTMLDivElement>(null)
  const cursorX = useMotionValue(0)
  const cursorY = useMotionValue(0)
  const smoothX = useSpring(cursorX, { stiffness: 350, damping: 40 })
  const smoothY = useSpring(cursorY, { stiffness: 350, damping: 40 })
  const [isCursorVisible, setIsCursorVisible] = useState(false)

  const handleHeroMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    if (!heroRef.current) return
    const rect = heroRef.current.getBoundingClientRect()
    cursorX.set(event.clientX - rect.left)
    cursorY.set(event.clientY - rect.top)
  }

  return (
    <>
      {/* Curtain: sits above fixed footer; when it scrolls up, footer (under spacer) becomes visible */}
      <div className="relative z-20 min-h-screen bg-[#000000]">
        <TopBar />
        <JalousieMenu />

        {/* Hero Video/Image - полноэкранное или почти */}
        <div
          ref={heroRef}
          className="relative w-screen left-1/2 -translate-x-1/2 min-h-[60vh] md:min-h-[80vh] bg-[#050505] overflow-hidden"
        >
          {hasVideo ? (
            playbackId ? (
              <VideoPlayer
                playbackId={playbackId}
                title={project.title}
                autoplay
                muted
                loop
                controls={false}
                objectFit="cover"
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            ) : (
              <video
                src={project.video_url ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )
          ) : project.images?.[0] ? (
            <Image src={project.images[0]} alt={project.title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[#050505]" />
          )}

          {hasVideo && (
            <button
              type="button"
              onClick={() => {
                setActiveVideoPlaybackId(playbackId)
                setActiveVideoTitle(project.title)
                setIsVideoOpen(true)
              }}
              onMouseEnter={event => {
                setIsCursorVisible(true)
                handleHeroMouseMove(event)
              }}
              onMouseLeave={() => setIsCursorVisible(false)}
              onMouseMove={handleHeroMouseMove}
              className="absolute inset-0 z-10 group"
              aria-label="Открыть видео на весь экран"
            >
              <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 hidden md:block text-accent text-xl md:text-2xl"
                style={{ x: smoothX, y: smoothY, fontFamily: 'var(--font-handwritten), cursive' }}
                animate={{ opacity: isCursorVisible ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                Смотреть
              </motion.span>
            </button>
          )}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
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
              className="mb-12 md:mb-16 text-center"
            >
              {project.client && (
                <div className="text-base md:text-lg text-[#FFFFFF]/70 uppercase tracking-[0.35em] font-secondary">
                  {project.client}
                </div>
              )}
              <h1 className="mt-4 text-4xl md:text-6xl lg:text-7xl text-[#FFFFFF] leading-tight font-oranienbaum">
                {project.title}
              </h1>
            </motion.div>

            {project.description && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16 md:mb-24"
              >
                <div
                  className="text-center text-xl md:text-2xl text-[#FFFFFF]/70 mb-6"
                  style={{ fontFamily: 'var(--font-handwritten), cursive' }}
                >
                  (Описание)
                </div>
                <div className="max-w-3xl mx-auto text-center text-[#FFFFFF]/80 font-secondary text-lg md:text-xl leading-relaxed">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-5 last:mb-0">{children}</p>,
                    }}
                  >
                    {project.description}
                  </ReactMarkdown>
                </div>
              </motion.div>
            )}

            {/* Дополнительные видео */}
            {projectVideos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16 md:mb-24"
              >
                <div
                  className="text-center text-xl md:text-2xl text-[#FFFFFF]/70 mb-10"
                  style={{ fontFamily: 'var(--font-handwritten), cursive' }}
                >
                  (Другие видео)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projectVideos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      className={`relative overflow-hidden bg-[#050505] border border-[#1A1A1A] cursor-pointer group ${
                        video.orientation === 'vertical'
                          ? 'aspect-[9/16] w-full max-w-[280px] mx-auto'
                          : 'aspect-video w-full'
                      }`}
                      onClick={() => {
                        setActiveVideoPlaybackId(video.mux_playback_id)
                        setActiveVideoTitle(video.title ?? undefined)
                        setIsVideoOpen(true)
                      }}
                    >
                      <VideoPlayer
                        playbackId={video.mux_playback_id}
                        title={video.title ?? undefined}
                        autoplay
                        muted
                        loop
                        controls={false}
                        objectFit="cover"
                className="absolute inset-0 w-full h-full pointer-events-none"
                      />
                      <span className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                      {video.title && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10">
                          <p className="text-[#FFFFFF] text-sm font-secondary">{video.title}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Gallery - кадры + бекстейдж */}
            {hasGallery && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="mb-16 md:mb-24"
              >
                <h2 className="text-3xl md:text-4xl text-[#FFFFFF] font-oranienbaum mb-10">
                  Галерея
                </h2>
                {project.images && project.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 auto-rows-auto">
                    {project.images.map((image, index) => (
                      <GalleryImage
                        key={index}
                        src={image}
                        alt={`${project.title} - изображение ${index + 1}`}
                        index={index}
                        onClick={() => setSelectedImage(image)}
                      />
                    ))}
                  </div>
                )}

                {project.behind_scenes && project.behind_scenes.length > 0 && (
                  <div className="mt-12">
                    <div
                      className="text-center text-lg md:text-xl text-[#FFFFFF]/70 mb-6"
                      style={{ fontFamily: 'var(--font-handwritten), cursive' }}
                    >
                      Бекстейдж
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 auto-rows-auto">
                      {project.behind_scenes.map((image, index) => (
                        <GalleryImage
                          key={index}
                          src={image}
                          alt={`${project.title} - за кадром ${index + 1}`}
                          index={index}
                          onClick={() => setSelectedImage(image)}
                        />
                      ))}
                    </div>
                  </div>
                )}
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
                      <div className="text-sm md:text-base text-[#FFFFFF]/40 uppercase tracking-wider mb-2 font-secondary">
                        Следующий проект
                      </div>
                      <div className="text-2xl md:text-3xl font-oranienbaum text-[#FFFFFF] group-hover:text-[#ff2936] transition-colors">
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

      {/* Transparent spacer: creates scroll room; footer (z-10) paints on top so it's visible here */}
      <div className="min-h-screen" aria-hidden="true" />

      <ProjectsJalousieFooter />

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
            onClick={e => {
              e.stopPropagation()
              setSelectedImage(null)
            }}
            className="absolute top-6 right-6 text-[#FFFFFF] hover:text-[#ff2936] transition-colors z-10"
            aria-label="Закрыть"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6L18 18M18 6L6 18" />
            </svg>
          </motion.button>
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="max-w-7xl max-h-full"
            onClick={e => e.stopPropagation()}
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

      <FullScreenVideoPlayer
        isOpen={isVideoOpen}
        onClose={() => {
          setIsVideoOpen(false)
          setActiveVideoPlaybackId(null)
          setActiveVideoTitle(undefined)
        }}
        videoUrl={activeVideoPlaybackId === playbackId ? (project.video_url ?? undefined) : undefined}
        playbackId={activeVideoPlaybackId ?? undefined}
        title={activeVideoTitle ?? project.title}
      />
    </>
  )
}
