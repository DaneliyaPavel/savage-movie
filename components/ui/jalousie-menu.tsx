'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
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
    {/* Messy strike-through */}
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

  /* Creative Asymmetry Grid - "Staircase" feel */
  const NAV_ITEMS = useMemo(
    () =>
      [
        {
          labelKey: 'nav.home',
          href: '/',
          positionClass: 'col-span-12 md:col-start-1 md:col-span-5', // Left
          countKey: null as CountKey,
        },
        {
          labelKey: 'nav.projects',
          href: '/projects',
          positionClass: 'col-span-12 md:col-start-4 md:col-span-6', // Indented
          countKey: 'projects' as CountKey,
        },
        {
          labelKey: 'nav.courses',
          href: '/courses',
          positionClass: 'col-span-12 md:col-start-2 md:col-span-6', // Back left a bit
          countKey: 'courses' as CountKey,
        },
        {
          labelKey: 'nav.studio',
          href: '/about',
          positionClass: 'col-span-12 md:col-start-6 md:col-span-5', // Far right
          countKey: null as CountKey,
        },
        {
          labelKey: 'nav.blog',
          href: '/blog',
          positionClass: 'col-span-12 md:col-start-3 md:col-span-5', // Middle
          countKey: 'blog' as CountKey,
        },
        {
          labelKey: 'nav.contact',
          href: '/contact',
          positionClass: 'col-span-12 md:col-start-5 md:col-span-6', // Middle-Right
          countKey: null as CountKey,
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
    if (count === null) return '(…)'
    return `(${count})`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.2 } }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Language Toggle - Top Left */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.3 }}
            onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
            className="absolute top-6 left-6 md:left-10 w-12 h-12 rounded-full border border-border flex items-center justify-center text-sm font-medium hover:bg-secondary transition-colors uppercase"
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
            className="absolute top-6 right-6 md:right-10 flex items-center gap-3 text-foreground group"
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

          {/* Menu Items - Creative Layout */}
          <nav
            className="h-full flex flex-col justify-center px-6 md:px-10 lg:px-14 xl:px-20 pt-24 pb-20
            [@media(max-height:820px)]:justify-start [@media(max-height:820px)]:pt-20 [@media(max-height:820px)]:pb-16"
          >
            {NAV_ITEMS.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 50, skewY: 2 }}
                animate={{ opacity: 1, y: 0, skewY: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                  delay: 0.1 + index * 0.06,
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="relative border-t border-dashed border-border/70 first:border-t-0"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="relative block py-4 sm:py-5 md:py-6 lg:py-8 xl:py-10 group overflow-hidden"
                >
                  {/* Hover Black Bar Background */}
                  <motion.div
                    className="absolute inset-0 bg-black z-0"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: hoveredIndex === index ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    style={{ originX: 0 }}
                  />

                  {/* Content Container */}
                  <div className="relative z-10 grid grid-cols-12 pointer-events-none">
                    <div className={`relative ${item.positionClass} flex items-center`}>

                      {/* Text with Scribble Overlay */}
                      <div className="relative inline-block">
                        <span
                          className={cn(
                            "relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight uppercase leading-[0.95] transition-colors duration-300 font-brand",
                            hoveredIndex === index ? "text-white italic" : "text-foreground"
                          )}
                        >
                          {t(item.labelKey)}
                        </span>

                        {/* Scribble on Hover */}
                        <AnimatePresence>
                          {hoveredIndex === index && <ScribbleStrike />}
                        </AnimatePresence>
                      </div>

                      {/* Count */}
                      {item.countKey ? (
                        <span
                          className={cn(
                            "ml-3 relative -top-4 text-xs sm:text-sm md:text-base transition-colors duration-300",
                            hoveredIndex === index ? "text-white/60" : "text-muted-foreground"
                          )}
                          style={{ fontFamily: 'var(--font-handwritten), cursive' }}
                        >
                          {formatCount(getCountForKey(item.countKey))}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Bottom Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-6 left-6 md:left-10 right-6 md:right-10 flex justify-between items-end text-sm text-muted-foreground"
          >
            <span>{t('footer.location')}</span>
            <span className="font-mono">© 2026</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
