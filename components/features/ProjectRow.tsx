/**
 * Project Row (List View) в стиле Freshman.tv
 * Элегантная строка как журнальный индекс
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/lib/api/projects'

interface ProjectRowProps {
  project: Project
  index: number
}

const categoryLabels: Record<string, string> = {
  commercial: 'Коммерция',
  'ai-content': 'ИИ-контент',
  'music-video': 'Клип',
  other: 'Другое',
}

export function ProjectRow({ project, index }: ProjectRowProps) {
  const currentYear = new Date().getFullYear()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <Link href={`/projects/${project.slug}`}>
        <div className="flex items-center justify-between py-6 md:py-8 border-b border-[#1A1A1A] hover:border-[#FFFFFF]/30 transition-colors duration-500">
          {/* Левая часть - название и категория */}
          <div className="flex-1">
            <div className="flex items-center gap-4 md:gap-6 mb-2">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold text-[#FFFFFF] group-hover:text-[#CCFF00] transition-colors">
                {project.title}
              </h3>
              {project.category && (
                <span className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider">
                  {categoryLabels[project.category]}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-sm md:text-base text-[#FFFFFF]/60 max-w-2xl line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          {/* Правая часть - метаданные (как журнальный индекс) */}
          <div className="hidden md:flex items-center gap-8 text-sm text-[#FFFFFF]/40">
            {project.client && (
              <div className="text-right min-w-[120px]">
                <div className="font-medium text-[#FFFFFF]/60">{project.client}</div>
              </div>
            )}
            {project.duration && (
              <div className="text-right min-w-[60px]">
                {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
              </div>
            )}
            <div className="text-right min-w-[60px]">
              {currentYear}
            </div>
            {/* Стрелка */}
            <motion.div
              className="text-[#FFFFFF]/40 group-hover:text-[#CCFF00] transition-colors"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.3 }}
            >
              →
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
