/**
 * Hero секция с креативной типографикой в стиле The Up&Up Group
 */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { getSettings } from '@/lib/api/settings'

interface HeroSectionProps {
  videoUrl?: string
  videoPlaybackId?: string
  onBookClick?: () => void
}

export function HeroSection({
  videoUrl: propsVideoUrl,
  videoPlaybackId: propsVideoPlaybackId,
  onBookClick,
}: HeroSectionProps) {
  const [videoUrl, setVideoUrl] = useState<string | undefined>(propsVideoUrl)
  const [videoPlaybackId, setVideoPlaybackId] = useState<string | undefined>(propsVideoPlaybackId)

  useEffect(() => {
    if (!propsVideoUrl && !propsVideoPlaybackId) {
      const loadSettings = async () => {
        try {
          const settings = await getSettings()
          if (settings.hero_video_url) {
            setVideoUrl(settings.hero_video_url)
          }
          if (settings.hero_video_playback_id) {
            setVideoPlaybackId(settings.hero_video_playback_id)
          }
        } catch (error) {
          console.error('Ошибка загрузки настроек:', error)
        }
      }
      loadSettings()
    }
  }, [propsVideoUrl, propsVideoPlaybackId])
  const scrollToProjects = () => {
    const projectsSection = document.getElementById('projects')
    projectsSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Subtle Background */}
      <div className="absolute inset-0 z-0">
        {videoPlaybackId ? (
          <div className="absolute inset-0 opacity-20">
            <VideoPlayer
              playbackId={videoPlaybackId}
              autoplay
              muted
              loop
              controls={false}
              className="w-full h-full object-cover"
            />
          </div>
        ) : videoUrl ? (
          <div className="absolute inset-0 opacity-20">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        ) : null}
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-7xl mx-auto">
          {/* Main heading with creative typography */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="mb-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-heading font-bold text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[12rem] leading-[0.9] tracking-tight"
            >
              <div className="flex flex-col">
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-foreground"
                >
                  КРЕАТИВНОСТЬ
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-primary"
                >
                  ПОДНИМАЕТ
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="text-foreground"
                >
                  ВСЁ
                </motion.span>
              </div>
            </motion.div>
          </motion.div>

          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mb-16 max-w-3xl"
          >
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground font-light leading-relaxed">
              С 2010 года мы используем креативность для продвижения самых амбициозных брендов, 
              организаций и проектов в России и за её пределами.
            </p>
          </motion.div>

          {/* Minimalist CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-4 items-start"
          >
            <Button
              size="lg"
              onClick={scrollToProjects}
              variant="outline"
              className="border-2 border-foreground hover:bg-foreground hover:text-background px-8 py-6 text-lg font-medium rounded-none transition-all"
            >
              Смотреть работы
            </Button>
            <Button
              size="lg"
              onClick={onBookClick}
              className="bg-foreground hover:bg-foreground/90 text-background px-8 py-6 text-lg font-medium rounded-none"
            >
              Обсудить проект
            </Button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="cursor-pointer"
              onClick={scrollToProjects}
            >
              <ArrowDown className="w-6 h-6 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
