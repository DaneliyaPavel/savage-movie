/**
 * Страница списка курсов
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/admin/DataTable'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { getCourses, deleteCourse, type Course } from '@/lib/api/courses'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'

export default function CoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await getCourses()
      setCourses(data)
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!courseToDelete) return
    try {
      await deleteCourse(courseToDelete.id)
      setCourses(courses.filter(c => c.id !== courseToDelete.id))
      setDeleteDialogOpen(false)
      setCourseToDelete(null)
    } catch (error) {
      console.error('Ошибка удаления курса:', error)
      alert('Ошибка удаления курса')
    }
  }

  const columns = [
    { key: 'title', label: 'Название' },
    {
      key: 'category',
      label: 'Категория',
      render: (course: Course) => {
        const categories: Record<string, string> = {
          'ai': 'ИИ',
          'shooting': 'Съемка',
          'editing': 'Монтаж',
          'production': 'Продюсирование',
        }
        return categories[course.category] || course.category
      },
    },
    {
      key: 'price',
      label: 'Цена',
      render: (course: Course) => `${course.price.toLocaleString('ru-RU')} ₽`,
    },
    {
      key: 'created_at',
      label: 'Создан',
      render: (course: Course) => new Date(course.created_at).toLocaleDateString('ru-RU'),
    },
  ]

  if (loading) return <div className="p-8">Загрузка...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <Breadcrumbs 
          items={[
            { label: 'Админ-панель', href: '/admin' },
            { label: 'Курсы' }
          ]} 
        />
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Курсы</h1>
          <p className="text-muted-foreground">Управление курсами</p>
        </div>
        <Link href="/admin/courses/new">
          <Button><Plus className="w-4 h-4 mr-2" />Добавить курс</Button>
        </Link>
      </div>

      <DataTable
        data={courses}
        columns={columns}
        onEdit={(course) => router.push(`/admin/courses/${course.id}/edit`)}
        onDelete={(course) => {
          setCourseToDelete(course)
          setDeleteDialogOpen(true)
        }}
        getRowId={(course) => course.id}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить курс?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить курс "{courseToDelete?.title}"? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
