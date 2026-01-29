/**
 * Страница списка курсов
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/admin/DataTable'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getCourses, deleteCourse, updateCoursesOrder, type Course } from '@/features/courses/api'
import { SortableList } from '@/components/admin/SortableList'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
  const categoryLabels: Record<string, string> = {
    ai: 'ИИ',
    shooting: 'Съемка',
    editing: 'Монтаж',
    production: 'Продюсирование',
  }

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await getCourses()
      // Сортируем по display_order, затем по created_at
      const sorted = [...data].sort((a, b) => {
        const orderA = a.display_order ?? 0
        const orderB = b.display_order ?? 0
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setCourses(sorted)
    } catch (error) {
      console.error('Ошибка загрузки курсов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (reorderedCourses: Course[]) => {
    // Обновляем локальное состояние
    setCourses(reorderedCourses)

    // Обновляем порядок на сервере
    try {
      const updates = reorderedCourses.map((course, index) => ({
        id: course.id,
        display_order: index,
      }))
      await updateCoursesOrder(updates)
    } catch (error) {
      console.error('Ошибка обновления порядка:', error)
      alert('Ошибка сохранения порядка. Перезагрузите страницу.')
      loadCourses() // Восстанавливаем исходный порядок
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
        return categoryLabels[course.category] || course.category
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
        <Breadcrumbs items={[{ label: 'Админ-панель', href: '/admin' }, { label: 'Курсы' }]} />
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Курсы</h1>
          <p className="text-muted-foreground">Управление курсами</p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить курс
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Упорядочить курсы</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Перетащите курсы для изменения порядка отображения на сайте
        </p>
        <SortableList
          items={courses}
          onReorder={handleReorder}
          getItemId={course => course.id}
          className="max-w-2xl"
        >
          {course => (
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="font-medium">{course.title}</div>
                <div className="text-sm text-muted-foreground">
                  {categoryLabels[course.category] || course.category} •{' '}
                  {course.price.toLocaleString('ru-RU')} ₽
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setCourseToDelete(course)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          )}
        </SortableList>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Все курсы (таблица)</h2>
        <DataTable
          data={courses}
          columns={columns}
          onEdit={course => router.push(`/admin/courses/${course.id}/edit`)}
          onDelete={course => {
            setCourseToDelete(course)
            setDeleteDialogOpen(true)
          }}
          getRowId={course => course.id}
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить курс?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить курс &quot;{courseToDelete?.title}&quot;? Это действие
              нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
