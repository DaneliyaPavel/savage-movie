/**
 * Страница со списком всех проектов
 */
'use client'

import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
import { getProjects } from '@/lib/api/projects'
import type { Project } from '@/lib/api/projects'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const [projects, setProjects] = useState<Project[]>([])
  const [category, setCategory] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    searchParams.then((params) => {
      setCategory(params.category || 'all')
      setSearch(params.search || '')
    })
  }, [searchParams])

  useEffect(() => {
    setIsLoading(true)
    getProjects(category === 'all' ? undefined : category)
      .then((data) => {
        let filtered = data
        if (search) {
          const searchLower = search.toLowerCase()
          filtered = data.filter(
            (p) =>
              p.title.toLowerCase().includes(searchLower) ||
              (p.description && p.description.toLowerCase().includes(searchLower))
          )
        }
        setProjects(filtered)
        setIsLoading(false)
      })
      .catch((error) => {
        console.warn('Ошибка загрузки проектов:', error)
        setIsLoading(false)
      })
  }, [category, search])

  return (
    <div className="min-h-screen py-20 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-heading font-bold text-6xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
          >
            Все проекты
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto font-light"
          >
            Изучите наше портфолио и вдохновитесь примерами нашей работы
          </motion.p>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
            />
            <p className="mt-4 text-muted-foreground">Загрузка проектов...</p>
          </div>
        ) : (
          <ProjectsGrid projects={projects} />
        )}
      </div>
    </div>
  )
}
