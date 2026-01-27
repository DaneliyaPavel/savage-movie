/**
 * Клиентский компонент страницы Projects в стиле Freshman.tv
 * 3-колоночный layout с креативным заголовком
 */
'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ProjectRow3Column } from '@/features/projects/components/ProjectRow3Column'
import { FilterChips } from '@/components/ui/filter-chips'
import { useRouter } from 'next/navigation'
import { CreativeStrikethrough } from '@/components/ui/creative-strikethrough'
import type { Project } from '@/features/projects/api'
import { filterProjectsByOrientation, type ProjectOrientationFilter } from '@/features/projects/utils'

interface ProjectsPageClientProps {
  projects: Project[]
  category: string
}

const categoryFilters = [
  { value: 'all', label: 'Все' },
  { value: 'commercial', label: 'Коммерция' },
  { value: 'music-video', label: 'Клип' },
  { value: 'ai-content', label: 'ИИ-контент' },
  { value: 'other', label: 'Другое' },
]

export function ProjectsPageClient({ projects, category: initialCategory }: ProjectsPageClientProps) {
  const [category, setCategory] = useState(initialCategory)
  const [orientationFilter, setOrientationFilter] = useState<ProjectOrientationFilter>('all')
  const router = useRouter()

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    const params = new URLSearchParams()
    if (value !== 'all') {
      params.set('category', value)
    }
    router.push(`/projects${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const categoryFilteredProjects = useMemo(() => (
    category === 'all'
      ? projects
      : projects.filter(p => p.category === category)
  ), [category, projects])
  const filteredProjects = useMemo(
    () => filterProjectsByOrientation(categoryFilteredProjects, orientationFilter),
    [categoryFilteredProjects, orientationFilter]
  )
  const orientationFilters = [
    { value: 'all', label: 'Все' },
    { value: 'horizontal', label: 'Горизонтальные' },
    { value: 'vertical', label: 'Вертикальные' },
  ] as const

  return (
    <div className="min-h-screen pt-0 pb-20 bg-[#000000]">
      {/* Projects Listing Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Заголовок секции с креативным перечеркиванием */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24"
        >
          <div className="mb-12">
            <CreativeStrikethrough wrong="Проекты" correct="Истории" size="xl" delay={0.2} />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 md:mb-16"
        >
          <FilterChips
            filters={categoryFilters}
            activeFilter={category}
            onFilterChange={handleCategoryChange}
          />
          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs md:text-sm uppercase tracking-[0.35em] text-[#FFFFFF]/50">
              Ориентация
            </div>
            <div className="flex flex-wrap gap-3">
              {orientationFilters.map((filter) => {
                const isActive = orientationFilter === filter.value
                const shapeBase = 'rounded-[2px] border border-current/40 bg-current/10'
                const horizontalShape = `${shapeBase} h-3 md:h-3.5 aspect-[16/9]`
                const verticalShape = `${shapeBase} h-5 md:h-6 aspect-[9/16]`

                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setOrientationFilter(filter.value)}
                    aria-pressed={isActive}
                    className={`group inline-flex items-center gap-3 rounded-md border px-4 py-3 text-[10px] md:text-xs uppercase tracking-[0.25em] transition ${
                      isActive
                        ? 'border-[#ff2936]/70 bg-[#ff2936]/10 text-white shadow-[0_10px_30px_rgba(255,41,54,0.18)]'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {filter.value === 'all' ? (
                      <span className="flex items-end gap-1">
                        <span className={horizontalShape} />
                        <span className={verticalShape} />
                      </span>
                    ) : filter.value === 'vertical' ? (
                      <span className={verticalShape} />
                    ) : (
                      <span className={horizontalShape} />
                    )}
                    <span>{filter.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Projects - 3-колоночный layout */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#FFFFFF]/60 text-lg">Проекты не найдены</p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredProjects.map((project, index) => (
              <ProjectRow3Column key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
