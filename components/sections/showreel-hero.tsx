"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VideoPlayer } from "@/features/projects/components/mux-player"
import { FilmstripCarousel } from "@/features/projects/components/filmstrip-carousel"
import { TopBar } from "@/components/ui/top-bar"
import { JalousieMenu } from "@/components/ui/jalousie-menu"
import { useI18n } from "@/lib/i18n-context"

interface Project {
  id: string
  titleRu: string
  titleEn: string
  directorRu: string
  directorEn: string
  client?: string | null
  thumbnail: string
  playbackId: string
  slug?: string
}

interface ShowreelHeroProps {
  showreelPlaybackId: string
  projects?: Project[]
}

export function ShowreelHero({ showreelPlaybackId, projects = [] }: ShowreelHeroProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { language, t } = useI18n()
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentPlaybackId = selectedProject?.playbackId || showreelPlaybackId

  const handleProjectSelect = (project: { id: string }) => {
    if (isTransitioning) return
    if (project.id === selectedProject?.id) return

    setIsTransitioning(true)
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
    }
    transitionTimerRef.current = setTimeout(() => {
      const fullProject = projects.find((p) => p.id === project.id) || null
      setSelectedProject(fullProject)
      setIsTransitioning(false)
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  const getTitle = (p: Project) => (language === "ru" ? p.titleRu : p.titleEn)
  const getDirector = (p: Project) => (language === "ru" ? p.directorRu : p.directorEn)

  // Transform projects for carousel
  const carouselProjects = projects.map((p) => ({
    ...p,
    title: getTitle(p),
    director: getDirector(p),
    client: p.client,
  }))

  return (
    <section className="relative h-svh w-full overflow-hidden bg-background">
      {/* Main Video Player - Fullscreen */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPlaybackId}
            initial={{ opacity: 0, filter: "blur(10px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <VideoPlayer
              playbackId={currentPlaybackId}
              autoPlay
              muted
              loop
              controls={false}
              className="w-full h-full"
            />
          </motion.div>
        </AnimatePresence>

        {/* Vignette overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* Top Bar */}
      <TopBar />

      {/* Menu Overlay */}
      <JalousieMenu />

      {/* Center Brand Lockup (Freshman-like) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
      >
        <div className="text-center px-6">
          <h1 className="text-hero font-brand uppercase text-white tracking-tight leading-[0.82] drop-shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
            <span className="block">SAVAGE</span>
            <span className="block -mt-[0.12em]">MOVIE</span>
          </h1>
          <p className="mt-4 text-sm md:text-base text-white/70 max-w-xl mx-auto font-light leading-relaxed">
            {t("home.heroSubtitle")}
          </p>
        </div>
      </motion.div>

      {/* Selected Project Info */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="absolute bottom-32 left-6 md:left-10 z-20"
          >
            <p className="text-xs uppercase tracking-widest text-foreground/60 mb-1">{t("home.nowPlaying")}</p>
            <h2 className="text-2xl md:text-3xl font-light text-foreground">{getTitle(selectedProject)}</h2>
            <p className="text-sm text-foreground/70 mt-1">
              {t("home.directedBy")} {getDirector(selectedProject)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filmstrip Carousel */}
      {carouselProjects.length > 0 ? (
        <FilmstripCarousel
          projects={carouselProjects}
          onProjectSelect={handleProjectSelect}
          selectedId={selectedProject?.id || null}
        />
      ) : (
        // Fallback если нет проектов
        process.env.NODE_ENV === "development" && (
          <div className="absolute bottom-0 left-0 right-0 z-30 p-8 text-center text-muted-foreground">
            <p className="text-sm">⚠️ {t("home.noFeaturedProjects")}</p>
          </div>
        )
      )}
    </section>
  )
}
