/**
 * Страница редактирования проекта
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileUpload } from '@/components/admin/FileUpload'
import { ArrayInput } from '@/components/admin/ArrayInput'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { getProjects, updateProject, type ProjectUpdate } from '@/lib/api/projects'
import Link from 'next/link'

const formSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  slug: z.string().min(1, 'Slug обязателен'),
  description: z.string().optional(),
  client: z.string().optional(),
  category: z.enum(['commercial', 'ai-content', 'music-video', 'other']),
  video_url: z.string().url('Некорректный URL').optional().or(z.literal('')),
  duration: z.number().optional(),
  role: z.string().optional(),
})

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [images, setImages] = useState<string[]>([])
  const [tools, setTools] = useState<string[]>([])
  const [behindScenes, setBehindScenes] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      client: '',
      category: 'commercial',
      video_url: '',
      duration: undefined,
      role: '',
    },
  })

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const projects = await getProjects()
      const project = projects.find(p => p.id === projectId)
      if (project) {
        form.reset({
          title: project.title,
          slug: project.slug,
          description: project.description || '',
          client: project.client || '',
          category: project.category,
          video_url: project.video_url || '',
          duration: project.duration || undefined,
          role: project.role || '',
        })
        setImages(project.images || [])
        setTools(project.tools || [])
        setBehindScenes(project.behind_scenes || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки проекта:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const projectData: ProjectUpdate = {
        ...values,
        description: values.description || null,
        client: values.client || null,
        video_url: values.video_url || null,
        images: images.length > 0 ? images : null,
        tools: tools.length > 0 ? tools : null,
        behind_scenes: behindScenes.length > 0 ? behindScenes : null,
      }
      await updateProject(projectId, projectData)
      router.push('/admin/projects')
    } catch (error) {
      console.error('Ошибка обновления проекта:', error)
      alert('Ошибка обновления проекта')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-8">Загрузка...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Breadcrumbs 
          items={[
            { label: 'Админ-панель', href: '/admin' },
            { label: 'Проекты', href: '/admin/projects' },
            { label: 'Редактировать проект' }
          ]} 
          className="mb-4"
        />
        <BackButton href="/admin/projects" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">Редактировать проект</h1>
        <p className="text-muted-foreground">Измените данные проекта</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug (URL)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Описание</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={5} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Клиент</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="commercial">Коммерция</SelectItem>
                      <SelectItem value="ai-content">ИИ-контент</SelectItem>
                      <SelectItem value="music-video">Клипы</SelectItem>
                      <SelectItem value="other">Другое</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="video_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL видео</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://example.com/video.mp4" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <label className="text-sm font-medium mb-2 block">Изображения</label>
            <FileUpload
              type="images"
              multiple
              existingFiles={images}
              onMultipleUpload={(urls) => setImages(urls)}
              onRemove={(url) => setImages(images.filter(i => i !== url))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Длительность (секунды)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Роль</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <ArrayInput
            label="Инструменты"
            value={tools}
            onChange={setTools}
            placeholder="Добавить инструмент"
          />

          <ArrayInput
            label="За кадром"
            value={behindScenes}
            onChange={setBehindScenes}
            placeholder="Добавить элемент"
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
            <Link href="/admin/projects">
              <Button type="button" variant="outline">
                Отмена
              </Button>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  )
}
