'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/admin/DataTable'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getTestimonials, deleteTestimonial, type Testimonial } from '@/lib/api/testimonials'
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

export default function TestimonialsPage() {
  const router = useRouter()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTestimonials()
  }, [])

  const loadTestimonials = async () => {
    try {
      setTestimonials(await getTestimonials())
    } catch (error) {
      // В production используйте логирование на сервере
      if (process.env.NODE_ENV === 'development') {
        console.error('Ошибка загрузки отзывов:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!testimonialToDelete) return
    try {
      await deleteTestimonial(testimonialToDelete.id)
      setTestimonials(testimonials.filter(t => t.id !== testimonialToDelete.id))
      setDeleteDialogOpen(false)
      setTestimonialToDelete(null)
      setError(null)
    } catch {
      setError('Ошибка удаления отзыва. Попробуйте еще раз.')
      setDeleteDialogOpen(false)
      setTestimonialToDelete(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Имя' },
    { key: 'company', label: 'Компания', render: (t: Testimonial) => t.company || '-' },
    { key: 'rating', label: 'Рейтинг', render: (t: Testimonial) => '⭐'.repeat(t.rating) },
    { key: 'order', label: 'Порядок' },
  ]

  if (loading) return <div className="p-8">Загрузка...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Админ-панель', href: '/admin' }, { label: 'Отзывы' }]} />
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Отзывы</h1>
          <p className="text-muted-foreground">Управление отзывами</p>
        </div>
        <Link href="/admin/testimonials/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        </Link>
      </div>
      {error && (
        <div className="mb-4 p-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-auto p-0 text-red-500 hover:text-red-700"
            onClick={() => setError(null)}
          >
            ✕
          </Button>
        </div>
      )}
      <DataTable
        data={testimonials}
        columns={columns}
        onEdit={t => router.push(`/admin/testimonials/${t.id}/edit`)}
        onDelete={t => {
          setTestimonialToDelete(t)
          setDeleteDialogOpen(true)
        }}
        getRowId={t => t.id}
      />
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить отзыв?</DialogTitle>
            <DialogDescription>Вы уверены? Это действие нельзя отменить.</DialogDescription>
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
