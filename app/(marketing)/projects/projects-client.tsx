'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { useI18n } from '@/lib/i18n-context'
import { useMenu } from '@/components/ui/menu-context'
import { ProjectsJalousieFooter } from '@/components/sections/ProjectsJalousieFooter'
import {
  HorizontalProjectMediaCard,
  VerticalProjectMediaCard,
} from '@/features/projects/components/ProjectMediaCard'
import Hls from 'hls.js'
import { getStreamUrl } from '@/lib/integrations/bunny/client'
import { getProjects } from '@/features/projects/api'
import { toMarketingProject, type MarketingProject } from '@/features/projects/mappers'
import {
  filterProjectsByOrientation,
  getProjectOrientation,
  type ProjectOrientationFilter,
} from '@/features/projects/utils'
import { logger } from '@/lib/utils/logger'

const THUMBNAIL_SIZES = '(min-width: 1024px) 10vw, (min-width: 768px) 12vw, 20vw'
const MAIN_IMAGE_SIZES = '(min-width: 1024px) 40vw, (min-width: 768px) 35vw, 60vw'
const SCRIBBLE_VARIANTS = 14

const getPlaybackId = (url?: string | null): string | null => {
  if (!url) return null
  return url
}

const createScribblePath = (seed: number) => {
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
  const rand = (step: number) => {
    const raw = Math.sin(seed * 91.345 + step * 37.421) * 10000
    return raw - Math.floor(raw)
  }

  const points: Array<[number, number]> = []
  let x = 8 + rand(1) * 16
  let y = 50 + (rand(2) - 0.5) * 20
  points.push([x, y])

  const steps = 14
  for (let i = 1; i <= steps; i++) {
    const dx = (rand(i * 2) - 0.5) * 48
    const dy = (rand(i * 2 + 1) - 0.5) * 46
    x = clamp(x + dx, 4, 96)
    y = clamp(y + dy, 8, 92)
    points.push([x, y])
  }

  if (points.length === 0) {
    return 'M 10 50'
  }
  if (points.length < 2) {
    const first = points[0]
    if (!first) return 'M 10 50'
    const [px, py] = first
    return `M ${px.toFixed(2)} ${py.toFixed(2)}`
  }

  const [startX, startY] = points[0] ?? [10, 50]
  let path = `M ${startX.toFixed(2)} ${startY.toFixed(2)}`
  for (let i = 1; i < points.length; i++) {
    const currentPoint = points[i]
    const previousPoint = points[i - 1]
    if (!currentPoint || !previousPoint) continue
    const [cx, cy] = currentPoint
    const [px, py] = previousPoint
    const mx = ((px + cx) / 2).toFixed(2)
    const my = ((py + cy) / 2).toFixed(2)
    path += ` Q ${px.toFixed(2)} ${py.toFixed(2)} ${mx} ${my}`
  }
  return path
}

function ScribbleStrike({
  active,
  seed,
  trigger,
  delay = 0,
  className = '',
}: {
  active: boolean
  seed: number
  trigger: number
  delay?: number
  className?: string
}) {
  const path = useMemo(() => createScribblePath(seed), [seed])
  const rotate = (seed % 9) * 2.2 - 8
  const scaleX = 1 + (seed % 3) * 0.04
  const scaleY = 1 + (seed % 4) * 0.05
  if (!active) return null

  return (
    <span
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        transform: `rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`,
        transformOrigin: '50% 50%',
      }}
      aria-hidden="true"
    >
      <svg
        key={trigger}
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <motion.path
          d={path}
          stroke="#ff2936"
          strokeWidth={1.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0, 1, 1, 1], opacity: [0, 1, 0.85, 0] }}
          transition={{
            duration: 1.4,
            delay,
            times: [0, 0.35, 0.55, 1],
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </svg>
    </span>
  )
}

// Project Row Component - Freshman.tv style
function ProjectRow({
  project,
  index,
  language,
}: {
  project: MarketingProject
  index: number
  language: 'ru' | 'en'
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [thumbnailWidth, setThumbnailWidth] = useState<string>('75%')
  const [activeThumbIndex, setActiveThumbIndex] = useState(0)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [mediaHeight, setMediaHeight] = useState<number | null>(null)
  const [scribbleSeed, setScribbleSeed] = useState(0)
  const [scribbleTrigger, setScribbleTrigger] = useState(0)
  const [isInViewport, setIsInViewport] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoAspectRef = useRef<HTMLDivElement>(null)
  const thumbnailsContainerRef = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const lastScribbleRef = useRef<number | null>(null)

  const visibleThumbs = useMemo(() => project.thumbnails.slice(0, 5), [project.thumbnails])
  const cycleLength = Math.max(visibleThumbs.length, 1)
  const playbackId = useMemo(() => getPlaybackId(project.videoUrl), [project.videoUrl])
  const orientation = getProjectOrientation(project)
  const isVertical = orientation === 'vertical'
  const MediaCard = isVertical ? VerticalProjectMediaCard : HorizontalProjectMediaCard
  const thumbAspectClass = isVertical ? 'aspect-[9/16]' : 'aspect-video'
  const mediaCardClassName = 'w-full'
  const mediaAspectClassName = isVertical ? 'aspect-[16/9.2]' : undefined
  const mediaFitClassName = isVertical ? 'object-contain' : 'object-cover'
  const videoObjectFit = isVertical ? 'contain' : 'cover'

  const shouldPlay = isMobile ? isInViewport : isHovered

  const getTitle = () => (language === 'ru' ? project.titleRu : project.titleEn)
  const getClient = () => (language === 'ru' ? project.clientRu : project.clientEn)
  const getCategory = () => (language === 'ru' ? project.categoryRu : project.category)
  const getDescription = () => (language === 'ru' ? project.descriptionRu : project.descriptionEn)

  // Detect mobile
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // IntersectionObserver for mobile auto-play
  useEffect(() => {
    const row = rowRef.current
    if (!row) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry?.isIntersecting ?? false
        setIsInViewport(inView)
        if (inView && project.videoUrl && !videoSrc && !playbackId) {
          setVideoSrc(project.videoUrl)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(row)
    return () => observer.disconnect()
  }, [project.videoUrl, videoSrc, playbackId])

  const handleMouseEnter = () => {
    setIsHovered(true)
    setActiveThumbIndex(0)
    const previous = lastScribbleRef.current
    let next = Math.floor(Math.random() * SCRIBBLE_VARIANTS)
    if (previous !== null && next === previous) {
      next = (next + 1) % SCRIBBLE_VARIANTS
    }
    lastScribbleRef.current = next
    setScribbleSeed(next)
    setScribbleTrigger(value => value + 1)
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
      setActiveThumbIndex(prev => (prev + 1) % cycleLength)
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [isHovered, cycleLength])

  // Init HLS for Bunny Stream
  useEffect(() => {
    const video = videoRef.current
    if (!video || !playbackId) return

    const src = getStreamUrl(playbackId)

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, startLevel: -1 })
      hls.loadSource(src)
      hls.attachMedia(video)
      hlsRef.current = hls
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [playbackId])

  // Video play/pause
  useEffect(() => {
    if (!videoRef.current) return
    if (shouldPlay) {
      const playPromise = videoRef.current.play()
      if (playPromise) {
        playPromise.catch(() => { })
      }
    } else {
      videoRef.current.pause()
    }
  }, [shouldPlay, videoSrc, playbackId])

  // Calculate thumbnail size to match video height exactly (desktop only)
  useEffect(() => {
    const thumbAspectRatio = isVertical ? 9 / 16 : 16 / 9

    const calculateThumbnailSize = () => {
      if (!videoAspectRef.current || !thumbnailsContainerRef.current) return

      const videoHeight = videoAspectRef.current.offsetHeight
      if (videoHeight > 0) {
        setMediaHeight(videoHeight)
      }
      const computedStyle = getComputedStyle(thumbnailsContainerRef.current)
      const gapValue = computedStyle.gap || '12px'
      const gapPx = parseFloat(gapValue) || 12
      const totalGaps = 4 * gapPx // 4 промежутка между 5 миниатюрами
      const availableHeight = videoHeight - totalGaps
      const thumbnailHeight = availableHeight / 5
      const thumbnailWidthPx = thumbnailHeight * thumbAspectRatio
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
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
          schedule()
        })
        : null

    if (resizeObserver && videoContainerRef.current) {
      resizeObserver.observe(videoContainerRef.current)
    }

    window.addEventListener('resize', schedule)
    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      window.removeEventListener('resize', schedule)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [isVertical])

  const videoContent = (
    <>
      {playbackId ? (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          title={getTitle()}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: videoObjectFit as 'cover' | 'contain' }}
        />
      ) : project.videoUrl ? (
        <video
          ref={videoRef}
          src={videoSrc ?? undefined}
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full ${mediaFitClassName}`}
        />
      ) : (
        <Image
          src={project.thumbnails[0] || '/placeholder.svg'}
          alt={getTitle()}
          fill
          sizes={MAIN_IMAGE_SIZES}
          quality={70}
          className={mediaFitClassName}
        />
      )}
    </>
  )

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="border-t-2 border-dashed border-muted-foreground/20 py-6 md:py-8"
      data-orientation={orientation}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col gap-3 md:grid md:grid-cols-12 md:gap-3 md:items-start">
        {/* Number */}
        <div className="md:col-span-1">
          <span
            className="text-xl md:text-2xl lg:text-3xl text-muted-foreground"
            style={{ fontFamily: 'var(--font-handwritten), cursive' }}
          >
            # {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Thumbnails - desktop only */}
        <div
          ref={thumbnailsContainerRef}
          className="hidden md:flex md:flex-col md:gap-3 md:items-center md:col-span-2"
        >
          {visibleThumbs.map((thumb, thumbIndex) => (
            <motion.div
              key={thumbIndex}
              className={`relative ${thumbAspectClass} overflow-hidden mx-auto`}
              style={{ width: thumbnailWidth }}
              initial={{ opacity: 0.6 }}
              animate={{
                opacity: isHovered ? 1 : 0.6,
                scale: isHovered && thumbIndex === activeThumbIndex ? 1.02 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={thumb || '/placeholder.svg'}
                alt={`${getTitle()} кадр ${thumbIndex + 1}`}
                fill
                sizes={THUMBNAIL_SIZES}
                quality={60}
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* Mobile info header - mobile only */}
        <div className="md:hidden flex items-start justify-between gap-4">
          <div>
            <h3
              className="text-xs uppercase tracking-[0.28em] mb-0.5 opacity-80"
              style={{ fontFamily: 'var(--font-brand-hero)' }}
            >
              {getClient()}
            </h3>
            <h2
              className="text-2xl font-black uppercase tracking-tighter leading-[0.92]"
              style={{ fontFamily: 'var(--font-brand-hero)' }}
            >
              {getTitle()}
            </h2>
          </div>
          <span
            className="text-base text-muted-foreground italic transform -rotate-3 pt-1 shrink-0"
            style={{ fontFamily: 'var(--font-handwritten), cursive' }}
          >
            {getCategory()}
          </span>
        </div>

        {/* Video */}
        <div
          ref={videoContainerRef}
          className="md:col-span-5 relative"
        >
          <MediaCard
            innerRef={videoAspectRef}
            className={mediaCardClassName}
            aspectClassName={mediaAspectClassName}
          >
            {videoContent}

            {(playbackId || project.videoUrl) && (
              <motion.span
                initial={false}
                animate={shouldPlay ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <span
                  className="text-white text-2xl md:text-3xl tracking-wider hidden md:inline"
                  style={{ fontFamily: 'var(--font-handwritten), cursive' }}
                >
                  {language === 'ru' ? '[СМОТРеТЬ]' : '[VIEW]'}
                </span>
              </motion.span>
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
          </MediaCard>
        </div>

        {/* Mobile description - mobile only */}
        <p
          className="md:hidden text-[15px] text-foreground/90 leading-[1.65] line-clamp-4"
          style={{ fontFamily: 'var(--font-sans)', fontWeight: 300 }}
        >
          {getDescription()}
        </p>

        {/* Desktop info column - desktop only */}
        <Link
          href={`/projects/${project.slug}`}
          className="hidden md:block md:col-span-4 h-full cursor-pointer"
          aria-label={`Открыть проект ${getTitle()}`}
        >
          <div
            className="flex flex-col justify-between h-full overflow-hidden transition-opacity hover:opacity-90"
            style={{ maxHeight: mediaHeight ? `${mediaHeight}px` : undefined }}
          >
            {/* Title + Category aligned at the top */}
            <div className="flex items-start justify-between gap-4">
              <div className="relative inline-block">
                <ScribbleStrike
                  active={isHovered}
                  seed={scribbleSeed}
                  trigger={scribbleTrigger}
                />
                <h3
                  className="text-xs md:text-sm uppercase tracking-[0.28em] mb-0.5 relative z-[1] opacity-80"
                  style={{ fontFamily: 'var(--font-brand-hero)' }}
                >
                  {getClient()}
                </h3>
                <h2
                  className="text-3xl md:text-4xl lg:text-[2.6rem] font-black uppercase tracking-tighter leading-[0.92] relative z-[1]"
                  style={{ fontFamily: 'var(--font-brand-hero)' }}
                >
                  {getTitle()}
                </h2>
              </div>

              <span
                className="text-lg md:text-xl lg:text-2xl text-muted-foreground italic transform -rotate-3 pt-1"
                style={{ fontFamily: 'var(--font-handwritten), cursive' }}
              >
                {getCategory()}
              </span>
            </div>

            <motion.span
              initial={false}
              animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 block text-white text-lg md:text-xl"
              style={{ fontFamily: 'var(--font-handwritten), cursive' }}
            >
              {language === 'ru' ? 'иЗУЧиТь' : 'eXPLoRe'}
            </motion.span>

            {/* Description - at the bottom */}
            <div className="mt-auto">
              <p
                className="text-[15px] md:text-[16px] lg:text-[17px] xl:text-[19px] 2xl:text-[21px] text-foreground/90 leading-[1.65] line-clamp-4"
                style={{ fontFamily: 'var(--font-sans)', fontWeight: 300 }}
              >
                {getDescription()}
              </p>
            </div>
          </div>
        </Link>
      </div>
    </motion.div>
  )
}

export default function ProjectsPageClient({
  initialProjects,
}: {
  initialProjects: MarketingProject[]
}) {
  const { language, t } = useI18n()
  const { setHeaderDark } = useMenu()
  const [showAll, setShowAll] = useState(false)
  const [projects, setProjects] = useState<MarketingProject[]>(initialProjects)
  const [orientationFilter, setOrientationFilter] = useState<ProjectOrientationFilter>('all')
  const curtainRef = useRef<HTMLDivElement>(null)

  // Switch header to dark when red footer is revealed
  useEffect(() => {
    const handleScroll = () => {
      const curtain = curtainRef.current
      if (!curtain) return
      const rect = curtain.getBoundingClientRect()
      setHeaderDark(rect.bottom < 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      setHeaderDark(false)
    }
  }, [setHeaderDark])

  useEffect(() => {
    if (initialProjects.length > 0) return

    let cancelled = false
    async function loadProjects() {
      try {
        const apiProjects = await getProjects()
        const transformed = apiProjects.map(toMarketingProject)
        if (!cancelled) {
          logger.debug('Projects loaded', { count: transformed.length })
          setProjects(transformed)
        }
      } catch (error) {
        logger.error('Ошибка загрузки проектов', error, { page: '/projects' })
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

  const filteredProjects = useMemo(
    () => filterProjectsByOrientation(projects, orientationFilter),
    [projects, orientationFilter]
  )
  const visibleProjects = showAll ? filteredProjects : filteredProjects.slice(0, 4)
  const orientationLabel = language === 'ru' ? 'Ориентация' : 'Orientation'
  const emptyStateLabel =
    language === 'ru'
      ? 'Проекты для выбранной ориентации не найдены'
      : 'No projects found for this orientation'
  const orientationFilters = [
    { value: 'all', label: language === 'ru' ? 'Все' : 'All' },
    { value: 'horizontal', label: language === 'ru' ? 'Горизонтальные' : 'Horizontal' },
    { value: 'vertical', label: language === 'ru' ? 'Вертикальные' : 'Vertical' },
  ] as const

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      {/* Curtain: sits above fixed footer; when it scrolls up, footer (under spacer) becomes visible */}
      <div ref={curtainRef} className="relative z-20 bg-background">
      {/* Header - Freshman.tv style */}
      <header className="pt-20 pb-8 flex items-center justify-center relative">
        <div className="text-center">
          <span
            className="text-accent text-base md:text-lg"
            style={{ fontFamily: 'var(--font-handwritten), cursive' }}
          >
            ({projects.length})
          </span>
          <h1 className="text-base uppercase tracking-widest font-oranienbaum">
            {t('projects.title')}
          </h1>
          {/* Из портфолио — на коммерческую страницу: человек, который смотрит
              работы, чаще всего пришёл за роликом, а не за списком */}
          <Link
            href="/reklamny-rolik"
            className="mt-4 inline-block text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground border-b border-white/15 pb-1 transition-colors hover:text-white hover:border-white/40"
          >
            {language === 'ru' ? 'Рекламные ролики для бизнеса' : 'Commercial production'}
          </Link>
        </div>
      </header>

      {/* Projects List */}
      <section className="px-4 md:px-8 lg:px-12 pb-12">
        <div className="mb-10 md:mb-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-muted-foreground">
            {orientationLabel}
          </div>
          <div className="flex flex-wrap gap-3">
            {orientationFilters.map(filter => {
              const isActive = orientationFilter === filter.value
              const shapeBase = 'rounded-[2px] border border-current/40 bg-current/10'
              const horizontalShape = `${shapeBase} h-3 md:h-3.5 aspect-[16/9]`
              const verticalShape = `${shapeBase} h-5 md:h-6 aspect-[9/16]`

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setOrientationFilter(filter.value)}
                  aria-pressed={isActive}
                  className={`group inline-flex items-center gap-3 rounded-md border px-4 py-3 text-[10px] md:text-xs uppercase tracking-[0.25em] transition ${isActive
                    ? 'border-accent/70 bg-accent/10 text-white shadow-[0_10px_30px_rgba(255,41,54,0.18)]'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'
                    }`}
                >
                  {filter.value === 'all' ? (
                    <span className="flex items-end gap-1">
                      <span className={horizontalShape} />
                      <span className={verticalShape} />
                    </span>
                  ) : filter.value === 'vertical' ? (
                    <span className={verticalShape} />
                  ) : (
                    <span className={horizontalShape} />
                  )}
                  <span>{filter.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Проекты загружаются...</p>
            <p className="text-sm text-muted-foreground/70">
              Если проекты не появляются, проверьте консоль браузера (F12) для отладочной информации
            </p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{emptyStateLabel}</p>
          </div>
        ) : (
          <AnimatePresence>
            {visibleProjects.map((project, index) => (
              <ProjectRow key={project.id} project={project} index={index} language={language} />
            ))}
          </AnimatePresence>
        )}

        {/* Bottom border */}
        <div className="mt-10 border-t border-dashed border-muted-foreground/20" />

        {!showAll && filteredProjects.length > 4 && (
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
                style={{ fontFamily: 'var(--font-handwritten), cursive' }}
              >
                +
              </span>
              <span
                className="text-lg md:text-xl font-semibold tracking-wide"
                style={{ fontFamily: 'var(--font-handwritten), cursive' }}
              >
                {language === 'ru' ? 'показать больше' : 'show more'}
              </span>
            </button>
          </motion.div>
        )}
      </section>
      </div>

      {/* Transparent spacer: creates scroll room; footer (z-10) paints on top so it's visible here */}
      <div className="min-h-screen" aria-hidden="true" />

      <ProjectsJalousieFooter />
    </main>
  )
}
