"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { TopBar } from "@/components/ui/top-bar"
import { JalousieMenu } from "@/components/ui/jalousie-menu"
import { SvgMark } from "@/components/ui/svg-mark"
import { HoverNote } from "@/components/ui/hover-note"
import { useI18n } from "@/lib/i18n-context"

interface Course {
  id: string
  slugRu: string
  slugEn: string
  titleRu: string
  titleEn: string
  descriptionRu: string
  descriptionEn: string
  duration: number
  level: "beginner" | "intermediate" | "advanced" | "all"
  students: number
  image: string
  icon: string
  color: string
  topicsRu: string[]
  topicsEn: string[]
  forWhomRu: string[]
  forWhomEn: string[]
}

const COURSES: Course[] = [
  {
    id: "ai",
    slugRu: "ai-v-video",
    slugEn: "ai-video-production",
    titleRu: "AI в видеопроизводстве",
    titleEn: "AI in Video Production",
    descriptionRu:
      "Используйте искусственный интеллект для создания контента нового поколения. Генерация визуальных концепций, автоматизация рутины, AI-инструменты для пост-продакшна.",
    descriptionEn:
      "Use artificial intelligence to create next-generation content. Visual concept generation, workflow automation, AI tools for post-production.",
    duration: 8,
    level: "intermediate",
    students: 234,
    image: "/ai-neural-network-visualization-futuristic-digital.jpg",
    icon: "✦",
    color: "from-violet-500/20 to-fuchsia-500/20",
    topicsRu: [
      "Генерация изображений и видео с помощью AI",
      "Промпт-инжиниринг для визуального контента",
      "AI-инструменты для пост-продакшна",
      "Автоматизация рутинных задач",
      "Этика и авторские права в AI-контенте",
    ],
    topicsEn: [
      "Image and video generation with AI",
      "Prompt engineering for visual content",
      "AI tools for post-production",
      "Automating routine tasks",
      "Ethics and copyright in AI content",
    ],
    forWhomRu: ["Видеографы, желающие освоить новые технологии", "Креативные директора", "Контент-мейкеры"],
    forWhomEn: ["Videographers wanting to master new technologies", "Creative directors", "Content creators"],
  },
  {
    id: "filming",
    slugRu: "operatorskoe-masterstvo",
    slugEn: "cinematography",
    titleRu: "Операторское мастерство",
    titleEn: "Cinematography",
    descriptionRu:
      "Профессиональная съёмка от основ до продвинутых техник. Работа со светом, движение камеры, композиция кадра.",
    descriptionEn:
      "Professional filming from basics to advanced techniques. Working with light, camera movement, frame composition.",
    duration: 12,
    level: "all",
    students: 456,
    image: "/cinematic-camera-setup-film-set-professional-light.jpg",
    icon: "◎",
    color: "from-amber-500/20 to-orange-500/20",
    topicsRu: [
      "Основы экспозиции и настройки камеры",
      "Художественное освещение",
      "Движение камеры и стабилизация",
      "Композиция и построение кадра",
      "Работа с разными жанрами",
    ],
    topicsEn: [
      "Exposure basics and camera settings",
      "Artistic lighting",
      "Camera movement and stabilization",
      "Composition and framing",
      "Working with different genres",
    ],
    forWhomRu: ["Начинающие операторы", "Фотографы, переходящие в видео", "Контент-креаторы"],
    forWhomEn: ["Beginning cinematographers", "Photographers transitioning to video", "Content creators"],
  },
  {
    id: "editing",
    slugRu: "montazh",
    slugEn: "editing",
    titleRu: "Монтаж и пост-продакшн",
    titleEn: "Editing & Post-Production",
    descriptionRu:
      "Искусство монтажа, цветокоррекция, звуковой дизайн. Превращайте отснятый материал в захватывающие истории.",
    descriptionEn:
      "The art of editing, color correction, sound design. Transform raw footage into captivating stories.",
    duration: 10,
    level: "intermediate",
    students: 389,
    image: "/video-editing-timeline-color-grading-professional-.jpg",
    icon: "◈",
    color: "from-cyan-500/20 to-blue-500/20",
    topicsRu: [
      "Принципы монтажа и ритм",
      "Профессиональная цветокоррекция",
      "Звуковой дизайн и сведение",
      "VFX и motion graphics",
      "Оптимизация рабочего процесса",
    ],
    topicsEn: [
      "Editing principles and rhythm",
      "Professional color correction",
      "Sound design and mixing",
      "VFX and motion graphics",
      "Workflow optimization",
    ],
    forWhomRu: ["Видеографы", "Монтажёры", "Создатели контента для YouTube и соцсетей"],
    forWhomEn: ["Videographers", "Video editors", "YouTube and social media content creators"],
  },
  {
    id: "producing",
    slugRu: "prodyusirovanie",
    slugEn: "producing",
    titleRu: "Продюсирование",
    titleEn: "Producing",
    descriptionRu:
      "Подготовка к съёмке, ведение проекта, работа с клиентом. Всё о том, как организовать процесс от идеи до финального продукта.",
    descriptionEn:
      "Pre-production, project management, client relations. Everything about organizing the process from idea to final product.",
    duration: 6,
    level: "advanced",
    students: 178,
    image: "/film-producer-planning-production-meeting-creative.jpg",
    icon: "◆",
    color: "from-emerald-500/20 to-teal-500/20",
    topicsRu: [
      "Разработка концепции и питчинг",
      "Бюджетирование и планирование",
      "Работа с командой и подрядчиками",
      "Коммуникация с клиентом",
      "Управление проектом на всех этапах",
    ],
    topicsEn: [
      "Concept development and pitching",
      "Budgeting and planning",
      "Working with teams and contractors",
      "Client communication",
      "Project management at all stages",
    ],
    forWhomRu: [
      "Режиссёры, желающие самостоятельно вести проекты",
      "Начинающие продюсеры",
      "Владельцы продакшн-студий",
    ],
    forWhomEn: ["Directors wanting to run their own projects", "Beginning producers", "Production studio owners"],
  },
]

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

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
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)
  const { language, t } = useI18n()

  const getTitle = (c: Course) => (language === "ru" ? c.titleRu : c.titleEn)
  const getDescription = (c: Course) => (language === "ru" ? c.descriptionRu : c.descriptionEn)
  const getTopics = (c: Course) => (language === "ru" ? c.topicsRu : c.topicsEn)
  const getForWhom = (c: Course) => (language === "ru" ? c.forWhomRu : c.forWhomEn)

  const getLevelLabel = (level: string) => {
    const labels: Record<string, Record<string, string>> = {
      beginner: { ru: "Начинающий", en: "Beginner" },
      intermediate: { ru: "Средний", en: "Intermediate" },
      advanced: { ru: "Продвинутый", en: "Advanced" },
      all: { ru: "Все уровни", en: "All levels" },
    }
    return labels[level]?.[language] || level
  }

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 md:px-10 lg:px-20">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("courses.label")}</span>
            <SvgMark type="scribble" className="text-accent" size={20} delay={0.3} />
          </div>
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-light tracking-tight leading-[0.85]">
            {t("courses.title")}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mt-12 leading-relaxed"
        >
          {t("courses.subtitle")}
        </motion.p>
      </section>

      {/* Courses Grid */}
      <section className="px-6 md:px-10 lg:px-20 pb-20">
        <div className="space-y-8">
          {COURSES.map((course, index) => (
            <AnimatedSection key={course.id}>
              <motion.article
                layout
                className={`relative rounded-lg overflow-hidden border border-border bg-gradient-to-br ${course.color} transition-all duration-500`}
              >
                <div
                  className="p-6 md:p-10 cursor-pointer"
                  onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left - Number & Icon */}
                    <div className="lg:col-span-1 flex lg:flex-col items-center lg:items-start gap-4">
                      <span className="text-5xl md:text-6xl font-light text-accent/50">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-3xl">{course.icon}</span>
                    </div>

                    {/* Middle - Content */}
                    <div className="lg:col-span-7">
                      <h2 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-4 group-hover:text-accent transition-colors">
                        {getTitle(course)}
                      </h2>
                      <p className="text-muted-foreground text-lg leading-relaxed mb-6">{getDescription(course)}</p>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t("courses.duration")}</span>
                          <span className="ml-2 font-medium">
                            {course.duration} {t("courses.weeks")}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("courses.level")}</span>
                          <span className="ml-2 font-medium">{getLevelLabel(course.level)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t("courses.students")}</span>
                          <span className="ml-2 font-medium">{course.students}+</span>
                        </div>
                      </div>
                    </div>

                    {/* Right - Image */}
                    <div className="lg:col-span-4">
                      <div className="relative aspect-[4/3] rounded-sm overflow-hidden">
                        <Image
                          src={course.image || "/placeholder.svg"}
                          alt={getTitle(course)}
                          fill
                          className="object-cover transition-transform duration-700 hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expand Indicator */}
                  <div className="flex justify-center mt-6">
                    <motion.div
                      animate={{ rotate: expandedCourse === course.id ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-muted-foreground"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </motion.div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedCourse === course.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-10 pb-10 pt-0 border-t border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
                          {/* What You'll Learn */}
                          <div>
                            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
                              {t("courses.whatYouLearn")}
                            </h3>
                            <ul className="space-y-3">
                              {getTopics(course).map((topic, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex items-start gap-3"
                                >
                                  <SvgMark type="plus" className="text-accent flex-shrink-0 mt-1" size={12} />
                                  <span>{topic}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          {/* For Whom */}
                          <div>
                            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
                              {t("courses.forWhom")}
                            </h3>
                            <ul className="space-y-3">
                              {getForWhom(course).map((item, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 + 0.2 }}
                                  className="flex items-start gap-3"
                                >
                                  <SvgMark type="arrow" className="text-accent flex-shrink-0 mt-1" size={12} />
                                  <span>{item}</span>
                                </motion.li>
                              ))}
                            </ul>

                            {/* Course Details */}
                            <div className="mt-8 pt-6 border-t border-border/50 space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("courses.format")}</span>
                                <span>{t("courses.online")}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("courses.certificate")}</span>
                                <span>{t("courses.yes")}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-10 flex flex-wrap gap-4">
                          <HoverNote note={language === "ru" ? "записаться" : "enroll"}>
                            <Link
                              href="/contact"
                              className="inline-flex items-center gap-3 px-8 py-4 bg-foreground text-background font-medium rounded-sm hover:bg-accent transition-colors"
                            >
                              {t("courses.enroll")}
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </HoverNote>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <AnimatedSection className="px-6 md:px-10 lg:px-20 py-20 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="text-accent text-lg -rotate-2 inline-block mb-4"
            style={{ fontFamily: "var(--font-handwritten), cursive" }}
          >
            {language === "ru" ? "не знаете с чего начать?" : "don't know where to start?"}
          </span>
          <h2 className="text-4xl md:text-6xl font-light tracking-tight mb-6">
            {language === "ru" ? "Поможем выбрать курс" : "We'll help you choose"}
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            {language === "ru"
              ? "Свяжитесь с нами, и мы подберём программу обучения под ваши цели и уровень."
              : "Contact us and we'll select a training program based on your goals and level."}
          </p>
          <HoverNote note={language === "ru" ? "написать" : "contact"}>
            <Link href="/contact" className="inline-flex items-center gap-3 text-lg font-medium group">
              <span className="border-b border-foreground pb-1 group-hover:border-accent group-hover:text-accent transition-colors">
                {t("contact.label")}
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
          <span>© 2026 Savage. {t("footer.rights")}</span>
          <span className="font-mono">{t("footer.location")}</span>
        </div>
      </footer>
    </main>
  )
}
