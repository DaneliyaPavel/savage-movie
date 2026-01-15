/**
 * Премиум карточка курса в стиле Freshman.tv
 * Минималистичный дизайн, крупная типографика
 */
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { GrainOverlay } from '@/components/ui/grain-overlay'

interface CourseCardProps {
  id: string
  title: string
  slug: string
  category: 'ai' | 'shooting' | 'editing' | 'production'
  coverImage?: string
  price: number
  duration?: number
  rating?: number
}

const categoryLabels: Record<string, string> = {
  ai: 'ИИ-генерация',
  shooting: 'Съемка',
  editing: 'Монтаж',
  production: 'Продакшн',
}

export function CourseCard({
  title,
  slug,
  category,
  coverImage,
  price,
  duration,
}: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group h-full flex flex-col"
    >
      <Link href={`/courses/${slug}`}>
        <div className="relative overflow-hidden bg-[#050505] border border-[#1A1A1A] hover:border-[#FFFFFF]/30 transition-all duration-500 h-full flex flex-col">
          {/* Cover Image */}
          <div className="relative aspect-video overflow-hidden bg-[#000000]">
            {coverImage ? (
              <>
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <GrainOverlay />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#050505]">
                <GrainOverlay />
                <motion.span
                  className="text-6xl font-heading font-bold text-[#FFFFFF]/20"
                  whileHover={{ scale: 1.1 }}
                >
                  {title.charAt(0)}
                </motion.span>
              </div>
            )}
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <div className="px-3 py-1 bg-[#000000]/80 backdrop-blur-sm border border-[#1A1A1A]">
                <span className="text-xs font-medium text-[#FFFFFF]/60 uppercase tracking-wider">
                  {categoryLabels[category]}
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 flex-1 flex flex-col">
            {/* Title - крупный */}
            <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-[#FFFFFF] mb-4 group-hover:text-[#CCFF00] transition-colors leading-tight">
              {title}
            </h3>
            
            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-[#FFFFFF]/40 mb-6">
              {duration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{duration} мин</span>
                </div>
              )}
            </div>

            {/* Price и подчеркивание при hover */}
            <div className="mt-auto pt-6 border-t border-[#1A1A1A] group-hover:border-[#FFFFFF]/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="text-2xl md:text-3xl font-heading font-bold text-[#FFFFFF]">
                  {price.toLocaleString('ru-RU')} ₽
                </div>
                <motion.div
                  className="text-[#FFFFFF]/60 group-hover:text-[#CCFF00] transition-colors"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  →
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
