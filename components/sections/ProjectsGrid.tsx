/**
 * Упрощенная секция проектов в стиле The Up&Up Group
 */
'use client'

import { useState } from 'react'
import { ProjectCard } from '@/components/features/ProjectCard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { Project } from '@/lib/api/projects'

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

  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter(p => p.category === selectedCategory)

  return (
    <section id="projects" className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-border/30">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h2 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl mb-6 text-foreground">
            Наши проекты
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl">
            Посмотрите нашу работу и убедитесь в качестве
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="bg-transparent border-b border-border/30 rounded-none h-auto p-0">
              {categoryFilters.map((filter) => (
                <TabsTrigger
                  key={filter.value}
                  value={filter.value}
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:text-foreground rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
                >
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredProjects.map((project) => (
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
            <p className="text-muted-foreground">Проекты не найдены</p>
          </div>
        )}

        {/* View All Link */}
        {filteredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Link
              href="/projects"
              className="inline-block text-foreground/70 hover:text-foreground border-b border-foreground/30 hover:border-foreground transition-colors text-lg font-medium"
            >
              Смотреть все проекты →
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
