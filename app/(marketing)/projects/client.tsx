/**
 * Клиентский компонент страницы Projects с Project Player Wall
 * В стиле Freshman.tv director pages
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { WorkCard } from '@/components/features/WorkCard'
import { ProjectRow } from '@/components/features/ProjectRow'
import { ProjectPlayerWall } from '@/components/features/ProjectPlayerWall'
import { FilterChips } from '@/components/ui/filter-chips'
import { StorylineText } from '@/components/ui/storyline-text'
import { LayoutGrid, List } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SectionTitle } from '@/components/ui/section-title'
import type { Project } from '@/lib/api/projects'

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
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [category, setCategory] = useState(initialCategory)
  const router = useRouter()

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    const params = new URLSearchParams()
    if (value !== 'all') {
      params.set('category', value)
    }
    router.push(`/projects${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const filteredProjects = category === 'all'
    ? projects
    : projects.filter(p => p.category === category)

  // Берем проекты для Player Wall (первые 6)
  const featuredProjects = filteredProjects.slice(0, 6)

  return (
    <div className="min-h-screen pt-0 pb-20 bg-[#000000]">
      {/* Project Player Wall - Hero секция */}
      {featuredProjects.length > 0 && (
        <ProjectPlayerWall projects={featuredProjects} />
      )}

      {/* Projects Listing Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Заголовок секции */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24 editorial-spacing"
        >
          <SectionTitle mark="plus" markPosition="top-left" size="xl" className="text-[#FFFFFF] mb-12">
            Проекты
          </SectionTitle>

          {/* Storyline Text с перечеркнутым словом */}
          <div className="mb-12 max-w-5xl">
            <StorylineText
              text="Через призму визуально точного сторителлинга мы превращаем бренды в живые проекты"
              crossedWord="проекты"
              replacement="истории"
              size="lg"
              delay={0.2}
            />
          </div>
        </motion.div>

        {/* Filters и View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 md:mb-16"
        >
          {/* Filter Chips */}
          <FilterChips
            filters={categoryFilters}
            activeFilter={category}
            onFilterChange={handleCategoryChange}
          />

          {/* View Toggle */}
          <div className="flex items-center gap-2 border border-[#1A1A1A] p-1">
            <motion.button
              onClick={() => setView('grid')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 transition-colors ${
                view === 'grid'
                  ? 'bg-[#FFFFFF] text-[#000000]'
                  : 'text-[#FFFFFF]/60 hover:text-[#FFFFFF]'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => setView('list')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 transition-colors ${
                view === 'list'
                  ? 'bg-[#FFFFFF] text-[#000000]'
                  : 'text-[#FFFFFF]/60 hover:text-[#FFFFFF]'
              }`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>

        {/* Projects - Grid или List */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#FFFFFF]/60 text-lg">Проекты не найдены</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProjects.map((project) => (
              <WorkCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="space-y-px md:space-y-1">
            {filteredProjects.map((project, index) => (
              <ProjectRow key={project.id} project={project} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
