/**
 * Премиум Hero Section в стиле Freshman.tv
 * Полноэкранное видео, крупный заголовок, минимальные CTA
 */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { getSettings } from '@/lib/api/settings'
import { GrainOverlay } from '@/components/ui/grain-overlay'

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
          const heroVideoUrl =
            typeof settings.hero_video_url === 'string' ? settings.hero_video_url : null
          const heroPlaybackId =
            typeof settings.hero_video_playback_id === 'string'
              ? settings.hero_video_playback_id
              : null

          if (heroVideoUrl) setVideoUrl(heroVideoUrl)
          if (heroPlaybackId) setVideoPlaybackId(heroPlaybackId)
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

  const handleBookClick = () => {
    if (onBookClick) {
      onBookClick()
    } else {
      window.location.href = '/contact'
    }
  }

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#000000]">
      {/* Полноэкранное видео showreel */}
      <div className="absolute inset-0 z-0">
        {videoPlaybackId ? (
          <div className="absolute inset-0 w-full h-full">
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
          <div className="absolute inset-0 w-full h-full">
            <video autoPlay muted loop playsInline className="w-full h-full object-cover">
              <source src={videoUrl} type="video/mp4" />
            </video>
          </div>
        ) : (
          <div className="absolute inset-0 bg-[#000000]" />
        )}
        {/* Легкий grain overlay */}
        <GrainOverlay />
        {/* Тонкий градиент для читаемости (минимальный) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/30 via-transparent to-[#000000]/50" />
      </div>

      {/* Контент поверх видео */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-7xl mx-auto">
          {/* Основной заголовок - очень крупный, editorial style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="mb-16 md:mb-20"
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-heading font-bold text-hero text-[#FFFFFF] leading-[0.85] tracking-tight"
            >
              <div className="flex flex-col gap-1 md:gap-2">
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#FFFFFF]"
                >
                  КРЕАТИВНОСТЬ
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#ff2936]"
                >
                  ПОДНИМАЕТ
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#FFFFFF]"
                >
                  ВСЁ
                </motion.span>
              </div>
            </motion.div>
          </motion.div>

          {/* Подзаголовок - короткий, ударный */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-20 md:mb-24 max-w-3xl"
          >
            <p className="text-editorial text-[#FFFFFF]/80 font-light leading-relaxed">
              С 2010 года мы используем креативность для продвижения самых амбициозных брендов,
              организаций и проектов в России и за её пределами.
            </p>
          </motion.div>

          {/* Минималистичные CTA кнопки */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start"
          >
            <motion.button
              onClick={scrollToProjects}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="text-xl md:text-2xl font-medium text-[#FFFFFF] hover:text-[#ff2936] transition-colors relative group"
            >
              Смотреть работы
              <motion.span
                className="absolute bottom-0 left-0 h-[1px] bg-[#FFFFFF]"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.4 }}
              />
            </motion.button>
            <motion.button
              onClick={handleBookClick}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="text-xl md:text-2xl font-medium text-[#FFFFFF] hover:text-[#ff2936] transition-colors relative group"
            >
              Обсудить проект
              <motion.span
                className="absolute bottom-0 left-0 h-[1px] bg-[#FFFFFF]"
                initial={{ width: 0 }}
                whileHover={{ width: '100%' }}
                transition={{ duration: 0.4 }}
              />
            </motion.button>
          </motion.div>

          {/* Индикатор прокрутки - минималистичный */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          >
            <motion.button
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              onClick={scrollToProjects}
              className="text-[#FFFFFF]/60 hover:text-[#FFFFFF] transition-colors"
              aria-label="Прокрутить вниз"
            >
              <ArrowDown className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
