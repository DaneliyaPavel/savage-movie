/**
 * Клиентский компонент страницы Courses в премиум стиле Freshman.tv
 * Сохраняет логику, визуально премиум редакторский стиль
 */
'use client'

import { CourseCard } from '@/features/courses/components/CourseCard'
import { FilterChips } from '@/components/ui/filter-chips'
import { SectionTitle } from '@/components/ui/section-title'
import { motion } from 'framer-motion'
import type { Course } from '@/features/courses/api'
import { useRouter } from 'next/navigation'

interface CoursesPageClientProps {
  courses: Course[]
  category: string
}

const categoryFilters = [
  { value: 'all', label: 'Все' },
  { value: 'ai', label: 'ИИ-генерация' },
  { value: 'shooting', label: 'Съемка' },
  { value: 'editing', label: 'Монтаж' },
  { value: 'production', label: 'Продакшн' },
]

export function CoursesPageClient({ courses, category: initialCategory }: CoursesPageClientProps) {
  const router = useRouter()

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams()
    if (value !== 'all') {
      params.set('category', value)
    }
    router.push(`/courses${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="min-h-screen pt-20 pb-20 bg-[#000000]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24 editorial-spacing"
        >
          <SectionTitle mark="arrow" markPosition="top-left" size="xl" className="text-[#FFFFFF] mb-8">
            Курсы
          </SectionTitle>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/60 font-light max-w-3xl"
          >
            Изучите видеопродакшн, ИИ-генерацию, съемку и монтаж с профессионалами
          </motion.p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 md:mb-16"
        >
          <FilterChips
            filters={categoryFilters}
            activeFilter={initialCategory}
            onFilterChange={handleCategoryChange}
          />
        </motion.div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#FFFFFF]/60 text-lg">Курсы не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
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
      </div>
    </div>
  )
}
