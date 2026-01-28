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
import { getProjectById, updateProject, type ProjectUpdate } from '@/features/projects/api'
import Link from 'next/link'

const formSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  slug: z.string().min(1, 'Slug обязателен'),
  description: z.string().optional(),
  client: z.string().optional(),
  category: z.enum(['commercial', 'ai-content', 'music-video', 'other']),
  video_url: z.string().url('Некорректный URL').optional().or(z.literal('')),
  orientation: z.enum(['horizontal', 'vertical']).optional(),
  duration: z.number().optional(),
  role: z.string().optional(),
  is_featured: z.boolean().optional(),
  mux_playback_id: z.string().optional(),
  title_ru: z.string().optional(),
  title_en: z.string().optional(),
  description_ru: z.string().optional(),
  description_en: z.string().optional(),
  thumbnail_url: z.string().url('Некорректный URL').optional().or(z.literal('')),
  cover_image_url: z.string().url('Некорректный URL').optional().or(z.literal('')),
  year: z.number().optional(),
})

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const [images, setImages] = useState<string[]>([]) // Первые 5 для thumbnail strip, остальные для галереи
  const [tools, setTools] = useState<string[]>([])
  const [behindScenes, setBehindScenes] = useState<string[]>([]) // URL изображений для behind the scenes
  const [behindScenesFiles, setBehindScenesFiles] = useState<string[]>([]) // Загруженные файлы для behind the scenes
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
      orientation: 'horizontal',
      duration: undefined,
      role: '',
      is_featured: false,
      mux_playback_id: '',
      title_ru: '',
      title_en: '',
      description_ru: '',
      description_en: '',
      thumbnail_url: '',
      cover_image_url: '',
      year: undefined,
    },
  })

  useEffect(() => {
    const loadProject = async () => {
      try {
        const project = await getProjectById(projectId)
        if (project) {
          form.reset({
            title: project.title,
            slug: project.slug,
            description: project.description || '',
            client: project.client || '',
            category: project.category,
            video_url: project.video_url || '',
            orientation: project.orientation || 'horizontal',
            duration: project.duration || undefined,
            role: project.role || '',
            is_featured: project.is_featured || false,
            mux_playback_id: project.mux_playback_id || '',
            title_ru: project.title_ru || '',
            title_en: project.title_en || '',
            description_ru: project.description_ru || '',
            description_en: project.description_en || '',
            thumbnail_url: project.thumbnail_url || '',
            cover_image_url: project.cover_image_url || '',
            year: project.year || undefined,
          })
          setImages(project.images || [])
          setTools(project.tools || [])
          // Разделяем behind_scenes на файлы (начинаются с /uploads) и URL
          const behindScenesData = project.behind_scenes || []
          const files = behindScenesData.filter(url => url.startsWith('/uploads'))
          const urls = behindScenesData.filter(url => !url.startsWith('/uploads'))
          setBehindScenesFiles(files)
          setBehindScenes(urls)
        }
      } catch (error) {
        console.error('Ошибка загрузки проекта:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const projectData: ProjectUpdate = {
        ...values,
        description: values.description || null,
        client: values.client || null,
        video_url: values.video_url || null,
        orientation: values.orientation || 'horizontal',
        images: images.length > 0 ? images : null,
        tools: tools.length > 0 ? tools : null,
        behind_scenes: [...behindScenes, ...behindScenesFiles].length > 0 
          ? [...behindScenes, ...behindScenesFiles] 
          : null,
        is_featured: values.is_featured || false,
        mux_playback_id: values.mux_playback_id || null,
        title_ru: values.title_ru || null,
        title_en: values.title_en || null,
        description_ru: values.description_ru || null,
        description_en: values.description_en || null,
        thumbnail_url: values.thumbnail_url || null,
        cover_image_url: values.cover_image_url || null,
        year: values.year || null,
      }
      await updateProject(projectId, projectData)
      router.push('/admin/projects')
    } catch (error) {
      console.error('Ошибка обновления проекта:', error)
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления проекта'
      alert(errorMessage)
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

          <div className="grid grid-cols-2 gap-4">
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

            <FormField
              control={form.control}
              name="mux_playback_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mux Playback ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Qf6mbMSob4v5nv7c6Mbf7TAipjM01PfHe01bDaDC1otOM" />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">Используется для видео на главной странице</p>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="orientation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ориентация видео</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="horizontal">Горизонтальное (16:9)</SelectItem>
                    <SelectItem value="vertical">Вертикальное (9:16)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
                <p className="text-xs text-muted-foreground">Используется для корректного отображения в списке проектов</p>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="thumbnail_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL миниатюры (для carousel)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/thumbnail.jpg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL обложки</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://example.com/cover.jpg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Раздел: Изображения */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Изображения проекта</h3>
            
            {/* Thumbnail Strip - для левого столбца на /projects */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
              <label className="text-sm font-medium mb-2 block">
                📸 Изображения для левого столбца (Thumbnail Strip) ⭐
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Где отображается:</strong> Левый столбец на странице <code className="text-xs bg-background px-1 py-0.5 rounded">/projects</code> (до 5 изображений)
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Что загружать:</strong> Скриншоты/кадры из видео проекта. Первые 5 изображений будут использоваться для thumbnail strip.
              </p>
              <div className="mb-2">
                <FileUpload
                  type="images"
                  multiple
                  existingFiles={images.slice(0, 5)}
                  onMultipleUpload={(urls) => {
                    // Дополняем существующие изображения новыми (первые 5 для thumbnail strip)
                    const currentThumbnails = images.slice(0, 5)
                    const newThumbnails = [...currentThumbnails, ...urls].slice(0, 5) // Берем только первые 5
                    const galleryImages = images.slice(5)
                    setImages([...newThumbnails, ...galleryImages])
                  }}
                  onRemove={(url) => {
                    const index = images.indexOf(url)
                    if (index !== -1) {
                      setImages(images.filter((_, i) => i !== index))
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Загружено: {images.slice(0, 5).length}/5 (первые 5 используются для thumbnail strip)
              </p>
            </div>

            {/* Gallery Images - для детальной страницы */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
              <label className="text-sm font-medium mb-2 block">
                🖼️ Галерея проекта (для детальной страницы)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Где отображается:</strong> Секция &quot;Галерея&quot; на странице конкретного проекта <code className="text-xs bg-background px-1 py-0.5 rounded">/projects/[slug]</code>
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Что загружать:</strong> Основные изображения проекта, финальные кадры, постеры. Все изображения, начиная с 6-го, будут показаны в галерее.
              </p>
              <div className="mb-2">
                <FileUpload
                  type="images"
                  multiple
                  existingFiles={images.slice(5)}
                  onMultipleUpload={(urls) => {
                    // Дополняем галерею новыми изображениями (первые 5 остаются для thumbnail strip)
                    const thumbnails = images.slice(0, 5)
                    const gallery = images.slice(5)
                    setImages([...thumbnails, ...gallery, ...urls])
                  }}
                  onRemove={(url) => {
                    const index = images.indexOf(url)
                    if (index !== -1 && index >= 5) {
                      setImages(images.filter((_, i) => i !== index))
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Загружено для галереи: {images.slice(5).length} изображений
              </p>
            </div>

            {/* Behind the Scenes */}
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <label className="text-sm font-medium mb-2 block">
                🎬 За кадром (Behind the Scenes)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Где отображается:</strong> Секция &quot;За кадром&quot; на странице конкретного проекта <code className="text-xs bg-background px-1 py-0.5 rounded">/projects/[slug]</code>
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Что загружать:</strong> Фото со съемочной площадки, процесс работы, бекстейдж, рабочие моменты.
              </p>
              
              {/* Загрузка файлов для behind the scenes */}
              <div className="mb-4">
                <FileUpload
                  type="images"
                  multiple
                  existingFiles={behindScenesFiles}
                  onMultipleUpload={(urls) => {
                    // Дополняем существующие файлы новыми
                    setBehindScenesFiles([...behindScenesFiles, ...urls])
                  }}
                  onRemove={(url) => setBehindScenesFiles(behindScenesFiles.filter(i => i !== url))}
                />
              </div>
              
              {/* Или введите URL вручную */}
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Или введите URL изображений вручную:</p>
                <ArrayInput
                  label=""
                  value={behindScenes}
                  onChange={setBehindScenes}
                  placeholder="URL изображения за кадром"
                />
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Всего загружено: {behindScenes.length + behindScenesFiles.length} изображений
              </p>
            </div>
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

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Мультиязычность</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title_ru"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название (RU)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Русское название" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название (EN)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="English title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="description_ru"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание (RU)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Русское описание" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание (EN)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="English description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Дополнительно</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Год проекта</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="2025"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Показать на главной странице</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Отображается в carousel на главной странице
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Дополнительная информация</h3>
            
            <ArrayInput
              label="Инструменты"
              value={tools}
              onChange={setTools}
              placeholder="Добавить инструмент (например: After Effects, Cinema 4D)"
            />
          </div>

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
