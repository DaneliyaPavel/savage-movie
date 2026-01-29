'use client'

import type React from 'react'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { SvgMark } from '@/components/ui/svg-mark'
import { HoverNote } from '@/components/ui/hover-note'
import { useI18n } from '@/lib/i18n-context'

export default function ContactPage() {
  const [budget, setBudget] = useState(50000)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })

  const { language, t } = useI18n()

  const budgetRef = useRef(null)
  const isBudgetInView = useInView(budgetRef, { once: true })

  const PROJECT_TYPES = [
    { key: 'commercial', labelRu: 'Коммерция', labelEn: 'Commercial' },
    { key: 'musicVideo', labelRu: 'Клип', labelEn: 'Music Video' },
    { key: 'documentary', labelRu: 'Документалка', labelEn: 'Documentary' },
    { key: 'brandFilm', labelRu: 'Бренд-фильм', labelEn: 'Brand Film' },
    { key: 'ai', labelRu: 'AI-проект', labelEn: 'AI Project' },
    { key: 'course', labelRu: 'Обучение', labelEn: 'Course' },
    { key: 'other', labelRu: 'Другое', labelEn: 'Other' },
  ]

  const budgetConfig =
    language === 'ru'
      ? {
          min: 10000,
          max: 500000,
          step: 5000,
          defaultValue: 50000,
          minLabel: '10К ₽',
          maxLabel: '500К+ ₽',
        }
      : {
          min: 1000,
          max: 50000,
          step: 1000,
          defaultValue: 5000,
          minLabel: '$1K',
          maxLabel: '$50K+',
        }

  useEffect(() => {
    setBudget(prev =>
      prev < budgetConfig.min || prev > budgetConfig.max ? budgetConfig.defaultValue : prev
    )
  }, [budgetConfig.min, budgetConfig.max, budgetConfig.defaultValue])

  const formatBudget = (value: number) => {
    if (value >= 1000000) {
      return language === 'ru'
        ? `${(value / 1000000).toFixed(1)}М+ ₽`
        : `$${(value / 1000000).toFixed(1)}M+`
    }
    return language === 'ru' ? `${(value / 1000).toFixed(0)}К ₽` : `$${(value / 1000).toFixed(0)}K`
  }

  const SOCIAL_LINKS = [
    { name: 'Instagram', url: 'https://www.instagram.com/mari.seven/' },
    { name: 'Vimeo', url: '' },
    { name: 'Telegram', url: 'https://t.me/mariseven' },
  ].filter(social => Boolean(social.url))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log({ ...formData, budget, projectType: selectedType })
    // TODO: Wire to actual API
  }

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
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
            {t('contact.label')}
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-light tracking-tight leading-[0.9] flex items-start gap-4">
            {t('contact.title')}
            <SvgMark type="plus" className="text-accent mt-2" size={32} delay={0.5} />
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-xl mt-8 leading-relaxed"
        >
          {t('contact.subtitle')}
        </motion.p>
      </section>

      {/* Contact Form */}
      <section className="px-6 md:px-10 lg:px-20 pb-20">
        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label
                htmlFor="contact-name"
                className="text-xs uppercase tracking-widest text-muted-foreground mb-3 block"
              >
                {t('contact.name')}
              </label>
              <input
                id="contact-name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-transparent border-b border-border py-3 text-lg focus:outline-none focus:border-accent transition-colors"
                placeholder={t('contact.namePlaceholder')}
                required
              />
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label
                htmlFor="contact-email"
                className="text-xs uppercase tracking-widest text-muted-foreground mb-3 block"
              >
                {t('contact.email')}
              </label>
              <input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-transparent border-b border-border py-3 text-lg focus:outline-none focus:border-accent transition-colors"
                placeholder={t('contact.emailPlaceholder')}
                required
              />
            </motion.div>

            {/* Company */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="md:col-span-2"
            >
              <label
                htmlFor="contact-company"
                className="text-xs uppercase tracking-widest text-muted-foreground mb-3 block"
              >
                {t('contact.company')}
              </label>
              <input
                id="contact-company"
                type="text"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-transparent border-b border-border py-3 text-lg focus:outline-none focus:border-accent transition-colors"
                placeholder={t('contact.companyPlaceholder')}
              />
            </motion.div>
          </div>

          {/* Project Type Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16"
          >
            <label className="text-xs uppercase tracking-widest text-muted-foreground mb-6 block">
              {t('contact.projectType')}
            </label>
            <div className="flex flex-wrap gap-3">
              {PROJECT_TYPES.map(type => (
                <HoverNote key={type.key} note={t('contact.select')}>
                  <button
                    type="button"
                    onClick={() => setSelectedType(type.key)}
                    className={`px-6 py-3 border rounded-sm text-sm transition-all duration-300 ${
                      selectedType === type.key
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-foreground/50'
                    }`}
                  >
                    {language === 'ru' ? type.labelRu : type.labelEn}
                  </button>
                </HoverNote>
              ))}
            </div>
          </motion.div>

          {/* Premium Budget Slider */}
          <motion.div
            ref={budgetRef}
            initial={{ opacity: 0, y: 30 }}
            animate={isBudgetInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="mb-16 py-12 px-8 bg-secondary/30 rounded-sm relative"
          >
            {/* Handwritten note */}
            <span
              className="absolute -top-3 right-8 text-accent text-sm -rotate-3"
              style={{ fontFamily: 'var(--font-handwritten), cursive' }}
            >
              {language === 'ru' ? 'бюджет' : 'budget'}
            </span>

            <div className="flex items-center justify-between mb-8">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">
                {t('contact.budget')}
              </label>
              {/* Large numeric readout */}
              <motion.span
                key={budget}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl md:text-6xl font-light tracking-tight"
              >
                {formatBudget(budget)}
              </motion.span>
            </div>

            {/* Custom Slider */}
            <div className="relative">
              <input
                type="range"
                min={budgetConfig.min}
                max={budgetConfig.max}
                step={budgetConfig.step}
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className="premium-slider w-full"
              />
              {/* Track progress fill */}
              <div
                className="absolute left-0 top-1/2 h-0.5 bg-accent pointer-events-none -translate-y-1/2"
                style={{
                  width: `${((budget - budgetConfig.min) / (budgetConfig.max - budgetConfig.min)) * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-between mt-4 text-xs text-muted-foreground">
              <span>{budgetConfig.minLabel}</span>
              <span>{budgetConfig.maxLabel}</span>
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <label
              htmlFor="contact-message"
              className="text-xs uppercase tracking-widest text-muted-foreground mb-3 block"
            >
              {t('contact.message')}
            </label>
            <textarea
              id="contact-message"
              value={formData.message}
              onChange={e => setFormData({ ...formData, message: e.target.value })}
              className="w-full bg-transparent border border-border rounded-sm p-4 text-lg focus:outline-none focus:border-accent transition-colors resize-none min-h-[200px]"
              placeholder={t('contact.messagePlaceholder')}
              required
            />
          </motion.div>

          {/* Submit Button */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <HoverNote note={t('contact.sendIt')}>
              <button
                type="submit"
                className="group relative inline-flex items-center gap-4 px-10 py-5 bg-foreground text-background font-medium text-lg rounded-sm overflow-hidden transition-transform hover:scale-[1.02]"
              >
                <span className="relative z-10">{t('contact.submit')}</span>
                <motion.svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="relative z-10"
                  whileHover={{ x: 5 }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </motion.svg>
                <div className="absolute inset-0 bg-accent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            </HoverNote>
          </motion.div>
        </form>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-20 pt-20 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-12"
        >
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              {t('contact.emailLabel')}
            </h3>
            <a
              href="mailto:hello@savagemovie.ru"
              className="text-lg hover:text-accent transition-colors"
            >
              hello@savagemovie.ru
            </a>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              {t('contact.location')}
            </h3>
            <p className="text-lg">{language === 'ru' ? 'Москва, Россия' : 'Moscow, Russia'}</p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              {t('contact.social')}
            </h3>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map(social => (
                <a
                  key={social.name}
                  href={social.url}
                  className="text-lg hover:text-accent transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.name}
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

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
