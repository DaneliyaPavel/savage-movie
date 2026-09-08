'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VideoPlayer } from '@/features/projects/components/mux-player'
import { FilmstripCarousel } from '@/features/projects/components/filmstrip-carousel'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { Preloader } from '@/components/ui/preloader'
import { useI18n } from '@/lib/i18n-context'
import { getThumbnailUrl } from '@/lib/integrations/bunny/client'

/*
 * Две ступени поверх нулевой. Шаг 60 мс: имя студии, следом чем она
 * занимается, последним — подпись. Лента поднимается почти сразу за ними.
 */
/*
 * Заставка — вступление к сайту, а не к маршруту. Она имеет право играть
 * только когда документ реально загружен на главной.
 *
 * Одного pathname недостаточно: после клиентского перехода /projects → /
 * он уже '/', хотя документ грузился на другом маршруте. Настоящий признак —
 * PerformanceNavigationTiming.name: это URL документа, и pushState его не
 * меняет.
 *
 * Второе условие — модульный флаг: он живёт до следующей полной загрузки
 * документа и гасит повтор на back/forward, на возврате из bfcache и на любом
 * повторном заходе на / внутри сессии.
 */
let openingPlayed = false

function shouldPlayOpening(): boolean {
  // На сервере главная рендерится только при настоящей загрузке документа
  if (typeof window === 'undefined') return true
  if (openingPlayed) return false
  try {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined
    const documentPath = nav?.name ? new URL(nav.name).pathname : window.location.pathname
    return documentPath === '/'
  } catch {
    return window.location.pathname === '/'
  }
}

const HERO_STEP_COPY = '60ms'
const HERO_STEP_SIGNATURE = '120ms'

interface Project {
  id: string
  titleRu: string
  titleEn: string
  directorRu: string
  directorEn: string
  client?: string | null
  thumbnail: string
  playbackId: string
  carousel_gif_url?: string | null
  slug?: string
}

interface ShowreelHeroProps {
  showreelPlaybackId: string
  projects?: Project[]
}

export function ShowreelHero({ showreelPlaybackId, projects = [] }: ShowreelHeroProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  /*
   * Два отдельных сигнала, а не один: заставка снимается в конце ухода, а
   * первый экран начинает подниматься в его начале. Раньше они были связаны
   * одним флагом, и hero стартовал только после полностью ушедшей заставки —
   * получалось две очереди подряд вместо одного перекрытого движения.
   */
  const [isLoading, setIsLoading] = useState(shouldPlayOpening)
  const [hasEntered, setHasEntered] = useState(() => !shouldPlayOpening())
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
      const fullProject = projects.find(p => p.id === project.id) || null
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

  useEffect(() => {
    // Со следующего монтирования вступление больше не играет
    openingPlayed = true

    /*
     * Страховка на случай, если заставка почему-то не отчиталась: первый экран
     * обязан прийти в конечное состояние сам. Повторная установка тех же
     * значений идемпотентна, гонки с колбэками заставки нет.
     */
    const safety = setTimeout(() => {
      setHasEntered(true)
      setIsLoading(false)
    }, 900)
    return () => clearTimeout(safety)
  }, [])

  const getTitle = (p: Project) => (language === 'ru' ? p.titleRu : p.titleEn)
  const getDirector = (p: Project) => (language === 'ru' ? p.directorRu : p.directorEn)

  // Transform projects for carousel
  const carouselProjects = projects.map(p => ({
    ...p,
    title: getTitle(p),
    director: getDirector(p),
    client: p.client,
  }))

  // Show preloader on initial load
  // Show preloader on initial load - overlay approach
  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <Preloader
            onExitStart={() => setHasEntered(true)}
            onComplete={() => setIsLoading(false)}
          />
        )}
      </AnimatePresence>

      {/*
        Заставка приходит с сервера как полноэкранный оверлей и снимается
        только гидратацией: без JS она навсегда закрывала главную сплошным
        красным экраном. Правило ниже — единственный корректный no-JS
        фолбэк: саму заставку, её тайминги и графику не трогаем, а без
        скрипта её просто нет, и первый экран сразу в конечном состоянии.
      */}
      <noscript>
        <style>{`
          .preloader-overlay { display: none !important; }
          [data-hero-entry] { transform: none !important; }
        `}</style>
      </noscript>

      {/*
        data-entered поднимается в момент, когда заставка НАЧАЛА уходить, —
        первый экран идёт под ней, а не после неё. При клиентском возврате на
        главную заставки нет и флаг поднят с самого монтирования: после ухода
        шторы перехода главная уже собрана.
      */}
      <section
        className="relative h-svh w-full overflow-hidden bg-background"
        data-entered={hasEntered}
      >
        {/* Main Video Player - Fullscreen */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentPlaybackId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <VideoPlayer
                playbackId={currentPlaybackId}
                poster={
                  currentPlaybackId === showreelPlaybackId
                    ? '/showreel-poster.jpg'
                    : getThumbnailUrl(currentPlaybackId)
                }
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

        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center px-6">
            {/* Brand name - modern italic bold styling — ступень 1 */}
            <h1
              data-hero-entry=""
              className="text-hero font-brand-hero uppercase text-white tracking-tight leading-[0.82] drop-shadow-[0_20px_60px_rgba(0,0,0,0.65)] font-black"
            >
              SAVAGE MOVIE
            </h1>

            {/* Subtitle - much closer to brand */}
            <div className="mt-2 md:mt-3 space-y-2">
              {/* Позиционирование и капабилити — ступень 2 */}
              <div
                data-hero-entry=""
                style={{ ['--reveal-delay' as string]: HERO_STEP_COPY }}
                className="text-sm md:text-base text-white/75 font-light tracking-wide leading-relaxed max-w-xl mx-auto"
              >
                {t('home.heroSubtitle')
                  .split('\n')
                  .map((line, i) => (
                    <p
                      key={i}
                      className={
                        i > 0 ? 'mt-1 text-white/55 text-xs md:text-sm tracking-widest' : ''
                      }
                    >
                      {line}
                    </p>
                  ))}
              </div>
              {/* Tagline - handwritten style — ступень 3 */}
              <p
                data-hero-entry=""
                className="text-lg md:text-xl text-white/70 tracking-wide"
                style={{
                  fontFamily: 'var(--font-handwritten), cursive',
                  ['--reveal-delay' as string]: HERO_STEP_SIGNATURE,
                }}
              >
                [ {t('home.heroTagline')} ]
              </p>
            </div>
          </div>
        </div>

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
              <p className="text-xs uppercase tracking-widest text-foreground/60 mb-1">
                {t('home.nowPlaying')}
              </p>
              <h2 className="text-2xl md:text-3xl font-light text-foreground">
                {getTitle(selectedProject)}
              </h2>
              <p className="text-sm text-foreground/70 mt-1">
                {t('home.directedBy')} {getDirector(selectedProject)}
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
          process.env.NODE_ENV === 'development' && (
            <div className="absolute bottom-0 left-0 right-0 z-30 p-8 text-center text-muted-foreground">
              <p className="text-sm">⚠️ {t('home.noFeaturedProjects')}</p>
            </div>
          )
        )}
      </section>
    </>
  )
}
