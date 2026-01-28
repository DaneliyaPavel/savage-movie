"use client"

import type React from "react"

import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { TopBar } from "@/components/ui/top-bar"
import { JalousieMenu } from "@/components/ui/jalousie-menu"
import { EditorialCorrection } from "@/components/ui/editorial-correction"
import { SvgMark } from "@/components/ui/svg-mark"
import { HoverNote } from "@/components/ui/hover-note"
import { useI18n } from "@/lib/i18n-context"
import { getSettings, type JsonValue } from "@/lib/api/settings"

type PhotoCrop = {
  x: number
  y: number
  zoom: number
}

type TeamMember = {
  id: string
  name: string
  position: string
  photo_url?: string | null
  photo_crop?: PhotoCrop | null
}

const DEFAULT_CROP: PhotoCrop = { x: 50, y: 50, zoom: 1 }
const TEAM_PLACEHOLDERS = [
  "/team-placeholder-1.svg",
  "/team-placeholder-2.svg",
  "/team-placeholder-3.svg",
  "/team-placeholder-4.svg",
  "/team-placeholder-5.svg",
] as const

function hashSeed(seed: string): number {
  // Простая детерминированная hash-функция (без Math.random), чтобы "рандом" был стабильным
  let h = 5381
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i)
  }
  return h >>> 0
}

function teamPlaceholderFor(seed: string) {
  const idx = hashSeed(seed) % TEAM_PLACEHOLDERS.length
  return TEAM_PLACEHOLDERS[idx] ?? TEAM_PLACEHOLDERS[0]
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function normalizeCrop(raw: unknown): PhotoCrop | null {
  if (!isRecord(raw)) return null
  const x = typeof raw.x === "number" ? raw.x : null
  const y = typeof raw.y === "number" ? raw.y : null
  const zoom = typeof raw.zoom === "number" ? raw.zoom : null
  if (x === null || y === null || zoom === null) return null
  return { x: clamp(x, 0, 100), y: clamp(y, 0, 100), zoom: clamp(zoom, 1, 2) }
}

function normalizeTeam(raw: JsonValue | undefined): TeamMember[] {
  if (!Array.isArray(raw)) return []
  const result: TeamMember[] = []

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]
    if (!isRecord(item)) continue
    const id = typeof item.id === "string" && item.id.trim() ? item.id : `legacy-${i}`
    const name = typeof item.name === "string" ? item.name : ""
    const position = typeof item.position === "string" ? item.position : ""
    const photo_url = typeof item.photo_url === "string" ? item.photo_url : null
    const photo_crop = normalizeCrop(item.photo_crop) || DEFAULT_CROP

    if (!name.trim() && !position.trim() && !photo_url) continue
    result.push({ id, name, position, photo_url, photo_crop })
  }

  return result
}

function toImageSrc(url: string | null | undefined, seed: string) {
  if (!url) return teamPlaceholderFor(seed)
  return url.startsWith("http") ? url : url.startsWith("/") ? url : `/${url}`
}

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

export default function StudioPage() {
  const { language, t } = useI18n()

  const SERVICES = [
    {
      titleRu: "Коммерческое производство",
      titleEn: "Commercial Production",
      descriptionRu: "Полный цикл продакшна для брендов, ищущих премиальный визуальный контент.",
      descriptionEn: "Full-service production for brands seeking premium visual content.",
    },
    {
      titleRu: "Музыкальные видео",
      titleEn: "Music Videos",
      descriptionRu: "Награждённое режиссирование и производство музыкальных клипов.",
      descriptionEn: "Award-winning music video direction and production.",
    },
    {
      titleRu: "Документальное кино",
      titleEn: "Documentary",
      descriptionRu: "Захватывающий сторителлинг через документальные фильмы.",
      descriptionEn: "Compelling storytelling through documentary filmmaking.",
    },
    {
      titleRu: "AI-контент",
      titleEn: "AI Content",
      descriptionRu:
        "Инновационные проекты с использованием генеративного AI для создания визуального контента нового поколения.",
      descriptionEn: "Innovative projects using generative AI to create next-generation visual content.",
    },
  ]

  const TESTIMONIALS = [
    {
      quoteRu: "Работа с Savage Movie подняла наш бренд-фильм на уровень, о котором мы даже не мечтали.",
      quoteEn: "Working with Savage Movie elevated our brand film beyond anything we imagined.",
      authorRu: "Креативный директор",
      authorEn: "Creative Director",
      companyRu: "Люксовый бренд",
      companyEn: "Luxury Brand",
    },
    {
      quoteRu:
        "Они привносят кинематографическую чувствительность, которая редко встречается в коммерческом продакшне.",
      quoteEn: "They bring a cinematic sensibility that's rare in commercial production.",
      authorRu: "Руководитель маркетинга",
      authorEn: "Marketing Lead",
      companyRu: "Технологический стартап",
      companyEn: "Tech Startup",
    },
  ]
  const [team, setTeam] = useState<TeamMember[]>([])

  useEffect(() => {
    getSettings()
      .then((settings) => setTeam(normalizeTeam(settings.about_team)))
      .catch(() => setTeam([]))
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-10 lg:px-20">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4 block">
            {t("studio.label")}
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-light tracking-tight leading-[0.9] max-w-5xl">
            {t("studio.title.line1")}
            <br />
            <span className="text-accent">{t("studio.title.line2")}</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mt-12 leading-relaxed"
        >
          {t("studio.description")}
        </motion.p>
      </section>

      {/* Editorial Correction Moment */}
      <AnimatedSection className="px-6 md:px-10 lg:px-20 py-16">
        <EditorialCorrection
          wrong={t("studio.correction.wrong")}
          correct={t("studio.correction.right")}
          className="text-3xl md:text-5xl font-light"
        />
      </AnimatedSection>

      {/* Services Section */}
      <AnimatedSection className="px-6 md:px-10 lg:px-20 py-20 border-t border-border">
        <div className="flex items-center gap-3 mb-12">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground">{t("studio.services")}</h2>
          <SvgMark type="plus" className="text-accent" size={16} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
          {SERVICES.map((service, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group"
            >
              <div className="flex items-baseline gap-4 mb-3">
                <span className="text-xs text-muted-foreground font-mono">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="text-2xl md:text-3xl font-light group-hover:text-accent transition-colors">
                  {language === "ru" ? service.titleRu : service.titleEn}
                </h3>
              </div>
              <p className="text-muted-foreground pl-10 md:pl-12">
                {language === "ru" ? service.descriptionRu : service.descriptionEn}
              </p>
            </motion.article>
          ))}
        </div>
      </AnimatedSection>

      {/* Team Section */}
      {team.length > 0 && (
        <AnimatedSection className="px-6 md:px-10 lg:px-20 py-20 border-t border-border">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-xs uppercase tracking-widest text-muted-foreground">{t("studio.team")}</h2>
            <SvgMark type="arrow" className="text-accent" size={20} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member, index) => {
              const crop = member.photo_crop || DEFAULT_CROP
              return (
                <HoverNote key={member.id} note={t("studio.viewReel")}>
                  <motion.article
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] rounded-sm overflow-hidden mb-4">
                      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                        <Image
                          src={toImageSrc(member.photo_url, member.id)}
                          alt={member.name || "Team member"}
                          fill
                          className="object-cover grayscale group-hover:grayscale-0"
                          style={{
                            objectPosition: `${crop.x}% ${crop.y}%`,
                            transform: `scale(${crop.zoom})`,
                            transformOrigin: `${crop.x}% ${crop.y}%`,
                          }}
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-light">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.position}</p>
                  </motion.article>
                </HoverNote>
              )
            })}
          </div>
        </AnimatedSection>
      )}

      {/* Testimonials Section */}
      <AnimatedSection className="px-6 md:px-10 lg:px-20 py-20 border-t border-border">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-12">{t("studio.testimonials")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.blockquote
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="relative"
            >
              <SvgMark type="scribble" className="text-accent/30 absolute -top-4 -left-4" size={40} delay={0.3} />
              <p className="text-2xl md:text-3xl font-light leading-relaxed mb-6">
                &ldquo;{language === "ru" ? testimonial.quoteRu : testimonial.quoteEn}&rdquo;
              </p>
              <footer className="text-sm text-muted-foreground">
                <span className="text-foreground">
                  {language === "ru" ? testimonial.authorRu : testimonial.authorEn}
                </span>
                {" — "}
                {language === "ru" ? testimonial.companyRu : testimonial.companyEn}
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection className="px-6 md:px-10 lg:px-20 py-32 border-t border-border text-center">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-8">{t("studio.cta")}</h2>
        <HoverNote note={language === "ru" ? "поговорим" : "let's talk"}>
          <Link href="/contact" className="inline-flex items-center gap-3 text-lg font-medium group">
            <span className="border-b border-foreground pb-1 group-hover:border-accent group-hover:text-accent transition-colors">
              {t("studio.startProject")}
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
          <span>© 2026 Savage Movie. {t("footer.rights")}</span>
          <span className="font-mono">{t("footer.location")}</span>
    </div>
      </footer>
    </main>
  )
}
