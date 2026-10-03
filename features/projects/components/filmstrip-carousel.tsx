'use client'

import { useCallback, useRef, useEffect, useState, memo } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import Image from 'next/image'
import Link from 'next/link'
import { MotionSurface } from '@/components/media/motion-surface'
import { normalizePosterUrl } from '@/lib/commercial-landing/poster-url'
import { useHeroSettled } from '@/lib/media/use-hero-settled'

interface FilmstripProject {
  id: string
  title: string
  director: string
  client?: string | null
  thumbnail: string
  playbackId?: string | null
  carousel_gif_url?: string | null
  slug?: string
}

interface FilmstripCarouselProps {
  projects: FilmstripProject[]
  onProjectSelect: (project: FilmstripProject) => void
  selectedId: string | null
}

const HOVER_NOTES = ['смотреть', 'включить', 'взглянуть', 'версия режиссера', 'узнать больше']

export function FilmstripCarousel({
  projects,
  onProjectSelect,
  selectedId,
}: FilmstripCarouselProps) {
  const autoScroll = useRef(
    AutoScroll({
      speed: 0.9,
      startDelay: 0,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      playOnInit: true,
    })
  )
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      containScroll: false,
    },
    [autoScroll.current]
  )
  /*
   * Плитки живут статичными кадрами, пока hero не определился: анимированные
   * webp по 9 МБ и потоки HLS на старте отнимали канал у первого экрана.
   */
  const heroSettled = useHeroSettled()
  const wheelTargetRef = useRef<HTMLDivElement | null>(null)
  const wheelResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleWheelNative = useCallback(
    (event: WheelEvent) => {
      if (!emblaApi || event.ctrlKey) return
      const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
      if (delta === 0) return
      event.preventDefault()
      autoScroll.current?.stop()
      if (wheelResumeTimerRef.current) {
        clearTimeout(wheelResumeTimerRef.current)
      }
      wheelResumeTimerRef.current = setTimeout(() => {
        autoScroll.current?.play()
      }, 900)
      const engine = emblaApi.internalEngine()
      engine.scrollBody.useBaseFriction().useBaseDuration()
      // Increased sensitivity for better feel
      engine.scrollTo.distance(engine.axis.direction(delta * 2.6), false)
    },
    [emblaApi]
  )

  const setEmblaRefs = useCallback(
    (node: HTMLDivElement | null) => {
      emblaRef(node)
    },
    [emblaRef]
  )

  useEffect(() => {
    const node = wheelTargetRef.current
    if (!node) return
    node.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => {
      node.removeEventListener('wheel', handleWheelNative)
    }
  }, [handleWheelNative])

  const handleWheelZone = useCallback(
    (node: HTMLDivElement | null) => {
      wheelTargetRef.current = node
    },
    []
  )

  const displayProjects = projects.length < 6 ? [...projects, ...projects, ...projects] : projects

  const handleMouseEnter = useCallback(() => {
    autoScroll.current?.stop()
  }, [])

  const handleMouseLeave = useCallback(() => {
    autoScroll.current?.play()
  }, [])

  return (
    /*
     * Лента приходила initial={{opacity:0}} и поднималась целую секунду: без
     * JS главная оставалась без единого проекта, а с JS работы появлялись
     * последними. Теперь она есть в server HTML, а подъём — transform от
     * состояния секции (data-entered), кривая и переменные общие для сайта.
     */
    <div
      data-hero-entry="filmstrip"
      style={{ ['--reveal-delay' as string]: '80ms' }}
      className="absolute bottom-0 left-0 right-0 z-30 pb-10 pointer-events-none"
    >
      {/* Track wrapper */}
      <div className="w-full pointer-events-auto">
        <div className="relative">
          {/* Decorative lines - Dashed & More Visible */}
          <div className="absolute left-0 right-0 top-0 z-10 border-t border-dashed border-white/70 pointer-events-none" />
          <div className="absolute left-0 right-0 bottom-0 z-10 border-b border-dashed border-white/70 pointer-events-none" />

          {/* Carousel Content */}
          <div
            ref={handleWheelZone}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="bg-black/30 backdrop-blur-md py-3 md:py-4 overflow-hidden"
          >
            <div
              ref={setEmblaRefs}
              className="cursor-grab active:cursor-grabbing"
            >
              <div className="flex">
                {displayProjects.map((project, index) => (
                  <FilmstripItem
                    key={`${project.id}-carousel-${index}`}
                    project={project}
                    isSelected={selectedId === project.id}
                    index={index}
                    animate={heroSettled}
                    // Pick a random note based on index + id hash roughly
                    noteText={HOVER_NOTES[index % HOVER_NOTES.length] ?? 'Смотреть'}
                    onSelect={() => onProjectSelect(project)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TILE_STAGGER_MS = 350

/** Анимацию плиток не включаем при reduced-motion и Save-Data */
function tileMotionAllowed(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return !conn?.saveData
}

const FilmstripItem = memo(function FilmstripItem({
  project,
  isSelected,
  index,
  animate,
  noteText,
  onSelect,
}: {
  project: FilmstripProject
  isSelected: boolean
  index: number
  /** hero определился: можно подключать движение */
  animate: boolean
  noteText?: string
  onSelect: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [gifRequested, setGifRequested] = useState(false)
  const [gifLoaded, setGifLoaded] = useState(false)

  // Determine which media source to use for the "GIF" effect
  // Priority: carousel_gif_url > playbackId > thumbnail
  const rawCarouselGifUrl = project.carousel_gif_url ?? ''

  // Check if carousel_gif_url is a Bunny Video ID (no slashes, no dots = just a GUID)
  const isBunnyVideoId = rawCarouselGifUrl !== '' && !rawCarouselGifUrl.includes('/') && !rawCarouselGifUrl.includes('.')
  const isUrlGif = rawCarouselGifUrl.startsWith('http') || rawCarouselGifUrl.startsWith('/')
  const isGifImage = isUrlGif && (rawCarouselGifUrl.toLowerCase().includes('.gif') || rawCarouselGifUrl.toLowerCase().includes('.webp'))
  const usePlaybackHls = !project.carousel_gif_url && project.playbackId

  // HLS init for Bunny video IDs or playbackId fallback
  const hlsVideoId = isBunnyVideoId ? rawCarouselGifUrl : (usePlaybackHls ? project.playbackId : null)

  /*
   * Анимированный gif/webp подключаем, когда hero определился, плитка на
   * экране и движение разрешено, с небольшой задержкой по номеру плитки,
   * чтобы загрузки не стартовали одной пачкой.
   */
  const wantsGif = isUrlGif && isGifImage
  useEffect(() => {
    if (!wantsGif || !animate || gifRequested) return
    const container = containerRef.current
    if (!container || !tileMotionAllowed()) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(e => e.isIntersecting)) return
        observer.disconnect()
        timer = setTimeout(() => setGifRequested(true), (index % 8) * TILE_STAGGER_MS)
      },
      { threshold: 0.1, rootMargin: '100px' }
    )
    observer.observe(container)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [wantsGif, animate, gifRequested, index])

  // Статичный кадр: у части работ в CMS лежит анимированный preview.webp на 1–2 МБ
  const thumbSrc = normalizePosterUrl(project.thumbnail || '/placeholder.svg')

  const content = (
    <div
      className={`
        flex flex-row items-center
        mx-6 transition-all duration-500
        ${isSelected ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}
      `}
    >
      {/* Media container - Reduced size for horizontal layout */}
      <div
        ref={containerRef}
        className="relative w-[180px] h-[101px] overflow-hidden bg-zinc-900 rounded-sm shadow-xl transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      >
        {/*
          Статичный кадр всегда под движением. Поток HLS и прямой MP4 ведёт
          общий медиа-слой: на мыши плитка оживает при наведении, на таче — не
          больше двух плиток в кадре; анимированный gif/webp подгружается
          поверх кадра, когда hero определился.
        */}
        {isBunnyVideoId || usePlaybackHls ? (
          <MotionSurface
            name="filmstrip-tile"
            streamId={hlsVideoId}
            fallbackPoster={thumbSrc}
            fallbackSizes="180px"
            play="hover"
            hoverScope=".group"
            afterHero
            className="absolute inset-0"
          />
        ) : isUrlGif && !isGifImage ? (
          <MotionSurface
            name="filmstrip-tile"
            mp4={{ desktop: rawCarouselGifUrl, mobile: rawCarouselGifUrl }}
            fallbackPoster={thumbSrc}
            fallbackSizes="180px"
            play="hover"
            hoverScope=".group"
            afterHero
            className="absolute inset-0"
          />
        ) : (
          <>
            <Image
              src={thumbSrc}
              alt={project.title}
              fill
              sizes="180px"
              draggable={false}
              className="object-cover"
            />
            {wantsGif && gifRequested ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={rawCarouselGifUrl}
                alt=""
                aria-hidden="true"
                decoding="async"
                width={180}
                height={101}
                draggable={false}
                onLoad={() => setGifLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[var(--motion-media)] ease-[var(--ease-out-expo)] ${gifLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            ) : null}
          </>
        )}

        {/* Hover-only dim to match reference (no darkening at rest) */}
        <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />

        {/* Hover Overlay with Handwritten Text - Red and random */}
        <div className="absolute inset-0 z-[10] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-transparent">
          <span
            className="text-2xl text-[#FF322E] transform -rotate-12 select-none drop-shadow-lg leading-none"
            style={{ fontFamily: 'var(--font-handwritten), cursive' }}
          >
            {noteText}
          </span>
        </div>
      </div>

      {/* Text Container - To the right */}
      <div className="ml-4 flex flex-col justify-center min-w-[120px] text-left">
        {/* Client - Top */}
        {project.client && (
          <p
            className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-white/60 font-black mb-1"
            style={{ fontFamily: 'var(--font-brand-hero)' }}
          >
            {project.client}
          </p>
        )}

        {/* Project Title - Bottom */}
        <h3
          className="text-lg md:text-xl text-white font-black leading-none transition-colors duration-300 whitespace-nowrap"
          style={{ fontFamily: 'var(--font-brand-hero)' }}
        >
          {project.title}
        </h3>
      </div>
    </div>
  )

  return (
    <div className="flex-shrink-0 group cursor-pointer">
      {project.slug ? (
        <Link href={`/projects/${project.slug}`} onClick={onSelect} className="block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff2936]">
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onSelect} className="block rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff2936]">
          {content}
        </button>
      )}
    </div>
  )
})
