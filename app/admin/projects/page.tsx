/**
 * Страница списка проектов
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/admin/DataTable'
import { getProjects, deleteProject, type Project } from '@/lib/api/projects'
import { Plus, Trash2 } from 'lucide-react'
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
      setProjects(data)
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error)
    } finally {
      setLoading(false)
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить проект?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить проект "{projectToDelete?.title}"? Это действие нельзя отменить.
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
