/**
 * Секция проектов на главной в премиум стиле Freshman.tv
 */
'use client'

import { useState } from 'react'
import { ProjectCard } from '@/components/features/ProjectCard'
import { FilterChips } from '@/components/ui/filter-chips'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Project } from '@/features/projects/api'
import { SectionTitle } from '@/components/ui/section-title'

interface ProjectsGridProps {
  projects: Project[]
}

const categoryFilters = [
  { value: 'all', label: 'Все' },
  { value: 'commercial', label: 'Коммерция' },
  { value: 'ai-content', label: 'ИИ-контент' },
  { value: 'music-video', label: 'Клипы' },
]

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const filteredProjects =
    selectedCategory === 'all' ? projects : projects.filter(p => p.category === selectedCategory)

  return (
    <section
      id="projects"
      className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-[#1A1A1A] bg-[#000000]"
    >
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24 editorial-spacing"
        >
          <SectionTitle
            mark="plus"
            markPosition="top-left"
            size="xl"
            className="text-[#FFFFFF] mb-8"
          >
            Избранные проекты
          </SectionTitle>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/60 font-light max-w-3xl"
          >
            Посмотрите нашу работу и убедитесь в качестве
          </motion.p>
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
            activeFilter={selectedCategory}
            onFilterChange={setSelectedCategory}
          />
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              slug={project.slug}
              category={project.category}
              thumbnail={project.images?.[0]}
              videoUrl={project.video_url || undefined}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#FFFFFF]/60">Проекты не найдены</p>
          </div>
        )}

        {/* View All Link */}
        {filteredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-center border-t border-[#1A1A1A] pt-12"
          >
            <Link href="/projects">
              <motion.div
                className="inline-flex items-center gap-3 group"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-lg md:text-xl font-medium text-[#FFFFFF]/60 group-hover:text-[#FFFFFF] transition-colors">
                  Смотреть все проекты
                </span>
                <ArrowRight className="w-5 h-5 text-[#FFFFFF]/40 group-hover:text-[#ff2936] transition-colors" />
              </motion.div>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
