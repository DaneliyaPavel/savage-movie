"use client"

import { useState, useRef, useEffect, useMemo, type CSSProperties } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { TopBar } from "@/components/ui/top-bar"
import { JalousieMenu } from "@/components/ui/jalousie-menu"
import { useI18n } from "@/lib/i18n-context"
import { ProjectsJalousieFooter } from "@/components/sections/ProjectsJalousieFooter"
import MuxPlayer from "@mux/mux-player-react"
import { getProjects } from "@/lib/api/projects"
import { toMarketingProject, type MarketingProject } from "@/lib/marketing-mappers"
import { logger } from "@/lib/utils/logger"

const THUMBNAIL_SIZES = "(min-width: 1024px) 10vw, (min-width: 768px) 12vw, 20vw"
const MAIN_IMAGE_SIZES = "(min-width: 1024px) 40vw, (min-width: 768px) 35vw, 60vw"

function getPosterUrl(src?: string): string | undefined {
  if (!src) return undefined
  return src
}

const getPlaybackId = (url?: string | null): string | null => {
  if (!url) return null
  const muxMatch = url.match(/mux\.com\/([^/?]+)/) || url.match(/playbackId=([^&]+)/)
  const rawId = muxMatch?.[1] ?? null
  return rawId ? rawId.replace(/\.m3u8$/, "") : null
}

// Project Row Component - Freshman.tv style
function ProjectRow({
  project,
  index,
  language,
}: {
  project: MarketingProject
  index: number
  language: "ru" | "en"
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [thumbnailWidth, setThumbnailWidth] = useState<string>("75%")
  const [activeThumbIndex, setActiveThumbIndex] = useState(0)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [mediaHeight, setMediaHeight] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const muxRef = useRef<any>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoAspectRef = useRef<HTMLDivElement>(null)
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null)

  const visibleThumbs = useMemo(() => project.thumbnails.slice(0, 5), [project.thumbnails])
  const cycleLength = Math.max(visibleThumbs.length, 1)
  const playbackId = useMemo(() => getPlaybackId(project.videoUrl), [project.videoUrl])

  const posterUrl = useMemo(
    () => getPosterUrl(project.thumbnails[0]) || project.thumbnails[0] || "/placeholder.svg",
    [project.thumbnails],
  )

  const getTitle = () => (language === "ru" ? project.titleRu : project.titleEn)
  const getClient = () => (language === "ru" ? project.clientRu : project.clientEn)
  const getCategory = () => (language === "ru" ? project.categoryRu : project.category)
  const getDescription = () => (language === "ru" ? project.descriptionRu : project.descriptionEn)

  const handleMouseEnter = () => {
    setIsHovered(true)
    setActiveThumbIndex(0)
    if (project.videoUrl && !videoSrc && !playbackId) {
      setVideoSrc(project.videoUrl)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setActiveThumbIndex(0)
  }

  // Stable highlight cycling (no Date.now in render)
  useEffect(() => {
    if (!isHovered || cycleLength <= 1) return
    const intervalId = window.setInterval(() => {
      setActiveThumbIndex((prev) => (prev + 1) % cycleLength)
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [isHovered, cycleLength])

  useEffect(() => {
    if (playbackId) {
      const player = muxRef.current
      if (!player) return
      if (isHovered) {
        const playPromise = player.play?.()
        if (playPromise?.catch) {
          playPromise.catch(() => {})
        }
      } else {
        player.pause?.()
      }
      return
    }

    if (!videoRef.current) return
    if (isHovered) {
      const playPromise = videoRef.current.play()
      if (playPromise) {
        playPromise.catch(() => {})
      }
    } else {
      videoRef.current.pause()
    }
  }, [isHovered, videoSrc, playbackId])

  // Calculate thumbnail size to match video height exactly (5 thumbnails = video height)
  useEffect(() => {
    const calculateThumbnailSize = () => {
      if (!videoAspectRef.current || !thumbnailsContainerRef.current) return

      const videoHeight = videoAspectRef.current.offsetHeight
      if (videoHeight > 0) {
        setMediaHeight(videoHeight)
      }
      const computedStyle = getComputedStyle(thumbnailsContainerRef.current)
      const gapValue = computedStyle.gap || "12px"
      const gapPx = parseFloat(gapValue) || 12
      const totalGaps = 4 * gapPx // 4 промежутка между 5 миниатюрами
      const availableHeight = videoHeight - totalGaps
      const thumbnailHeight = availableHeight / 5
      const thumbnailWidthPx = thumbnailHeight * (16 / 9)
      const containerWidth = thumbnailsContainerRef.current.offsetWidth
      const maxWidth = Math.min(thumbnailWidthPx, containerWidth * 0.6)
      setThumbnailWidth(`${maxWidth}px`)
    }

    let frameId = 0
    const schedule = () => {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(calculateThumbnailSize)
    }

    schedule()

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            schedule()
          })
        : null

    if (resizeObserver && videoContainerRef.current) {
      resizeObserver.observe(videoContainerRef.current)
    }

    window.addEventListener("resize", schedule)
    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      window.removeEventListener("resize", schedule)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="border-t-2 border-dashed border-muted-foreground/80 py-8 md:py-12"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="grid grid-cols-12 gap-2 md:gap-3 items-start">
        {/* Column 1: Project Number - much larger */}
        <div className="col-span-1">
          <span
            className="text-xl md:text-2xl lg:text-3xl text-muted-foreground"
            style={{ fontFamily: "var(--font-handwritten), cursive" }}
          >
            # {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Column 2: Thumbnail Strip - sized to match video height exactly (5 thumbnails = video height), centered in column */}
        <div ref={thumbnailsContainerRef} className="col-span-2 flex flex-col gap-3 items-center">
          {visibleThumbs.map((thumb, thumbIndex) => (
            <motion.div
              key={thumbIndex}
              className="relative aspect-video overflow-hidden mx-auto"
              style={{ width: thumbnailWidth }}
              initial={{ opacity: 0.6 }}
              animate={{
                opacity: isHovered ? 1 : 0.6,
                scale: isHovered && thumbIndex === activeThumbIndex ? 1.02 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={thumb || "/placeholder.svg"}
                alt={`${getTitle()} кадр ${thumbIndex + 1}`}
                fill
                sizes={THUMBNAIL_SIZES}
                quality={60}
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* Column 3: Main Video - slightly smaller to match thumbnails height */}
        <div ref={videoContainerRef} className="col-span-4 md:col-span-5 relative">
          <div ref={videoAspectRef} className="relative aspect-[16/9.2] overflow-hidden bg-black">
            {playbackId ? (
              <MuxPlayer
                ref={muxRef}
                playbackId={playbackId}
                streamType="on-demand"
                metadata={{ video_title: getTitle() }}
                muted
                loop
                playsInline
                autoPlay={false}
                style={
                  {
                    "--controls": "none",
                    "--media-object-fit": "cover",
                  } as CSSProperties
                }
                className="absolute inset-0 w-full h-full"
              />
            ) : project.videoUrl ? (
              <video
                ref={videoRef}
                src={videoSrc ?? undefined}
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                src={project.thumbnails[0] || "/placeholder.svg"}
                alt={getTitle()}
                fill
                sizes={MAIN_IMAGE_SIZES}
                quality={70}
                className="object-cover"
              />
            )}

            {(playbackId || project.videoUrl) && (
              <span
                className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                  isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <span
                  className="text-white text-lg md:text-xl"
                  style={{ fontFamily: "var(--font-handwritten), cursive" }}
                >
                  [смотреть]
                </span>
              </span>
            )}

            <Link
              href={`/projects/${project.slug}`}
              aria-label={`Открыть проект ${getTitle()}`}
              className="absolute inset-0 z-10"
            />

            {/* AI Badge */}
            {project.isAI && (
              <div className="absolute top-3 left-3 px-2 py-1 bg-accent text-background text-xs uppercase tracking-widest z-10">
                AI
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Project Info - Category on top, Title/Client larger, Description at bottom - wider */}
        <Link
          href={`/projects/${project.slug}`}
          className="col-span-5 md:col-span-4 block h-full cursor-pointer"
          aria-label={`Открыть проект ${getTitle()}`}
        >
          <div
            className="flex flex-col justify-between h-full overflow-hidden transition-opacity hover:opacity-90"
            style={{ maxHeight: mediaHeight ? `${mediaHeight}px` : undefined }}
          >
            {/* Category - at the top right, larger like project numbers */}
            <div className="flex justify-end mb-2">
              <span
                className="text-lg md:text-xl lg:text-2xl text-muted-foreground italic transform -rotate-3"
                style={{ fontFamily: "var(--font-handwritten), cursive" }}
              >
                {getCategory()}
              </span>
            </div>

            {/* Client & Title - larger, positioned above video */}
            <div className="mb-3">
              <h3 className="text-base md:text-lg font-cinzel-bold uppercase tracking-wide mb-1">{getClient()}</h3>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-cinzel-bold uppercase tracking-tight leading-tight">
                {getTitle()}
              </h2>
            </div>

            {/* Description - at the bottom, larger and readable */}
            <div className="mt-auto">
              <p className="text-xs md:text-sm lg:text-base text-foreground leading-relaxed line-clamp-5 font-cinzel">
                {getDescription()}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}

export default function ProjectsPageClient({ initialProjects }: { initialProjects: MarketingProject[] }) {
  const { language, t } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const [projects, setProjects] = useState<MarketingProject[]>(initialProjects)

  useEffect(() => {
    if (initialProjects.length > 0) return

    let cancelled = false
    async function loadProjects() {
      try {
        const apiProjects = await getProjects()
        const transformed = apiProjects.map(toMarketingProject)
        if (!cancelled) {
          logger.debug("Projects loaded", { count: transformed.length })
          setProjects(transformed)
        }
      } catch (error) {
        logger.error("Ошибка загрузки проектов", error, { page: "/projects" })
        if (!cancelled) {
          setProjects([])
        }
      }
    }
    loadProjects()
    return () => {
      cancelled = true
    }
  }, [initialProjects.length])

  const visibleProjects = showAll ? projects : projects.slice(0, 4)

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      {/* Header - Freshman.tv style */}
      <header className="pt-20 pb-8 flex items-center justify-center relative">
        <div className="text-center">
          <span
            className="text-accent text-base md:text-lg"
            style={{ fontFamily: "var(--font-handwritten), cursive" }}
          >
            ({projects.length})
          </span>
          <h1 className="text-base uppercase tracking-widest font-cinzel-bold">{t("projects.title")}</h1>
        </div>
      </header>

      {/* Projects List */}
      <section className="px-4 md:px-8 lg:px-12 pb-12">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Проекты загружаются...</p>
            <p className="text-sm text-muted-foreground/70">
              Если проекты не появляются, проверьте консоль браузера (F12) для отладочной информации
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {visibleProjects.map((project, index) => (
              <ProjectRow key={project.id} project={project} index={index} language={language} />
            ))}
          </AnimatePresence>
        )}

        {/* Bottom border */}
        <div className="border-t border-dashed border-muted-foreground/30" />

        {!showAll && projects.length > 4 && (
          <motion.div
            className="flex justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setShowAll(true)}
              className="group flex items-center gap-3 text-white hover:text-white transition-colors"
            >
              <span
                className="text-2xl md:text-3xl"
                style={{ fontFamily: "var(--font-handwritten), cursive" }}
              >
                +
              </span>
              <span
                className="text-lg md:text-xl font-semibold tracking-wide"
                style={{ fontFamily: "var(--font-handwritten), cursive" }}
              >
                {language === "ru" ? "показать больше" : "show more"}
              </span>
            </button>
          </motion.div>
        )}
      </section>

      <ProjectsJalousieFooter />
    </main>
  )
}
