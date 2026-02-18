'use client'

import type React from 'react'
import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { SvgMark } from '@/components/ui/svg-mark'
import { HoverNote } from '@/components/ui/hover-note'
import { useI18n } from '@/lib/i18n-context'
import { getCourses } from '@/features/courses/api'
import { toMarketingCourse, type MarketingCourse } from '@/features/courses/mappers'
import { CourseCard } from '@/features/courses/components/CourseCard'

function AnimatedSection({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<MarketingCourse[]>([])
  const [formatFilter, setFormatFilter] = useState<'all' | 'online' | 'offline'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const coursesRef = useRef<MarketingCourse[]>([])
  const lastRefetchRef = useRef(0)
  const { language, t } = useI18n()

  useEffect(() => {
    async function loadCourses({ showLoading = true }: { showLoading?: boolean } = {}) {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)
      try {
        const apiCourses = await getCourses()
        const transformed = apiCourses.map((c, index) => toMarketingCourse(c, index))
        coursesRef.current = transformed
        setCourses(transformed)
      } catch (error) {
        console.error('Failed to load courses:', error)
        if (showLoading || coursesRef.current.length === 0) {
          setError(t('courses.loadError'))
        }
      } finally {
        if (showLoading) {
          setIsLoading(false)
        }
      }
    }
    loadCourses()

    // Перезагружаем данные при возврате на страницу (например, после редактирования в админке)
    const handleFocus = () => {
      const now = Date.now()
      if (now - lastRefetchRef.current < 5000) return
      lastRefetchRef.current = now
      loadCourses({ showLoading: false })
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [t])

  const filteredCourses =
    formatFilter === 'all'
      ? courses
      : courses.filter(c => (c.format ?? '').toLowerCase() === formatFilter)

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 md:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {t('courses.label')}
            </span>
            <SvgMark type="scribble" className="text-accent" size={20} delay={0.3} />
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-light tracking-tight leading-[0.85]">
            {t('courses.title')}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mt-12 leading-relaxed"
        >
          {t('courses.subtitle')}
        </motion.p>
      </section>

      {/* Courses Grid */}
      <section className="px-6 md:px-10 lg:px-20 pb-20">
        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{t('courses.loading')}</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Формат:' : 'Format:'}
              </span>
              {(['all', 'online', 'offline'] as const).map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormatFilter(value)}
                  className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    formatFilter === value
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border bg-transparent text-muted-foreground hover:border-foreground/50 hover:text-foreground'
                  }`}
                >
                  {value === 'all'
                    ? language === 'ru'
                      ? 'Все'
                      : 'All'
                    : value === 'online'
                      ? language === 'ru'
                        ? 'Онлайн'
                        : 'Online'
                      : language === 'ru'
                        ? 'Офлайн'
                        : 'Offline'}
                </button>
              ))}
            </div>
            {filteredCourses.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  {language === 'ru' ? 'Курсы не найдены' : 'No courses found'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
                {filteredCourses.map(course => (
                  <CourseCard
                    key={course.id}
                    title={language === 'ru' ? course.titleRu : course.titleEn}
                    slug={language === 'ru' ? course.slugRu : course.slugEn}
                    shortDescription={
                      language === 'ru' ? course.shortDescriptionRu : course.shortDescriptionEn
                    }
                    format={course.format}
                    durationText={course.durationText}
                    locationText={course.locationText}
                    scheduleText={course.scheduleText}
                    tags={course.tags}
                    badgeText={course.badgeText}
                    ctaText={course.ctaText}
                    cardCover={course.cardCover}
                    coverImage={course.image}
                    coverVideoUrl={course.videoPromoUrl}
                    showPlayIcon={course.format === 'online'}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA Section */}
      <AnimatedSection className="px-6 md:px-10 lg:px-20 py-20 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="text-accent text-lg -rotate-2 inline-block mb-4"
            style={{ fontFamily: 'var(--font-handwritten), cursive' }}
          >
            {language === 'ru' ? 'не знаете с чего начать?' : "don't know where to start?"}
          </span>
          <h2 className="text-4xl md:text-6xl font-light tracking-tight mb-6">
            {language === 'ru' ? 'Поможем выбрать курс' : "We'll help you choose"}
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            {language === 'ru'
              ? 'Свяжитесь с нами, и мы подберём программу обучения под ваши цели и уровень.'
              : "Contact us and we'll select a training program based on your goals and level."}
          </p>
          <HoverNote note={language === 'ru' ? 'написать' : 'contact'}>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 text-lg font-medium group"
            >
              <span className="border-b border-foreground pb-1 group-hover:border-accent group-hover:text-accent transition-colors">
                {t('contact.label')}
              </span>
              <motion.svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                whileHover={{ x: 5 }}
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </motion.svg>
            </Link>
          </HoverNote>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="px-6 md:px-10 lg:px-20 py-10 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <span>© 2026 Savage Movie. {t('footer.rights')}</span>
          <span className="font-mono">{t('footer.location')}</span>
        </div>
      </footer>
    </main>
  )
}
