'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useMenu } from './menu-context'
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n-context'
import { getProjects } from '@/features/projects/api'
import { getCourses } from '@/features/courses/api'
import { getBlogPosts } from '@/lib/api/blog'
import { cn } from '@/lib/utils'

// Scribble SVG Component - defined outside to maintain stable identity for AnimatePresence
const ScribbleStrike = () => (
  <svg viewBox="0 0 200 20" className="w-full h-full absolute top-1/2 left-0 -translate-y-1/2 pointer-events-none overflow-visible">
    <motion.path
      d="M5,15 Q50,5 90,12 T180,5"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinecap="round"
      className="text-[#FF322E]"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      exit={{ pathLength: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    />
  </svg>
)

export function JalousieMenu() {
  const { isOpen, setIsOpen } = useMenu()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { language, setLanguage, t } = useI18n()

  const [projectsCount, setProjectsCount] = useState<number | null>(null)
  const [coursesCount, setCoursesCount] = useState<number | null>(null)
  const [blogCount, setBlogCount] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    async function loadCounts() {
      try {
        const [projects, courses, blogPosts] = await Promise.allSettled([
          getProjects(),
          getCourses(),
          getBlogPosts(true),
        ])
        if (cancelled) return
        setProjectsCount(projects.status === 'fulfilled' ? projects.value.length : null)
        setCoursesCount(courses.status === 'fulfilled' ? courses.value.length : null)
        setBlogCount(blogPosts.status === 'fulfilled' ? blogPosts.value.length : null)
      } catch {
        if (cancelled) return
        // keep nulls; counts are optional UI sugar
        setProjectsCount(null)
        setCoursesCount(null)
        setBlogCount(null)
      }
    }

    loadCounts()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  type CountKey = 'projects' | 'courses' | 'blog' | null

  /* Menu items - Asymmetric layout matching freshman reference */
  const NAV_ITEMS = useMemo(
    () =>
      [
        {
          labelKey: 'nav.home',
          href: '/',
          countKey: null as CountKey,
          position: 'left' as const,
        },
        {
          labelKey: 'nav.projects',
          href: '/projects',
          countKey: 'projects' as CountKey,
          position: 'right' as const,
        },
        {
          labelKey: 'nav.courses',
          href: '/courses',
          countKey: 'courses' as CountKey,
          position: 'full' as const,
        },
        {
          labelKey: 'nav.studio',
          href: '/about',
          countKey: null as CountKey,
          position: 'right' as const,
        },
        {
          labelKey: 'nav.blog',
          href: '/blog',
          countKey: 'blog' as CountKey,
          position: 'left' as const,
        },
        {
          labelKey: 'nav.contact',
          href: '/contact',
          countKey: null as CountKey,
          position: 'center' as const,
        },
      ] as const,
    []
  )

  const getCountForKey = (key: CountKey): number | null => {
    if (!key) return null
    if (key === 'blog') return blogCount
    if (key === 'projects') return projectsCount
    if (key === 'courses') return coursesCount
    return null
  }

  const formatCount = (count: number | null) => {
    if (count === null) return ''
    return `(${count})`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          transition={{ duration: 0.7, ease: [0.83, 0, 0.17, 1] }}
          className="fixed inset-0 z-50 bg-[#a4a49c] overflow-hidden"
        >
          {/* Brand Logo - Top Center - Clickable */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[60]"
          >
            <Link href="/" onClick={() => setIsOpen(false)} className="block">
              <Image
                src="/sm-logo.svg"
                alt="SAVAGE MOVIE"
                width={180}
                height={60}
                className="w-32 md:w-44 h-auto opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
              />
            </Link>
          </motion.div>

          {/* Language Toggle - Top Left */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.3 }}
            onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
            className="absolute top-6 left-6 md:left-10 w-12 h-12 rounded-full border border-black/20 flex items-center justify-center text-sm font-medium hover:bg-black/5 transition-colors uppercase text-black/80 z-[60]"
            aria-label={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
          >
            {language}
          </motion.button>

          {/* Close Button - Top Right */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 md:right-10 flex items-center gap-3 text-black/80 group z-[60]"
            aria-label="Close menu"
          >
            <span className="text-sm font-medium tracking-wide uppercase opacity-60 group-hover:opacity-100 transition-opacity">
              {t('nav.close')}
            </span>
            <motion.div
              className="w-8 h-8 flex items-center justify-center"
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            </motion.div>
          </motion.button>

          {/* Menu Items - Asymmetric Layout matching freshman reference */}
          <nav className="absolute inset-0 z-40 overflow-y-auto">
            <div className="min-h-full w-screen flex flex-col justify-center py-32 relative">
              {NAV_ITEMS.map((item, index) => {
                const isLeft = item.position === 'left'
                const isRight = item.position === 'right'
                const isCenter = item.position === 'center'
                const isFull = item.position === 'full'

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{
                      delay: 0.2 + index * 0.08,
                      duration: 0.6,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className="relative w-screen"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Full-width dotted border spanning entire viewport */}
                    <div
                      className="absolute top-0 left-0 right-0 border-t border-dotted border-black/20"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        right: '50%',
                        marginLeft: '-50vw',
                        marginRight: '-50vw',
                        width: '100vw',
                        borderWidth: '1px',
                      }}
                    />

                    {/* Hover Background - all items */}
                    <motion.div
                      className="absolute inset-0 bg-black z-0 pointer-events-none"
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: hoveredIndex === index ? 1 : 0,
                      }}
                      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                      style={{ transformOrigin: 'left' }}
                    />

                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="relative block py-6 md:py-8 lg:py-10 group z-10 w-full"
                    >
                      <div
                        className={cn(
                          "relative flex items-center gap-3 md:gap-4 w-full px-6 md:px-10",
                          isLeft ? "justify-start" : isRight ? "justify-end" : isCenter || isFull ? "justify-center" : "justify-start"
                        )}
                      >
                        {/* Text with Scribble Overlay */}
                        <div className="relative inline-block">
                          <span
                            className={cn(
                              "relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight uppercase leading-[0.85] transition-colors duration-300",
                              hoveredIndex === index ? "text-white" : "text-black/85"
                            )}
                            style={{ fontFamily: 'var(--font-heading), serif' }}
                          >
                            {t(item.labelKey)}
                          </span>

                          {/* Scribble on Hover */}
                          {
                            <AnimatePresence>
                              {hoveredIndex === index && <ScribbleStrike />}
                            </AnimatePresence>
                          }
                        </div>

                        {/* Count */}
                        {item.countKey && formatCount(getCountForKey(item.countKey)) && (
                          <span
                            className={cn(
                              "relative text-lg md:text-xl lg:text-2xl transition-colors duration-300",
                              hoveredIndex === index ? "text-white/60" : "text-black/40"
                            )}
                            style={{ fontFamily: 'var(--font-handwritten), cursive' }}
                          >
                            {formatCount(getCountForKey(item.countKey))}
                          </span>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>

            {/* Bottom Info - Repositioned inside scrollable area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full px-6 md:px-10 flex justify-between items-end text-sm text-black/60 mt-12 mb-6"
            >
              {/* Tagline - Bottom Left */}
              <div className="flex flex-col gap-1">
                <span
                  className="text-base md:text-lg italic"
                  style={{ fontFamily: 'var(--font-handwritten), cursive' }}
                >
                  {t('home.heroTagline')}
                </span>
                <span className="text-xs">{t('footer.location')}</span>
              </div>

              {/* Social Links - Bottom Right */}
              <div className="flex items-center gap-4 md:gap-6">
                <a
                  href="https://instagram.com/savagemovie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-wide hover:text-black transition-colors"
                >
                  {t('footer.instagram')}
                </a>
                <a
                  href="https://behance.net/savagemovie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs uppercase tracking-wide hover:text-black transition-colors"
                >
                  {t('footer.behance')}
                </a>
                <span className="font-mono text-xs">© 2026</span>
              </div>
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
