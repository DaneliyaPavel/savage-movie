/**
 * Избранные проекты на главной в стиле Freshman.tv
 * 3-6 проектов в poster-like карточках
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { WorkCard } from '@/components/features/WorkCard'
import { EditorialCorrection } from '@/components/ui/editorial-correction'
import type { Project } from '@/features/projects/api'

interface FeaturedProjectsProps {
  projects: Project[]
}

export function FeaturedProjects({ projects }: FeaturedProjectsProps) {
  if (projects.length === 0) {
    return null
  }

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
          <div className="mb-8">
            <EditorialCorrection
              wrong="Избранные проекты"
              correct="Лучшие работы"
              size="xl"
              delay={0.2}
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/60 font-light max-w-3xl"
          >
            Посмотрите нашу работу и убедитесь в качестве
          </motion.p>
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          {projects.map(project => (
            <WorkCard key={project.id} project={project} />
          ))}
        </div>

        {/* View All Link */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
