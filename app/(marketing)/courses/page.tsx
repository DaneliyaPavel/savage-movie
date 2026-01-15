/**
 * Страница со списком всех курсов
 */
'use client'

import { CourseCard } from '@/components/features/CourseCard'
import { getCourses } from '@/lib/api/courses'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Course } from '@/lib/api/courses'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const [courses, setCourses] = useState<Course[]>([])
  const [category, setCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    searchParams.then((params) => {
      setCategory(params.category || 'all')
    })
  }, [searchParams])

  useEffect(() => {
    setIsLoading(true)
    getCourses(category === 'all' ? undefined : category)
      .then((data) => {
        setCourses(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.warn('Ошибка загрузки курсов:', error)
        setIsLoading(false)
      })
  }, [category])

  const categoryFilters = [
    { value: 'all', label: 'Все' },
    { value: 'ai', label: 'ИИ-генерация' },
    { value: 'shooting', label: 'Съемка' },
    { value: 'editing', label: 'Монтаж' },
    { value: 'production', label: 'Продакшн' },
  ]

  return (
    <div className="min-h-screen py-20 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl" />
      
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
            Онлайн-курсы
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto font-light"
          >
            Изучите видеопродакшн, ИИ-генерацию, съемку и монтаж с профессионалами
          </motion.p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center mb-12"
        >
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="bg-muted/50 backdrop-blur-sm border-border/50">
              {categoryFilters.map((filter) => (
                <TabsTrigger
                  key={filter.value}
                  value={filter.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {filter.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
            />
            <p className="mt-4 text-muted-foreground">Загрузка курсов...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <CourseCard
                  id={course.id}
                  title={course.title}
                  slug={course.slug}
                  category={course.category}
                  coverImage={course.cover_image || undefined}
                  price={Number(course.price)}
                  duration={course.duration || undefined}
                />
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && (!courses || courses.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-muted-foreground text-lg">Курсы не найдены</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
