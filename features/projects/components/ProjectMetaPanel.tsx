/**
 * ProjectMetaPanel - правая колонка с описанием проекта
 */
'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Project } from '../api'

interface ProjectMetaPanelProps {
  project: Project | null
}

const categoryLabels: Record<string, string> = {
  commercial: 'Коммерция',
  'ai-content': 'ИИ-контент',
  'music-video': 'Клип',
  other: 'Другое',
}

export function ProjectMetaPanel({ project }: ProjectMetaPanelProps) {
  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-[#FFFFFF]/40 text-sm">Выберите проект</p>
      </div>
    )
  }

  return (
    <motion.div
      key={project.id}
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="h-full flex flex-col"
    >
      {/* Title */}
      <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-[#FFFFFF] mb-6 leading-tight">
        {project.title}
      </h2>

      {/* Description */}
      {project.description && (
        <p className="text-lg md:text-xl text-[#FFFFFF]/80 font-light leading-relaxed mb-8 max-w-2xl">
          {project.description}
        </p>
      )}

      {/* Meta stack */}
      <div className="space-y-4 mb-8">
        {project.client && (
          <div>
            <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-1">
              Клиент
            </div>
            <div className="text-base md:text-lg text-[#FFFFFF] font-medium">
              {project.client}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-6">
          {project.category && (
            <div>
              <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-1">
                Категория
              </div>
              <div className="text-base md:text-lg text-[#FFFFFF] font-medium">
                {categoryLabels[project.category]}
              </div>
            </div>
          )}

          {project.duration && (
            <div>
              <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-1">
                Длительность
              </div>
              <div className="text-base md:text-lg text-[#FFFFFF] font-medium">
                {Math.floor(project.duration / 60)}:
                {(project.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}

          {project.role && (
            <div>
              <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-1">
                Роль
              </div>
              <div className="text-base md:text-lg text-[#FFFFFF] font-medium">
                {project.role}
              </div>
            </div>
          )}
        </div>

        {project.tools && project.tools.length > 0 && (
          <div>
            <div className="text-xs md:text-sm text-[#FFFFFF]/40 font-medium uppercase tracking-wider mb-2">
              Инструменты
            </div>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool, index) => (
                <span
                  key={index}
                  className="text-sm text-[#FFFFFF]/60 border border-[#1A1A1A] px-3 py-1"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-auto pt-8 border-t border-[#1A1A1A]">
        <Link href={`/projects/${project.slug}`}>
          <motion.div
            className="inline-flex items-center gap-3 group"
            whileHover={{ x: 5 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-lg md:text-xl font-medium text-[#FFFFFF]/60 group-hover:text-[#FFFFFF] transition-colors">
              Смотреть полностью
            </span>
            <ArrowRight className="w-5 h-5 text-[#FFFFFF]/40 group-hover:text-[#ff2936] transition-colors" />
          </motion.div>
        </Link>
      </div>
    </motion.div>
  )
}
