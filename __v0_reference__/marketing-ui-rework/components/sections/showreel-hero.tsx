"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VideoPlayer } from "@/components/features/mux-player"
import { FilmstripCarousel } from "@/components/features/filmstrip-carousel"
import { TopBar } from "@/components/ui/top-bar"
import { JalousieMenu } from "@/components/ui/jalousie-menu"
import { useI18n } from "@/lib/i18n-context"

interface Project {
  id: string
  titleRu: string
  titleEn: string
  directorRu: string
  directorEn: string
  thumbnail: string
  playbackId: string
}

const PROJECTS: Project[] = [
  {
    id: "1",
    titleRu: "Бренд-фильм — Нуар",
    titleEn: "Brand Film — Noir",
    directorRu: "Алекс Волков",
    directorEn: "Alex Volkov",
    thumbnail: "/cinematic-dark-brand-film-noir.jpg",
    playbackId: "Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM",
  },
  {
    id: "2",
    titleRu: "Fashion-кампания",
    titleEn: "Fashion Campaign",
    directorRu: "Мария Смирнова",
    directorEn: "Maria Smirnova",
    thumbnail: "/high-fashion-editorial-campaign.jpg",
    playbackId: "Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM",
  },
  {
    id: "3",
    titleRu: "Клип — Эхо",
    titleEn: "Music Video — Echoes",
    directorRu: "Дмитрий Козлов",
    directorEn: "Dmitry Kozlov",
    thumbnail: "/moody-music-video-atmospheric.jpg",
    playbackId: "Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM",
  },
  {
    id: "4",
    titleRu: "AI-визуализация",
    titleEn: "AI Visualization",
    directorRu: "Елена Петрова",
    directorEn: "Elena Petrova",
    thumbnail: "/ai-generated-cinematic-visualization-futuristic.jpg",
    playbackId: "Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM",
  },
  {
    id: "5",
    titleRu: "Запуск продукта",
    titleEn: "Product Launch",
    directorRu: "Иван Соколов",
    directorEn: "Ivan Sokolov",
    thumbnail: "/luxury-product-launch-cinematic.jpg",
    playbackId: "Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM",
  },
  {
    id: "6",
    titleRu: "Коммерческий ролик",
    titleEn: "Commercial Spot",
    directorRu: "Наташа Орлова",
    directorEn: "Natasha Orlova",
    thumbnail: "/premium-commercial-advertising.jpg",
    playbackId: "Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM",
  },
]

export function ShowreelHero() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { language, t } = useI18n()

  const currentPlaybackId = selectedProject?.playbackId || "Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM"

  const handleProjectSelect = (project: Project) => {
    if (project.id === selectedProject?.id) return

    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedProject(project)
      setIsTransitioning(false)
    }, 400)
  }

  const getTitle = (p: Project) => (language === "ru" ? p.titleRu : p.titleEn)
  const getDirector = (p: Project) => (language === "ru" ? p.directorRu : p.directorEn)

  // Transform projects for carousel
  const carouselProjects = PROJECTS.map((p) => ({
    ...p,
    title: getTitle(p),
    director: getDirector(p),
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

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-32 right-6 md:right-10 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-widest text-foreground/40 [writing-mode:vertical-lr]">
          {t("home.scroll")}
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-foreground/40 to-transparent"
        />
      </motion.div>

      {/* Filmstrip Carousel */}
      <FilmstripCarousel
        projects={carouselProjects}
        onProjectSelect={handleProjectSelect}
        selectedId={selectedProject?.id || null}
      />
    </section>
  )
}
