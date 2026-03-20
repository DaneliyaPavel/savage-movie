/**
 * Projects footer with curtain reveal (Freshman.tv style):
 * Footer is fixed at bottom. Page content (projects list) acts as the curtain —
 * when you scroll past the end of the list, that content reveals the footer underneath.
 * No extra curtain block; parent must wrap content in a layer with z-index above footer and pb-[100vh].
 */
'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

export function ProjectsJalousieFooter() {
  const { language } = useI18n()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed) {
      setError(language === 'ru' ? 'Введите email' : 'Please enter an email')
      return
    }
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    if (!isValid) {
      setError(language === 'ru' ? 'Некорректный email' : 'Invalid email address')
      return
    }
    // TODO: подключить реальный API рассылки
    console.log('Subscribe:', trimmed)
    setEmail('')
  }

  return (
    <footer className="fixed inset-x-0 bottom-0 z-10 min-h-screen bg-[#ff2936] flex flex-col overflow-hidden">
        <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 text-background">
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
          <p className="text-background/80 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 tracking-wide font-secondary">
            {language === 'ru' ? 'Креативная продакшн-студия' : 'Creative Production Company'}
          </p>

          {/* Large Logo */}
          <div className="relative mb-8">
            <h2 className="text-[15vw] md:text-[12vw] font-brand text-background leading-none tracking-tight">
              savage movie
            </h2>
            <span className="absolute -top-2 -right-4 md:-right-8 text-background text-xl md:text-2xl">
              ®
            </span>
          </div>

          {/* Newsletter text */}
          <p className="text-background/80 text-center max-w-xl mb-4 sm:mb-6 text-sm sm:text-base md:text-lg leading-relaxed font-secondary px-2">
            {language === 'ru'
              ? 'Будьте в курсе. Узнавайте первыми о наших новых работах, обновлениях и всём интересном, что происходит в Savage Movie. Подпишитесь на рассылку.'
              : "Keep in the loop. Be the first to know about our latest work, exciting updates, and everything else that's happening at Savage Movie. Subscribe to our newsletter."}
          </p>

          {/* Email input - handwritten style */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-4 border-b border-background/40 pb-2 w-full max-w-xs"
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={language === 'ru' ? 'ваш email' : 'your email'}
              className="bg-transparent text-background placeholder:text-background/50 outline-none flex-1 text-base"
              style={{ fontFamily: 'var(--font-handwritten), cursive' }}
            />
            <button
              type="submit"
              className="text-background hover:translate-x-1 transition-transform"
              aria-label="Submit email"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-background/80 font-secondary">{error}</p>}
        </div>

        <div className="px-4 sm:px-6 md:px-10 pb-4 sm:pb-6 pt-4 text-background shrink-0">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-xs sm:text-sm md:text-base">
            {/* Socials */}
            <div className="flex items-center justify-between md:justify-start md:flex-col md:items-start gap-2">
              <span
                className="text-[10px] sm:text-xs md:text-sm text-background/70 uppercase tracking-[0.25em]"
                style={{ fontFamily: 'var(--font-handwritten), cursive' }}
              >
                {language === 'ru' ? '(соцсети)' : '(socials)'}
              </span>
              <div className="flex items-center gap-3 sm:gap-4 uppercase tracking-[0.25em]">
                <a href="https://www.instagram.com/mari.seven/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                  IG
                </a>
                <a href="https://vk.ru/mari_seven" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                  VK
                </a>
                <a href="https://t.me/mariseven" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                  TG
                </a>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center font-secondary order-last md:order-none">
              <span className="uppercase tracking-[0.15em] sm:tracking-[0.25em] font-secondary text-[10px] sm:text-xs md:text-base">
                {new Date().getFullYear()}© {language === 'ru' ? 'Видим смысл' : 'See the meaning'}
              </span>
            </div>

            {/* Legal links */}
            <div className="flex items-center gap-3 sm:gap-4 uppercase tracking-[0.15em] sm:tracking-[0.25em] font-secondary">
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
        </div>
      </footer>
  )
}
