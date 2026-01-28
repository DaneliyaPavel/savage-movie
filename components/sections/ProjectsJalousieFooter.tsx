/**
 * Projects footer with jalousie reveal (pre-footer slides out, footer slides in).
 */
'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

export function ProjectsJalousieFooter() {
  const { language } = useI18n()
  const [email, setEmail] = useState('')
  const ref = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
  })

  const contentY = useTransform(scrollYProgress, [0, 1], ['12%', '0%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const footerRowY = useTransform(scrollYProgress, [0, 1], ['30%', '0%'])
  const footerRowOpacity = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section ref={ref} className="relative h-screen bg-[#ff2936]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 py-12 text-background"
        >
          {/* Hashtag icon */}
          <div className="mb-6">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-background">
              <path
                d="M14 8L10 32M30 8L26 32M8 14H32M8 26H32"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Subtitle */}
          <p className="text-background/80 text-base md:text-lg mb-8 tracking-wide font-secondary">
            {language === 'ru' ? 'Креативная продакшн-студия' : 'Creative Production Company'}
          </p>

          {/* Large Logo */}
          <div className="relative mb-8">
            <h2 className="text-[15vw] md:text-[12vw] font-brand text-background leading-none tracking-tight">
              savage movie
            </h2>
            <span className="absolute -top-2 -right-4 md:-right-8 text-background text-xl md:text-2xl">®</span>
          </div>

          {/* Newsletter text */}
          <p className="text-background/80 text-center max-w-xl mb-6 text-base md:text-lg leading-relaxed font-secondary">
            {language === 'ru'
              ? 'Будьте в курсе. Узнавайте первыми о наших новых работах, обновлениях и всём интересном, что происходит в Savage Movie. Подпишитесь на рассылку.'
              : "Keep in the loop. Be the first to know about our latest work, exciting updates, and everything else that's happening at Savage Movie. Subscribe to our newsletter."}
          </p>

          {/* Email input - handwritten style */}
          <div className="flex items-center gap-4 border-b border-background/40 pb-2 w-full max-w-xs">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'ru' ? 'ваш email' : 'your email'}
              className="bg-transparent text-background placeholder:text-background/50 outline-none flex-1 text-base"
              style={{ fontFamily: 'var(--font-handwritten), cursive' }}
            />
            <button className="text-background hover:translate-x-1 transition-transform" aria-label="Submit email">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        <motion.div
          style={{ y: footerRowY, opacity: footerRowOpacity }}
          className="absolute inset-x-0 bottom-0 px-6 md:px-10 pb-6 pt-4 text-background"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-sm md:text-base">
            <div className="flex flex-col gap-2 uppercase tracking-[0.25em]">
              <span className="text-xs md:text-sm text-background/70" style={{ fontFamily: 'var(--font-handwritten), cursive' }}>
                (соцсети)
              </span>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:opacity-70 transition-opacity">
                  IG
                </a>
                <a href="#" className="hover:opacity-70 transition-opacity">
                  VK
                </a>
                <a href="#" className="hover:opacity-70 transition-opacity">
                  TG
                </a>
              </div>
            </div>

            <div className="text-center font-secondary">
              <span className="uppercase tracking-[0.25em] font-secondary">
                {new Date().getFullYear()}© {language === 'ru' ? 'Видим смысл' : 'See the meaning'}
              </span>
            </div>

            <div className="flex items-center gap-4 uppercase tracking-[0.25em] text-sm md:text-base font-secondary">
              <a href="/privacy" className="hover:text-background transition-colors">
                {language === 'ru' ? 'Политика' : 'Privacy'}
              </a>
              <a href="/terms" className="hover:text-background transition-colors">
                {language === 'ru' ? 'Условия' : 'Terms'}
              </a>
              <a href="/cookies" className="hover:text-background transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
