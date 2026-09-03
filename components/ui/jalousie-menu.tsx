'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useMenu } from './menu-context'
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/lib/i18n-context'
import { getProjects } from '@/features/projects/api'
import { getBlogPosts } from '@/lib/api/blog'
import { cn } from '@/lib/utils'

// Ещё в 2× крупнее — viewBox 25×12.5
const SCRIBBLE_PATHS = [
  'M1,6.25 C5.5,2.25 12,6.5 17.5,3.5 C22,6.25 24,5.25 25,6',
  'M2,6 C7,1.5 13.75,6 12.5,9.75 C11,12.25 5.25,9.5 4.5,6.5 C6.5,3.5 12,7 10.75,10 C9.5,12 4.75,9.75 3.5,7',
  'M3,6.5 C8.5,2.75 14.5,6.5 13.25,9.75 C12,12.25 7,10.25 6,7.25 C8.25,4.5 13.5,7.75 12.25,10.25 C11,12.25 6,10.75 4.75,7.75',
  'M1.5,7 C6.5,3.5 12.25,7 11.5,9.75 C10.75,12 6.5,10.25 7.25,7.75 C9,5.25 14.75,8.25 13.5,10.25 C12.25,12 7,11 7.75,8.5 C9.75,6 15.75,8.75 14.5,6.5',
  'M2.25,6.25 C7.25,3 13.25,6.5 12.25,9.5 C11.25,11.5 7,9.75 6.5,7 C8.5,4.5 14,7.25 12.75,9.75 C11.5,12 6.5,10.25 6,7.25 M14.75,6 C18.5,2.75 23.5,6.25 22.25,9 C21,11 16.5,9 15.75,6.5',
  'M1.25,6.5 C7,2.5 13.25,6.5 12.25,9.75 C11.25,12 6.5,10.25 7,7.75 C9,5 14.75,8.25 13.5,10.75 C12.25,12.25 7.25,11 7.75,8.5 C9.75,5.75 15.25,8.5 14,11 C12.75,12.25 8.25,11.25 7.25,9',
]

function ScribbleStrike({ variant = 0 }: { variant?: number }) {
  const path = SCRIBBLE_PATHS[variant % SCRIBBLE_PATHS.length]
  return (
    <svg
      viewBox="0 0 25 12.5"
      className="w-full h-full absolute top-1/2 left-0 -translate-y-1/2 pointer-events-none overflow-visible"
    >
      <motion.path
        d={path}
        fill="none"
        stroke="#e11b1b"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: 1,
          opacity: 0.9,
          transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] },
        }}
        exit={{
          pathLength: 1,
          opacity: 0,
          transition: { duration: 0.24, ease: [0.4, 0, 1, 1] },
        }}
      />
    </svg>
  )
}

export function JalousieMenu() {
  const { isOpen, setIsOpen } = useMenu()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { language, setLanguage, t } = useI18n()

  const [projectsCount, setProjectsCount] = useState<number | null>(null)
  const [blogCount, setBlogCount] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return

    let cancelled = false
    async function loadCounts() {
      try {
        const [projects, blogPosts] = await Promise.allSettled([getProjects(), getBlogPosts(true)])
        if (cancelled) return
        setProjectsCount(projects.status === 'fulfilled' ? projects.value.length : null)
        setBlogCount(blogPosts.status === 'fulfilled' ? blogPosts.value.length : null)
      } catch {
        if (cancelled) return
        // keep nulls; counts are optional UI sugar
        setProjectsCount(null)
        setBlogCount(null)
      }
    }

    loadCounts()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  type CountKey = 'projects' | 'blog' | null

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
          labelKey: 'nav.services',
          href: '/services',
          countKey: null as CountKey,
          position: 'full' as const,
        },
        {
          // Коммерческая посадочная: внутренняя ссылка с каждой страницы,
          // включая главную, — меню единственное место, где это не ломает вёрстку.
          // Занимает позицию, ранее принадлежавшую «Обучению» (пункт убран из меню)
          labelKey: 'nav.commercial',
          href: '/reklamny-rolik',
          countKey: null as CountKey,
          position: 'left' as const,
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
        {
          labelKey: 'nav.booking',
          href: '/booking',
          countKey: null as CountKey,
          position: 'right' as const,
        },
      ] as const,
    []
  )

  const getCountForKey = (key: CountKey): number | null => {
    if (!key) return null
    if (key === 'blog') return blogCount
    if (key === 'projects') return projectsCount
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
          className="fixed inset-0 z-50 h-dvh max-h-dvh w-full bg-[#a4a49c] overflow-hidden flex flex-col"
        >
          {/* Top bar: logo, language, close */}
          <div className="flex-shrink-0 relative flex items-center justify-between px-6 md:px-10 py-4 md:py-5">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: 0.3 }}
              onClick={() => setLanguage(language === 'ru' ? 'en' : 'ru')}
              className="w-12 h-12 rounded-full border border-black/20 flex items-center justify-center text-sm font-medium hover:bg-black/5 transition-colors uppercase text-black/80"
              aria-label={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            >
              {language}
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Link href="/" onClick={() => setIsOpen(false)} className="block">
                <Image
                  src="/sm-logo.svg"
                  alt="SAVAGE MOVIE"
                  width={180}
                  height={60}
                  className="w-28 md:w-36 h-auto opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                />
              </Link>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-black/80 group"
              aria-label="Close menu"
            >
              <span className="text-sm font-medium tracking-wide uppercase opacity-60 group-hover:opacity-100 transition-opacity">
                {t('nav.close')}
              </span>
              <motion.div className="w-8 h-8 flex items-center justify-center" whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
              </motion.div>
            </motion.button>
          </div>

          {/* Menu items — по высоте экрана без прокрутки, минимальные зазоры до пунктира */}
          <nav className="flex-1 min-h-0 flex flex-col relative z-40">
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
                  transition={{ delay: 0.2 + index * 0.08, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                  className="relative flex-1 min-h-0 flex flex-col justify-center"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Пунктирная линия — мелкий чёткий пунктир */}
                  <div
                    className="flex-shrink-0 w-full h-px"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(to right, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 5px, transparent 5px, transparent 10px)',
                    }}
                  />

                  {/* Hover Background — заполнение снизу вверх */}
                  <motion.div
                    className="absolute inset-0 bg-black z-0 pointer-events-none"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: hoveredIndex === index ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                    style={{ transformOrigin: 'bottom' }}
                  />

                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="relative flex-1 min-h-0 flex items-center py-1 md:py-2 group z-10 w-full"
                  >
                    <div
                      className={cn(
                        'relative flex items-center gap-3 md:gap-4 w-full px-6 md:px-10',
                        isLeft ? 'justify-start' : isRight ? 'justify-end' : isCenter || isFull ? 'justify-center' : 'justify-start'
                      )}
                    >
                      <div className="relative inline-block">
                        <span
                          className={cn(
                            'relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light tracking-tight uppercase leading-[0.85] transition-colors duration-300',
                            hoveredIndex === index ? 'text-white' : 'text-black/85'
                          )}
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {t(item.labelKey)}
                        </span>
                        <AnimatePresence>
                          {hoveredIndex === index && <ScribbleStrike key={index} variant={index} />}
                        </AnimatePresence>
                      </div>
                      {item.countKey && formatCount(getCountForKey(item.countKey)) && (
                        <span
                          className={cn(
                            'relative text-sm md:text-base lg:text-lg transition-colors duration-300',
                            hoveredIndex === index ? 'text-white/60' : 'text-black/40'
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
          </nav>

          {/* Footer: слева соцсети, по центру внизу 2026 + слоган, справа юридические ссылки */}
          <div className="relative flex-shrink-0 flex justify-between items-end px-6 md:px-10 pb-3 md:pb-4 pt-1 gap-4">
            <div className="flex flex-col gap-0.5 text-xs md:text-sm font-mono uppercase tracking-wider">
              <a
                href="https://t.me/mariseven"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/50 hover:text-black transition-colors"
              >
                Telegram
              </a>
              <a
                href="https://www.instagram.com/mari.seven/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/50 hover:text-black transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://vk.ru/mari_seven"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/50 hover:text-black transition-colors"
              >
                VK
              </a>
            </div>
            <div className="flex flex-col gap-0.5 text-xs md:text-sm font-mono uppercase tracking-wider text-right">
              <a href="/privacy" className="text-black/50 hover:text-black transition-colors">
                Политика (конфиденциальности)
              </a>
              <a href="/terms" className="text-black/50 hover:text-black transition-colors">
                Условия
              </a>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-3 md:bottom-4 text-sm text-black/50 font-mono text-center pointer-events-none"
            >
              2026© {t('home.heroTagline')}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
