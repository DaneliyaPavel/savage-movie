"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useMenu } from "./menu-context"
import { useState } from "react"
import { useI18n } from "@/lib/i18n-context"

export function JalousieMenu() {
  const { isOpen, setIsOpen } = useMenu()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { language, setLanguage, t } = useI18n()

  const NAV_ITEMS = [
    { labelKey: "nav.home", href: "/", offset: 0 },
    { labelKey: "nav.projects", href: "/projects", offset: 60 },
    { labelKey: "nav.studio", href: "/studio", offset: 20 },
    { labelKey: "nav.courses", href: "/courses", offset: 80 },
    { labelKey: "nav.contact", href: "/contact", offset: 40 },
  ]

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
          <nav className="h-full flex flex-col justify-center px-6 md:px-10 lg:px-20">
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
                className="relative border-t border-border first:border-t-0"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="relative block py-6 md:py-8 lg:py-10 group"
                  style={{ paddingLeft: item.offset }}
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

                  <span className="relative text-5xl md:text-7xl lg:text-8xl font-light tracking-tight">
                    {t(item.labelKey)}
                  </span>

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
