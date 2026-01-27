/**
 * Страница списка проектов
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/admin/DataTable'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getProjects, deleteProject, updateProjectsOrder, type Project } from '@/features/projects/api'
import { SortableList } from '@/components/admin/SortableList'
import { Plus, Trash2, Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Link from 'next/link'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await getProjects()
      // Сортируем по display_order, затем по created_at
      const sorted = [...data].sort((a, b) => {
        const orderA = a.display_order ?? 0
        const orderB = b.display_order ?? 0
        if (orderA !== orderB) return orderA - orderB
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setProjects(sorted)
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (reorderedProjects: Project[]) => {
    // Обновляем локальное состояние
    setProjects(reorderedProjects)
    
    // Обновляем порядок на сервере
    try {
      const updates = reorderedProjects.map((project, index) => ({
        id: project.id,
        display_order: index,
      }))
      await updateProjectsOrder(updates)
    } catch (error) {
      console.error('Ошибка обновления порядка:', error)
      alert('Ошибка сохранения порядка. Перезагрузите страницу.')
      loadProjects() // Восстанавливаем исходный порядок
    }
  }

  const handleDelete = async () => {
    if (!projectToDelete) return

    try {
      await deleteProject(projectToDelete.id)
      setProjects(projects.filter(p => p.id !== projectToDelete.id))
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    } catch (error) {
      console.error('Ошибка удаления проекта:', error)
      alert('Ошибка удаления проекта')
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Название',
    },
    {
      key: 'category',
      label: 'Категория',
      render: (project: Project) => {
        const categories: Record<string, string> = {
          'commercial': 'Коммерция',
          'ai-content': 'ИИ-контент',
          'music-video': 'Клипы',
          'other': 'Другое',
        }
        return categories[project.category] || project.category
      },
    },
    {
      key: 'client',
      label: 'Клиент',
      render: (project: Project) => project.client || '-',
    },
    {
      key: 'created_at',
      label: 'Создан',
      render: (project: Project) => new Date(project.created_at).toLocaleDateString('ru-RU'),
    },
  ]

  if (loading) {
    return <div className="p-8">Загрузка...</div>
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Breadcrumbs 
          items={[
            { label: 'Админ-панель', href: '/admin' },
            { label: 'Проекты' }
          ]} 
        />
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Проекты</h1>
          <p className="text-muted-foreground">Управление проектами</p>
        </div>
        <Link href="/admin/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить проект
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Упорядочить проекты</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Перетащите проекты для изменения порядка отображения на сайте
        </p>
        <SortableList
          items={projects}
          onReorder={handleReorder}
          getItemId={(project) => project.id}
          className="max-w-2xl"
        >
          {(project) => (
            <div className="flex items-center justify-between w-full">
              <div>
                <div className="font-medium">{project.title}</div>
                <div className="text-sm text-muted-foreground">
                  {project.category} • {new Date(project.created_at).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/admin/projects/${project.id}/edit`)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setProjectToDelete(project)
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
        <h2 className="text-xl font-semibold mb-4">Все проекты (таблица)</h2>
        <DataTable
          data={projects}
          columns={columns}
          onEdit={(project) => router.push(`/admin/projects/${project.id}/edit`)}
          onDelete={(project) => {
            setProjectToDelete(project)
            setDeleteDialogOpen(true)
          }}
          getRowId={(project) => project.id}
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить проект?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить проект &quot;{projectToDelete?.title}&quot;? Это действие нельзя отменить.
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
