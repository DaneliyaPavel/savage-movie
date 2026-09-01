/**
 * Projects footer with curtain reveal (Freshman.tv style):
 * Footer is fixed at bottom. Page content (projects list) acts as the curtain —
 * when you scroll past the end of the list, that content reveals the footer underneath.
 * No extra curtain block; parent must wrap content in a layer with z-index above footer and pb-[100vh].
 */
'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

/** already — адрес уже в списке: это не ошибка, но и не повод благодарить дважды */
type SubscribeStatus = 'idle' | 'loading' | 'success' | 'already'

export function ProjectsJalousieFooter() {
  const { language } = useI18n()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<SubscribeStatus>('idle')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'loading') return
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
    if (!consent) {
      setError(
        language === 'ru'
          ? 'Нужно согласие на обработку персональных данных'
          : 'Please accept the personal data processing consent'
      )
      return
    }

    setStatus('loading')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'projects-footer', language }),
      })

      const data: { alreadySubscribed?: boolean; error?: string } = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setStatus(data.alreadySubscribed ? 'already' : 'success')
      setEmail('')
      setConsent(false)
    } catch {
      setStatus('idle')
      setError(
        language === 'ru'
          ? 'Не удалось оформить подписку. Попробуйте позже'
          : 'Subscription failed. Please try again later'
      )
    }
  }

  const isSubscribed = status === 'success' || status === 'already'

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
          <div className="mb-8">
            <h2 className="text-[15vw] md:text-[12vw] font-brand text-background leading-none tracking-tight text-center">
              savage movie
            </h2>
          </div>

          {/* Newsletter text */}
          <p className="text-background/80 text-center max-w-xl mb-4 sm:mb-6 text-sm sm:text-base md:text-lg leading-relaxed font-secondary px-2">
            {language === 'ru'
              ? 'Будьте в курсе. Узнавайте первыми о наших новых работах, обновлениях и всём интересном, что происходит в Savage Movie. Подпишитесь на рассылку.'
              : "Keep in the loop. Be the first to know about our latest work, exciting updates, and everything else that's happening at Savage Movie. Subscribe to our newsletter."}
          </p>

          {/* Email input - handwritten style */}
          {isSubscribed ? (
            <p
              className="text-background text-base sm:text-lg text-center max-w-sm font-secondary"
              role="status"
            >
              {status === 'already'
                ? language === 'ru'
                  ? 'Вы уже подписаны — спасибо, что вы с нами.'
                  : "You're already subscribed — thanks for staying with us."
                : language === 'ru'
                  ? 'Готово! Проверьте почту — новости будут приходить туда.'
                  : "You're in! We'll send the news to your inbox."}
            </p>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-4 border-b border-background/40 pb-2 w-full max-w-xs"
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  placeholder={language === 'ru' ? 'ваш email' : 'your email'}
                  className="bg-transparent text-background placeholder:text-background/50 outline-none flex-1 text-base disabled:opacity-60"
                  style={{ fontFamily: 'var(--font-handwritten), cursive' }}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="text-background hover:translate-x-1 transition-transform disabled:hover:translate-x-0 disabled:opacity-60"
                  aria-label={language === 'ru' ? 'Подписаться' : 'Subscribe'}
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              </form>

              {/* Согласие на обработку ПД — обязательно для сбора email (152-ФЗ) */}
              <label className="mt-3 flex max-w-sm cursor-pointer items-start gap-2 text-left text-[11px] leading-relaxed text-background/80 font-secondary sm:text-xs">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => {
                    setConsent(e.target.checked)
                    if (e.target.checked) setError('')
                  }}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-background"
                />
                <span>
                  {language === 'ru' ? 'Даю ' : 'I give my '}
                  <Link href="/consent" className="underline hover:text-background">
                    {language === 'ru'
                      ? 'согласие на обработку персональных данных'
                      : 'consent to personal data processing'}
                  </Link>
                  {language === 'ru' ? ' в соответствии с ' : ' in accordance with the '}
                  <Link href="/privacy" className="underline hover:text-background">
                    {language === 'ru' ? 'Политикой обработки ПД' : 'Privacy Policy'}
                  </Link>
                </span>
              </label>
            </>
          )}
          {error && (
            <p className="mt-3 text-sm text-background/80 font-secondary" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="px-4 sm:px-6 md:px-10 pb-4 sm:pb-6 pt-4 text-background shrink-0">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between text-xs sm:text-sm md:text-base">
            {/* Socials */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <span
                className="text-[10px] sm:text-xs md:text-sm text-background/70 uppercase tracking-[0.25em]"
                style={{ fontFamily: 'var(--font-handwritten), cursive' }}
              >
                {language === 'ru' ? '(соцсети)' : '(socials)'}
              </span>
              <div className="flex items-center gap-4 sm:gap-5 uppercase tracking-[0.25em]">
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

            {/* Contact */}
            <div className="flex flex-col items-center md:items-start gap-2 order-2 md:order-none">
              <span
                className="text-[10px] sm:text-xs md:text-sm text-background/70 uppercase tracking-[0.25em]"
                style={{ fontFamily: 'var(--font-handwritten), cursive' }}
              >
                {language === 'ru' ? '(контакт)' : '(contact)'}
              </span>
              <a
                href="mailto:hello@savagemovie.ru"
                className="uppercase tracking-[0.15em] sm:tracking-[0.25em] text-xs sm:text-sm md:text-base hover:opacity-70 transition-opacity"
              >
                hello@savagemovie.ru
              </a>
            </div>

            {/* Copyright */}
            <div className="text-center font-secondary order-last">
              <span className="uppercase tracking-[0.15em] sm:tracking-[0.25em] font-secondary text-[10px] sm:text-xs md:text-base">
                {new Date().getFullYear()}© {language === 'ru' ? 'Видим смысл' : 'See the meaning'}
              </span>
            </div>
          </div>
        </div>
      </footer>
  )
}
