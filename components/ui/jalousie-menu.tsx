"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useMenu } from "./menu-context"
import { useEffect, useMemo, useState } from "react"
import { useI18n } from "@/lib/i18n-context"
import { getProjects } from "@/features/projects/api"
import { getCourses } from "@/features/courses/api"
import { getBlogPosts } from "@/lib/api/blog"

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
        setProjectsCount(projects.status === "fulfilled" ? projects.value.length : null)
        setCoursesCount(courses.status === "fulfilled" ? courses.value.length : null)
        setBlogCount(blogPosts.status === "fulfilled" ? blogPosts.value.length : null)
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

  type CountKey = "projects" | "courses" | "blog" | null

  const NAV_ITEMS = useMemo(
    () =>
      [
        // Order requested: Home, Projects, Courses, About, Blog, Contact
        // "Staircase" positioning (Freshman-like) via CSS grid columns
        { labelKey: "nav.home", href: "/", positionClass: "col-span-12 md:col-start-1 md:col-span-4", countKey: null as CountKey },
        {
          labelKey: "nav.projects",
          href: "/projects",
          positionClass: "col-span-12 md:col-start-3 md:col-span-6",
          countKey: "projects" as CountKey,
        },
        {
          labelKey: "nav.courses",
          href: "/courses",
          positionClass: "col-span-12 md:col-start-5 md:col-span-6",
          countKey: "courses" as CountKey,
        },
        { labelKey: "nav.studio", href: "/about", positionClass: "col-span-12 md:col-start-8 md:col-span-4", countKey: null as CountKey },
        { labelKey: "nav.blog", href: "/blog", positionClass: "col-span-12 md:col-start-2 md:col-span-5", countKey: "blog" as CountKey },
        { labelKey: "nav.contact", href: "/contact", positionClass: "col-span-12 md:col-start-6 md:col-span-6", countKey: null as CountKey },
      ] as const,
    [],
  )

  const getCountForKey = (key: CountKey): number | null => {
    if (!key) return null
    if (key === "blog") return blogCount
    if (key === "projects") return projectsCount
    if (key === "courses") return coursesCount
    return null
  }

  const formatCount = (count: number | null) => {
    if (count === null) return "(…)"
    return `(${count})`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Language Toggle - Top Left */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.3 }}
            onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
            className="absolute top-6 left-6 md:left-10 w-12 h-12 rounded-full border border-border flex items-center justify-center text-sm font-medium hover:bg-secondary transition-colors uppercase"
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
              {t("nav.close")}
            </span>
            <motion.div
              className="w-8 h-8 flex items-center justify-center"
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            </motion.div>
          </motion.button>

          {/* Menu Items - Jalousie/Blinds Style */}
          <nav
            className="h-full flex flex-col justify-center px-6 md:px-10 lg:px-14 xl:px-20 pt-24 pb-20
            [@media(max-height:820px)]:justify-start [@media(max-height:820px)]:pt-20 [@media(max-height:820px)]:pb-16"
          >
            {NAV_ITEMS.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{
                  delay: 0.1 + index * 0.08,
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
                  className="relative block py-4 sm:py-5 md:py-6 lg:py-7 xl:py-10 group
                  [@media(max-height:820px)]:py-3 [@media(max-height:820px)]:sm:py-4 [@media(max-height:820px)]:md:py-4 [@media(max-height:820px)]:lg:py-5"
                >
                  {/* Hover Background */}
                  <motion.div
                    className="absolute inset-0 bg-accent/10"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: hoveredIndex === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ originY: 0 }}
                  />

                  {/* Accent Line */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-accent"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: hoveredIndex === index ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ originY: 0 }}
                  />

                  <div className="relative grid grid-cols-12">
                    <div className={`relative ${item.positionClass}`}>
                      <div className="inline-flex items-start">
                        <span
                          className="relative text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-tight uppercase leading-[0.95]
                          [@media(max-height:820px)]:text-3xl [@media(max-height:820px)]:sm:text-4xl [@media(max-height:820px)]:md:text-5xl [@media(max-height:820px)]:lg:text-6xl"
                        >
                          {t(item.labelKey)}
                        </span>
                        {item.countKey ? (
                          <span
                            className="ml-2 sm:ml-3 relative -top-1 sm:-top-2 md:-top-3 whitespace-nowrap text-lg sm:text-xl md:text-2xl text-muted-foreground leading-none
                            [@media(max-height:820px)]:text-base [@media(max-height:820px)]:sm:text-lg [@media(max-height:820px)]:md:text-xl"
                            style={{ fontFamily: "var(--font-handwritten), cursive" }}
                          >
                            {formatCount(getCountForKey(item.countKey))}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Arrow on hover */}
                  <motion.span
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-accent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: hoveredIndex === index ? 1 : 0,
                      x: hoveredIndex === index ? 0 : -20,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </motion.span>
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
            <span>{t("footer.location")}</span>
            <span className="font-mono">© 2026</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
