/**
 * About Teaser секция на главной в премиум стиле Freshman.tv
 * Короткий текст о режиссере + CTA
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionTitle } from '@/components/ui/section-title'

interface AboutTeaserProps {
  onBookClick?: () => void
}

export function AboutTeaser({ onBookClick }: AboutTeaserProps) {
  const handleBookClick = () => {
    if (onBookClick) {
      onBookClick()
    } else {
      window.location.href = '/contact'
    }
  }

  return (
    <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-[#1A1A1A] bg-[#000000]">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <SectionTitle mark="circle" markPosition="top-left" size="lg" className="text-[#FFFFFF] mb-8">
              О нас
            </SectionTitle>
            <p className="text-editorial text-[#FFFFFF]/80 font-light leading-relaxed mb-8">
              Мы работаем так, чтобы люди смотрели, а вам всегда хотелось сказать: 
              "Это именно то, что нужно!"
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/about">
                <motion.div
                  className="inline-flex items-center gap-3 group"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-lg font-medium text-[#FFFFFF]/60 group-hover:text-[#FFFFFF] transition-colors">
                    Узнать больше
                  </span>
                  <ArrowRight className="w-5 h-5 text-[#FFFFFF]/40 group-hover:text-[#CCFF00] transition-colors" />
                </motion.div>
              </Link>
              <motion.button
                onClick={handleBookClick}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="text-lg font-medium text-[#FFFFFF] hover:text-[#CCFF00] transition-colors relative group inline-flex items-center"
              >
                Обсудить проект
                <motion.span
                  className="absolute bottom-0 left-0 h-[1px] bg-[#FFFFFF]"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.4 }}
                />
              </motion.button>
            </div>
          </motion.div>

          {/* Visual Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-square bg-[#050505] border border-[#1A1A1A] overflow-hidden"
          >
            {/* Placeholder для визуала */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl font-heading font-bold text-[#FFFFFF]/10">SM</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
