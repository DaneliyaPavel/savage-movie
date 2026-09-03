'use client'

import type React from 'react'
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import { SvgMark } from '@/components/ui/svg-mark'
import { HoverNote } from '@/components/ui/hover-note'
import { useI18n } from '@/lib/i18n-context'

function AnimatedSection({
  children,
  className = '',
  noDelay = false,
}: {
  children: React.ReactNode
  className?: string
  noDelay?: boolean
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: noDelay ? '0px' : '-100px' })

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

const SERVICES = [
  {
    id: 'reklama',
    numberLabel: '01',
    titleRu: 'Съёмка рекламных роликов',
    titleEn: 'Commercial Video Production',
    descriptionRu:
      'Создаём рекламные ролики, которые продают и запоминаются. Полный цикл: от креативной концепции и сценария до съёмки, постпродакшна и адаптации под все площадки. Работаем с федеральными брендами и стартапами.',
    descriptionEn:
      'We create commercials that sell and stick. Full cycle: from creative concept and script to shooting, post-production, and platform adaptation. Working with federal brands and startups.',
    ctaRu: 'Обсудить ролик',
    ctaEn: 'Discuss a commercial',
    // У рекламных роликов есть своя коммерческая страница с кейсами,
    // бюджетом и формой сметы — вести отсюда в общий /contact значит
    // терять самый горячий сегмент
    href: '/reklamny-rolik',
  },
  {
    id: 'clips',
    numberLabel: '02',
    titleRu: 'Музыкальные клипы',
    titleEn: 'Music Videos',
    descriptionRu:
      'Режиссура и продакшн клипов для артистов любого масштаба. Кинематографичная картинка, нестандартные концепции, работа с хореографией и спецэффектами. Каждый клип — мини-фильм с характером.',
    descriptionEn:
      'Music video direction and production for artists of any scale. Cinematic visuals, unconventional concepts, choreography and VFX. Every clip is a short film with character.',
    ctaRu: 'Снять клип',
    ctaEn: 'Make a music video',
  },
  {
    id: 'image',
    numberLabel: '03',
    titleRu: 'Имиджевое видео',
    titleEn: 'Brand Films',
    descriptionRu:
      'Бренд-фильмы и имиджевые ролики, раскрывающие ДНК компании. Эмоциональный сторителлинг, который формирует доверие к бренду. Для корпоративных сайтов, презентаций и социальных сетей.',
    descriptionEn:
      'Brand films and image videos that reveal company DNA. Emotional storytelling that builds brand trust. For corporate websites, presentations, and social media.',
    ctaRu: 'Заказать фильм',
    ctaEn: 'Order a film',
  },
  {
    id: 'ai-video',
    numberLabel: '04',
    titleRu: 'AI-генерация видео',
    titleEn: 'AI Video Generation',
    descriptionRu:
      'Создаём видеоконтент с помощью нейросетей нового поколения — Sora, Runway, Kling. Рекламные ролики, визуальные концепты и контент для соцсетей без традиционной съёмки. Быстрее, дешевле, без ограничений физического мира.',
    descriptionEn:
      'We create video content using next-gen neural networks — Sora, Runway, Kling. Commercials, visual concepts, and social media content without traditional filming. Faster, cheaper, no physical world limitations.',
    ctaRu: 'Обсудить AI-проект',
    ctaEn: 'Discuss an AI project',
  },
  {
    id: 'social',
    numberLabel: '05',
    titleRu: 'Контент для соцсетей',
    titleEn: 'Social Media Content',
    descriptionRu:
      'Видеоконтент для Instagram, Telegram, VK и TikTok: рилсы, сториз, тизеры, backstage. Пакетная съёмка на месяц вперёд. Контент, который набирает охваты и конвертирует в подписчиков.',
    descriptionEn:
      'Video content for Instagram, Telegram, VK, and TikTok: reels, stories, teasers, backstage. Batch shooting for a month ahead. Content that drives reach and converts to followers.',
    ctaRu: 'Обсудить контент',
    ctaEn: 'Discuss content',
  },
  {
    id: 'corporate',
    numberLabel: '06',
    titleRu: 'Корпоративное видео',
    titleEn: 'Corporate Video',
    descriptionRu:
      'Презентационные, обучающие и HR-видео для бизнеса. Съёмка интервью, репортажей с мероприятий, онбординг-роликов. Профессиональное качество с пониманием корпоративных процессов.',
    descriptionEn:
      'Presentation, training, and HR videos for business. Interviews, event coverage, onboarding videos. Professional quality with corporate process understanding.',
    ctaRu: 'Заказать видео',
    ctaEn: 'Order a video',
  },
]

export default function ServicesPageClient() {
  const { language } = useI18n()

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 md:px-10 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {language === 'ru' ? 'Что мы делаем' : 'What We Do'}
            </span>
            <SvgMark type="plus" className="text-accent" size={16} />
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-light tracking-tight leading-[0.9] max-w-5xl">
            {language === 'ru' ? 'Услуги' : 'Services'}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mt-12 leading-relaxed"
        >
          {language === 'ru'
            ? 'Полный цикл видеопроизводства — от идеи до публикации. Работаем из Санкт-Петербурга по всей России.'
            : 'Full-cycle video production — from concept to delivery. Based in St. Petersburg, working across Russia.'}
        </motion.p>
      </section>

      {/* Service Sections */}
      {SERVICES.map((service, index) => (
        <AnimatedSection
          key={service.id}
          className="border-t border-border"
          noDelay={index === 0}
        >
          <div
            id={service.id}
            className="scroll-mt-20 px-6 md:px-10 lg:px-20 py-20 md:py-28"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
              {/* Left: number + title */}
              <div className="lg:col-span-5">
                <span className="text-xs text-muted-foreground font-mono block mb-4">
                  {service.numberLabel}
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight leading-[1.1]">
                  {language === 'ru' ? service.titleRu : service.titleEn}
                </h2>
              </div>

              {/* Right: description + CTA */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                  {language === 'ru' ? service.descriptionRu : service.descriptionEn}
                </p>
                <div>
                  <HoverNote
                    note={language === 'ru' ? 'обсудить' : 'discuss'}
                  >
                    <Link
                      href={service.href ?? '/contact'}
                      className="inline-flex items-center gap-3 group"
                    >
                      <span className="text-sm uppercase tracking-widest border-b border-foreground/30 pb-1 group-hover:border-accent group-hover:text-accent transition-colors">
                        {language === 'ru' ? service.ctaRu : service.ctaEn}
                      </span>
                      <motion.svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-muted-foreground group-hover:text-accent transition-colors"
                        whileHover={{ x: 4 }}
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </motion.svg>
                    </Link>
                  </HoverNote>
                </div>
              </div>
            </div>

            {/* Decorative accent for every other section */}
            {index % 2 === 0 && (
              <div className="mt-12 flex justify-end">
                <SvgMark
                  type="scribble"
                  className="text-accent/20"
                  size={60}
                  delay={0.5}
                />
              </div>
            )}
          </div>
        </AnimatedSection>
      ))}

      {/* CTA Section */}
      <AnimatedSection className="px-6 md:px-10 lg:px-20 py-32 border-t border-border text-center">
        <span
          className="text-accent text-lg -rotate-2 inline-block mb-4"
          style={{ fontFamily: 'var(--font-handwritten), cursive' }}
        >
          {language === 'ru' ? 'не нашли нужное?' : "didn't find what you need?"}
        </span>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-8">
          {language === 'ru' ? 'Обсудим ваш проект' : "Let's discuss your project"}
        </h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
          {language === 'ru'
            ? 'Каждый проект уникален. Расскажите о вашей задаче — мы предложим лучшее решение.'
            : 'Every project is unique. Tell us about your task — we\'ll suggest the best solution.'}
        </p>
        <HoverNote note={language === 'ru' ? 'поговорим' : "let's talk"}>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 text-lg font-medium group"
          >
            <span className="border-b border-foreground pb-1 group-hover:border-accent group-hover:text-accent transition-colors">
              {language === 'ru' ? 'Начать проект' : 'Start a project'}
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
      </AnimatedSection>

      {/* Footer */}
      <footer className="px-6 md:px-10 lg:px-20 py-10 border-t border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <span>© 2026 Savage Movie. {language === 'ru' ? 'Все права защищены.' : 'All rights reserved.'}</span>
          <span className="font-mono">
            {language === 'ru' ? 'Санкт-Петербург / Москва / Весь мир' : 'St. Petersburg / Moscow / Worldwide'}
          </span>
        </div>
      </footer>
    </main>
  )
}
