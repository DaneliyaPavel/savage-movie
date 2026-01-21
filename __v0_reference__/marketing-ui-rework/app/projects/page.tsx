"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { TopBar } from "@/components/ui/top-bar"
import { JalousieMenu } from "@/components/ui/jalousie-menu"
import { useI18n } from "@/lib/i18n-context"
import { ArrowRight } from "lucide-react"

interface Project {
  id: string
  titleRu: string
  titleEn: string
  clientRu: string
  clientEn: string
  category: string
  categoryRu: string
  year: string
  thumbnails: string[]
  videoUrl: string
  descriptionRu: string
  descriptionEn: string
  isAI?: boolean
}

const PROJECTS: Project[] = [
  {
    id: "1",
    titleRu: "СЧАСТЛИВЫЕ ТУРИСТЫ",
    titleEn: "HAPPY CAMPERS",
    clientRu: "THE NORTH FACE",
    clientEn: "THE NORTH FACE",
    category: "Visual Storytelling",
    categoryRu: "Визуальный сторителлинг",
    year: "2025",
    thumbnails: [
      "/cinematic-outdoor-camping-scene-1.jpg",
      "/cinematic-outdoor-camping-scene-2.jpg",
      "/cinematic-outdoor-camping-scene-3.jpg",
      "/cinematic-outdoor-camping-scene-4.jpg",
      "/cinematic-outdoor-camping-scene-5.jpg",
    ],
    videoUrl: "https://stream.mux.com/Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM/high.mp4",
    descriptionRu:
      "Расслабленная встреча, превратившаяся в кинематографичную зарисовку. Этот короткометражный фильм для The North Face передаёт магию идеального дня на природе. Городской двор в осенних красках, день отдыха в палатках, обмен закусками, переворачивание кассет и наслаждение моментом...",
    descriptionEn:
      "A low-key hangout turned cinematic vignette, this North Face short captures the magic of a backyard day done right. Set in a city yard dressed in autumn hues, it's a day of lounging in tents, sharing snacks, flipping tapes, and stayin...",
  },
  {
    id: "2",
    titleRu: "ЧЁРНЫЙ АЛМАЗ",
    titleEn: "BLACK DIAMOND",
    clientRu: "BLACK DIAMOND",
    clientEn: "BLACK DIAMOND",
    category: "Lifestyle",
    categoryRu: "Лайфстайл",
    year: "2025",
    thumbnails: [
      "/mountain-climbing-adventure-1.jpg",
      "/mountain-climbing-adventure-2.jpg",
      "/mountain-climbing-adventure-3.jpg",
      "/mountain-climbing-adventure-4.jpg",
      "/mountain-climbing-adventure-5.jpg",
    ],
    videoUrl: "https://stream.mux.com/Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM/high.mp4",
    descriptionRu:
      "Экстремальное восхождение, снятое в суровых условиях. Истинный дух приключений и преодоления себя в каждом кадре.",
    descriptionEn:
      "Extreme climbing shot in harsh conditions. The true spirit of adventure and self-discovery in every frame.",
  },
  {
    id: "3",
    titleRu: "AI-МИРЫ БУДУЩЕГО",
    titleEn: "AI FUTURE WORLDS",
    clientRu: "SAVAGE STUDIO",
    clientEn: "SAVAGE STUDIO",
    category: "AI",
    categoryRu: "AI",
    year: "2025",
    thumbnails: [
      "/ai-generated-futuristic-cityscape-1.jpg",
      "/ai-generated-futuristic-cityscape-2.jpg",
      "/ai-generated-futuristic-cityscape-3.jpg",
      "/ai-generated-futuristic-cityscape-4.jpg",
      "/ai-generated-futuristic-cityscape-5.jpg",
    ],
    videoUrl: "https://stream.mux.com/Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM/high.mp4",
    descriptionRu:
      "Экспериментальный проект, созданный с помощью генеративных AI-инструментов. Визуализация города будущего, где границы между реальным и виртуальным стираются.",
    descriptionEn:
      "Experimental project created using generative AI tools. A visualization of the city of the future where the boundaries between real and virtual blur.",
    isAI: true,
  },
  {
    id: "4",
    titleRu: "НЕОНОВЫЕ НОЧИ",
    titleEn: "NEON NIGHTS",
    clientRu: "SONY MUSIC",
    clientEn: "SONY MUSIC",
    category: "Music Video",
    categoryRu: "Клип",
    year: "2024",
    thumbnails: [
      "/neon-city-night-music-video-scene-1.jpg",
      "/neon-city-night-music-video-scene-2.jpg",
      "/neon-city-night-music-video-scene-3.jpg",
      "/neon-city-night-music-video-scene-4.jpg",
      "/neon-city-night-music-video-scene-5.jpg",
    ],
    videoUrl: "https://stream.mux.com/Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM/high.mp4",
    descriptionRu:
      "Награждённый музыкальный клип с экспериментальными визуальными эффектами. Ночной город как холст для музыкальной истории.",
    descriptionEn:
      "Award-winning music video featuring experimental visual effects. The night city as a canvas for a musical story.",
  },
  {
    id: "5",
    titleRu: "ГЕНЕРАТИВНОЕ ИСКУССТВО",
    titleEn: "GENERATIVE ART",
    clientRu: "ГАЛЕРЕЯ СОВРЕМЕННОГО ИСКУССТВА",
    clientEn: "CONTEMPORARY ART GALLERY",
    category: "AI",
    categoryRu: "AI",
    year: "2024",
    thumbnails: [
      "/generative-ai-art-installation-1.jpg",
      "/generative-ai-art-installation-2.jpg",
      "/generative-ai-art-installation-3.jpg",
      "/generative-ai-art-installation-4.jpg",
      "/generative-ai-art-installation-5.jpg",
    ],
    videoUrl: "https://stream.mux.com/Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM/high.mp4",
    descriptionRu:
      "Серия генеративных AI-работ, исследующих границы между человеческим творчеством и машинным интеллектом.",
    descriptionEn:
      "A series of generative AI works exploring the boundaries between human creativity and machine intelligence.",
    isAI: true,
  },
  {
    id: "6",
    titleRu: "ПРЕМИУМ АВТО",
    titleEn: "PREMIUM AUTO",
    clientRu: "MERCEDES-BENZ",
    clientEn: "MERCEDES-BENZ",
    category: "Commercial",
    categoryRu: "Коммерция",
    year: "2024",
    thumbnails: [
      "/luxury-car-commercial-cinematic-1.jpg",
      "/luxury-car-commercial-cinematic-2.jpg",
      "/luxury-car-commercial-cinematic-3.jpg",
      "/luxury-car-commercial-cinematic-4.jpg",
      "/luxury-car-commercial-cinematic-5.jpg",
    ],
    videoUrl: "https://stream.mux.com/Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM/high.mp4",
    descriptionRu: "Фильм о запуске нового продукта для премиального автомобильного бренда. Роскошь в движении.",
    descriptionEn: "Product reveal film for a luxury automotive brand. Luxury in motion.",
  },
  {
    id: "7",
    titleRu: "FASHION FILM",
    titleEn: "FASHION FILM",
    clientRu: "VOGUE RUSSIA",
    clientEn: "VOGUE RUSSIA",
    category: "Fashion",
    categoryRu: "Fashion",
    year: "2023",
    thumbnails: [
      "/placeholder.svg?height=80&width=120",
      "/placeholder.svg?height=80&width=120",
      "/placeholder.svg?height=80&width=120",
      "/placeholder.svg?height=80&width=120",
      "/placeholder.svg?height=80&width=120",
    ],
    videoUrl: "https://stream.mux.com/Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM/high.mp4",
    descriptionRu: "Эдиториал-кампания, демонстрирующая новую коллекцию через движение и эмоцию.",
    descriptionEn: "Editorial campaign showcasing the new collection through movement and emotion.",
  },
]

// Project Row Component - Freshman.tv style
function ProjectRow({
  project,
  index,
  language,
}: {
  project: Project
  index: number
  language: "ru" | "en"
}) {
  const [isHovered, setIsHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const getTitle = () => (language === "ru" ? project.titleRu : project.titleEn)
  const getClient = () => (language === "ru" ? project.clientRu : project.clientEn)
  const getCategory = () => (language === "ru" ? project.categoryRu : project.category)
  const getDescription = () => (language === "ru" ? project.descriptionRu : project.descriptionEn)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="border-t border-dashed border-muted-foreground/30 py-8 md:py-12 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="grid grid-cols-12 gap-4 md:gap-6 items-start">
        {/* Column 1: Project Number */}
        <div className="col-span-2 md:col-span-1">
          <span
            className="text-sm md:text-base text-muted-foreground"
            style={{ fontFamily: "var(--font-handwritten), cursive" }}
          >
            # {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        {/* Column 2: Thumbnail Strip - screenshots from video */}
        <div className="col-span-3 md:col-span-2 flex flex-col gap-2">
          {project.thumbnails.slice(0, 5).map((thumb, thumbIndex) => (
            <motion.div
              key={thumbIndex}
              className="relative aspect-video w-full overflow-hidden"
              initial={{ opacity: 0.6 }}
              animate={{
                opacity: isHovered ? 1 : 0.6,
                scale: isHovered && thumbIndex === Math.floor(Date.now() / 1000) % 5 ? 1.02 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={thumb || "/placeholder.svg"}
                alt={`${getTitle()} кадр ${thumbIndex + 1}`}
                fill
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>

        <div className="col-span-7 md:col-span-5 relative">
          <div className="relative aspect-video overflow-hidden bg-black">
            {/* Video element - always present, plays on hover */}
            <video
              ref={videoRef}
              src={project.videoUrl}
              muted
              loop
              playsInline
              poster={project.thumbnails[0]}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Play indicator overlay when not hovering */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/20"
              initial={{ opacity: 1 }}
              animate={{ opacity: isHovered ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 rounded-full border-2 border-white/60 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[12px] border-l-white/80 border-y-[8px] border-y-transparent ml-1" />
              </div>
            </motion.div>

            {/* AI Badge */}
            {project.isAI && (
              <div className="absolute top-3 left-3 px-2 py-1 bg-accent text-background text-xs uppercase tracking-widest z-10">
                AI
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Project Info + Handwritten Category */}
        <div className="col-span-12 md:col-span-4 flex flex-col justify-between h-full mt-4 md:mt-0">
          <div>
            {/* Client & Title */}
            <div className="mb-4">
              <h3 className="text-sm md:text-base font-bold uppercase tracking-wide">{getClient()}</h3>
              <h2 className="text-xl md:text-2xl font-light uppercase tracking-wide text-muted-foreground">
                {getTitle()}
              </h2>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{getDescription()}</p>
          </div>

          {/* Handwritten Category - positioned to the right */}
          <div className="flex justify-end mt-4 md:mt-0">
            <span
              className="text-sm md:text-base text-muted-foreground italic transform -rotate-3"
              style={{ fontFamily: "var(--font-handwritten), cursive" }}
            >
              {getCategory()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CreativePreFooter() {
  const { language } = useI18n()
  const [email, setEmail] = useState("")

  return (
    <section className="bg-accent min-h-screen flex flex-col items-center justify-center relative px-4 py-20">
      {/* Hashtag icon */}
      <div className="mb-6">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-background">
          <path
            d="M14 8L10 32M30 8L26 32M8 14H32M8 26H32"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Subtitle */}
      <p className="text-background/80 text-sm md:text-base mb-8 tracking-wide">
        {language === "ru" ? "Креативная продакшн-студия" : "Creative Production Company"}
      </p>

      {/* Large Logo */}
      <div className="relative mb-12">
        <h2 className="text-[15vw] md:text-[12vw] font-black italic text-background leading-none tracking-tight">
          savage
        </h2>
        <span className="absolute -top-2 -right-4 md:-right-8 text-background text-xl md:text-2xl">®</span>
      </div>

      {/* Newsletter text */}
      <p className="text-background/80 text-center max-w-xl mb-8 text-sm md:text-base leading-relaxed">
        {language === "ru"
          ? "Будьте в курсе. Узнавайте первыми о наших новых работах, обновлениях и всём интересном, что происходит в Savage. Подпишитесь на рассылку."
          : "Keep in the loop. Be the first to know about our latest work, exciting updates, and everything else that's happening at Savage. Subscribe to our newsletter."}
      </p>

      {/* Email input - handwritten style */}
      <div className="flex items-center gap-4 border-b border-background/40 pb-2 w-full max-w-xs">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={language === "ru" ? "ваш email" : "your email"}
          className="bg-transparent text-background placeholder:text-background/50 outline-none flex-1 text-base"
          style={{ fontFamily: "var(--font-handwritten), cursive" }}
        />
        <button className="text-background hover:translate-x-1 transition-transform">
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  )
}

function CreativeFooter() {
  const { language } = useI18n()

  return (
    <footer className="bg-accent px-4 md:px-8 lg:px-12 py-6 border-t border-background/10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-background">
        {/* Socials */}
        <div className="flex flex-col">
          <span className="text-sm text-background/60 mb-2" style={{ fontFamily: "var(--font-handwritten), cursive" }}>
            (socials)
          </span>
          <div className="flex gap-4 text-sm font-medium">
            <a href="#" className="hover:opacity-60 transition-opacity">
              IG
            </a>
            <a href="#" className="hover:opacity-60 transition-opacity">
              VK
            </a>
            <a href="#" className="hover:opacity-60 transition-opacity">
              TG
            </a>
          </div>
        </div>

        {/* Center - Copyright + Tagline */}
        <div className="text-center">
          <span className="text-sm" style={{ fontFamily: "var(--font-handwritten), cursive" }}>
            2026© {language === "ru" ? "Настоящее всегда побеждает" : "Real Always Wins"}
          </span>
        </div>

        {/* Contact */}
        <div className="flex flex-col items-end">
          <span className="text-sm text-background/60 mb-2" style={{ fontFamily: "var(--font-handwritten), cursive" }}>
            (contact)
          </span>
          <a
            href="mailto:info@savage.ru"
            className="text-sm font-medium hover:opacity-60 transition-opacity uppercase tracking-wide"
          >
            INFO@SAVAGE.RU
          </a>
        </div>
      </div>
    </footer>
  )
}

export default function ProjectsPage() {
  const { language, t } = useI18n()
  const [showAll, setShowAll] = useState(false)
  const visibleProjects = showAll ? PROJECTS : PROJECTS.slice(0, 4)

  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <JalousieMenu />

      {/* Header - Freshman.tv style */}
      <header className="pt-20 pb-8 flex items-center justify-center relative">
        <div className="text-center">
          <span className="text-accent text-sm">({PROJECTS.length})</span>
          <h1 className="text-base uppercase tracking-widest">{t("projects.title")}</h1>
        </div>
      </header>

      {/* Projects List */}
      <section className="px-4 md:px-8 lg:px-12 pb-12">
        <AnimatePresence>
          {visibleProjects.map((project, index) => (
            <ProjectRow key={project.id} project={project} index={index} language={language} />
          ))}
        </AnimatePresence>

        {/* Bottom border */}
        <div className="border-t border-dashed border-muted-foreground/30" />

        {!showAll && PROJECTS.length > 4 && (
          <motion.div
            className="flex justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setShowAll(true)}
              className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-base" style={{ fontFamily: "var(--font-handwritten), cursive" }}>
                {language === "ru" ? "показать больше" : "show more"}
              </span>
              <span className="text-sm text-accent">(+{PROJECTS.length - 4})</span>
              <motion.div
                className="w-8 h-8 rounded-full border border-muted-foreground/30 flex items-center justify-center group-hover:border-foreground transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="rotate-90">
                  <path
                    d="M2 6H10M10 6L6 2M10 6L6 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </button>
          </motion.div>
        )}
      </section>

      <CreativePreFooter />

      <CreativeFooter />
    </main>
  )
}
