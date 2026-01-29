/**
 * Project ThumbRail - вертикальный список миниатюр проектов
 */
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Project } from '../api'

interface ProjectThumbRailProps {
  projects: Project[]
  selectedId: string
  onSelect: (project: Project) => void
}

const categoryLabels: Record<string, string> = {
  commercial: 'Коммерция',
  'ai-content': 'ИИ-контент',
  'music-video': 'Клип',
  other: 'Другое',
}

export function ProjectThumbRail({ projects, selectedId, onSelect }: ProjectThumbRailProps) {
  return (
    <div className="flex flex-col gap-2 md:gap-3 h-full overflow-y-auto pr-2 custom-scrollbar">
      {projects.map((project, index) => {
        const isSelected = project.id === selectedId
        const thumbnail = project.images?.[0]

        return (
          <motion.button
            key={project.id}
            data-project-id={project.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onSelect(project)}
            className={`relative group text-left transition-all ${
              isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
            }`}
            whileHover={{ x: 4 }}
          >
            <div
              className={`relative aspect-video overflow-hidden bg-[#050505] border transition-all ${
                isSelected
                  ? 'border-[#ff2936]'
                  : 'border-[#1A1A1A] hover:border-[#FFFFFF]/30'
              }`}
            >
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt={project.title}
                  fill
                  className={`object-cover transition-transform duration-500 ${
                    isSelected ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#050505]">
                  <span className="text-xs text-[#FFFFFF]/20 font-heading">
                    {project.title.charAt(0)}
                  </span>
                </div>
              )}

              {/* Overlay для выбранного */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-[#ff2936]/10"
                />
              )}

              {/* Meta overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#000000]/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between text-xs">
                  {project.category && (
                    <span className="text-[#FFFFFF]/60 uppercase tracking-wider">
                      {categoryLabels[project.category] ?? project.category}
                    </span>
                  )}
                  {project.duration && (
                    <span className="text-[#FFFFFF]/60">
                      {Math.floor(project.duration / 60)}:
                      {(project.duration % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Подчеркивание при hover */}
            {!isSelected && (
              <div className="absolute bottom-0 left-0 h-[1px] bg-[#FFFFFF]/30 w-0 transition-all duration-300 group-hover:w-full" />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
