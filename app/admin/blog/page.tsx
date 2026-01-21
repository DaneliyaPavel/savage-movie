'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { Plus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/admin/DataTable'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import {
  getBlogPosts,
  deleteBlogPost,
  updateBlogPost,
  type BlogPost,
} from '@/lib/api/blog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function BlogAdminPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setPosts(await getBlogPosts())
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Ошибка загрузки блога:', err)
      }
      setError('Не удалось загрузить статьи блога.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!postToDelete) return
    try {
      await deleteBlogPost(postToDelete.id)
      setPosts((prev) => prev.filter((post) => post.id !== postToDelete.id))
      setPostToDelete(null)
      setDeleteDialogOpen(false)
    } catch {
      setError('Ошибка удаления статьи. Попробуйте еще раз.')
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    }
  }

  const togglePublish = async (post: BlogPost) => {
    if (publishingId) return
    setPublishingId(post.id)
    try {
      const updated = await updateBlogPost(post.id, {
        is_published: !post.is_published,
      })
      setPosts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch {
      setError('Не удалось изменить статус публикации.')
    } finally {
      setPublishingId(null)
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Заголовок',
    },
    {
      key: 'status',
      label: 'Статус',
      render: (post: BlogPost) => (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={post.is_published ? 'default' : 'secondary'}>
            {post.is_published ? 'Опубликовано' : 'Черновик'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => togglePublish(post)}
            disabled={publishingId === post.id}
          >
            {post.is_published ? 'Скрыть' : 'Опубликовать'}
          </Button>
          {post.is_published && (
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              target="_blank"
            >
              Просмотр
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Категория',
      render: (post: BlogPost) => post.category || '—',
    },
    {
      key: 'published_at',
      label: 'Публикация',
      render: (post: BlogPost) => {
        if (!post.is_published) return '—'
        const date = post.published_at ? new Date(post.published_at) : new Date(post.created_at)
        return format(date, 'd MMM yyyy', { locale: ru })
      },
    },
  ]

  if (loading) return <div className="p-8">Загрузка...</div>

  return (
    <div className="p-8">
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: 'Админ-панель', href: '/admin' },
            { label: 'Блог' },
          ]}
        />
      </div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Блог</h1>
          <p className="text-muted-foreground">Публикации и черновики</p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить статью
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
        data={posts}
        columns={columns}
        onEdit={(post) => router.push(`/admin/blog/${post.id}/edit`)}
        onDelete={(post) => {
          setPostToDelete(post)
          setDeleteDialogOpen(true)
        }}
        getRowId={(post) => post.id}
        searchPlaceholder="Поиск по статьям..."
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить статью?</DialogTitle>
            <DialogDescription>
              Статья будет удалена без возможности восстановления.
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
