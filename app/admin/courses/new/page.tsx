/**
 * Страница создания курса
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { createCourse, type CourseCreate, type CardCoverSettings } from '@/features/courses/api'
import Link from 'next/link'

const DEFAULT_COVER: CardCoverSettings = {
  preset: 'meshGrid',
  accent1: '#3b82f6',
  accent2: '#8b5cf6',
  accent3: '#ec4899',
  show_grid: true,
  show_noise: true,
  show_scanlines: false,
  show_orbs: true,
  show_frame_corners: false,
  show_play_icon: false,
  overlay_strength: 'medium',
  media_type: 'image',
  no_overlay: false,
}

const formSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  duration: z.number().optional(),
  cover_image: z.string().optional(),
  video_promo_url: z.string().url().optional().or(z.literal('')),
  category: z.enum(['ai', 'shooting', 'editing', 'production']),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  certificate: z.enum(['yes', 'no']).optional(),
  format: z.enum(['online', 'offline', 'hybrid', 'online+live']).optional(),
})

export default function NewCoursePage() {
  const router = useRouter()
  const [requirements, setRequirements] = useState<string[]>([])
  const [whatYouLearn, setWhatYouLearn] = useState<string[]>([])
  const [coverImage, setCoverImage] = useState<string>('')
  const [shortDescription, setShortDescription] = useState<string>('')
  const [durationText, setDurationText] = useState<string>('')
  const [locationText, setLocationText] = useState<string>('')
  const [scheduleText, setScheduleText] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [badgeText, setBadgeText] = useState<string>('')
  const [ctaText, setCtaText] = useState<string>('')
  const [cardCover, setCardCover] = useState<CardCoverSettings>({ ...DEFAULT_COVER })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      price: 0,
      duration: undefined,
      cover_image: '',
      video_promo_url: '',
      category: 'ai',
      level: undefined,
      certificate: undefined,
      format: undefined,
    },
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const courseData: CourseCreate = {
        ...values,
        description: values.description || null,
        cover_image: coverImage || null,
        video_promo_url: values.video_promo_url || null,
        requirements: requirements.length > 0 ? requirements : null,
        what_you_learn: whatYouLearn.length > 0 ? whatYouLearn : null,
        level: values.level || null,
        certificate: values.certificate || null,
        format: values.format || null,
        short_description: shortDescription || null,
        duration_text: durationText || null,
        location_text: locationText || null,
        schedule_text: scheduleText || null,
        tags: tags.length > 0 ? tags : null,
        badge_text: badgeText || null,
        cta_text: ctaText || null,
        card_cover: cardCover,
      }
      await createCourse(courseData)
      router.push('/admin/courses')
    } catch (error) {
      console.error('Ошибка создания курса:', error)
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания курса'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Breadcrumbs
          items={[
            { label: 'Админ-панель', href: '/admin' },
            { label: 'Курсы', href: '/admin/courses' },
            { label: 'Создать курс' },
          ]}
          className="mb-4"
        />
        <BackButton href="/admin/courses" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">Создать курс</h1>
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
                  <Input
                    {...field}
                    onChange={e => {
                      field.onChange(e)
                      if (!form.getValues('slug'))
                        form.setValue('slug', generateSlug(e.target.value))
                    }}
                  />
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
                <FormLabel>Slug</FormLabel>
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Цена (₽)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ai">ИИ</SelectItem>
                      <SelectItem value="shooting">Съемка</SelectItem>
                      <SelectItem value="editing">Монтаж</SelectItem>
                      <SelectItem value="production">Продюсирование</SelectItem>
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
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Продолжительность (недели)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || ''}
                      onChange={e =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Уровень сложности</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите уровень" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="beginner">Начальный</SelectItem>
                      <SelectItem value="intermediate">Средний</SelectItem>
                      <SelectItem value="advanced">Продвинутый</SelectItem>
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
              name="certificate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сертификат</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">Да</SelectItem>
                      <SelectItem value="no">Нет</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Формат обучения</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите формат" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="online">Онлайн</SelectItem>
                      <SelectItem value="offline">Офлайн</SelectItem>
                      <SelectItem value="hybrid">Гибридный</SelectItem>
                      <SelectItem value="online+live">Онлайн + живые сессии</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Карточка курса (листинг)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Краткое описание (1–2 строки)</label>
                <Textarea
                  placeholder="Для карточки на странице курсов"
                  value={shortDescription}
                  onChange={e => setShortDescription(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Длительность (текст)</label>
                <Input placeholder="6 недель, 2 дня" value={durationText} onChange={e => setDurationText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Локация (для офлайн)</label>
                <Input placeholder="Санкт-Петербург" value={locationText} onChange={e => setLocationText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Расписание (текст)</label>
                <Input placeholder="Старт 12 марта" value={scheduleText} onChange={e => setScheduleText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Бейдж на карточке</label>
                <Input placeholder="Онлайн, Офлайн" value={badgeText} onChange={e => setBadgeText(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Текст кнопки (CTA)</label>
                <Input placeholder="Подробнее" value={ctaText} onChange={e => setCtaText(e.target.value)} />
              </div>
            </div>
            <ArrayInput label="Теги (до 5)" value={tags} onChange={setTags} />
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">Оформление обложки карточки</h3>
            <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="checkbox"
                  checked={!!cardCover.no_overlay}
                  onChange={e =>
                    setCardCover(prev => ({ ...prev, no_overlay: e.target.checked }))
                  }
                  className="rounded border-border"
                />
                Без оформления (чистая обложка)
              </label>
              <p className="text-xs text-muted-foreground -mt-2">
                На карточке и на странице обучения будет только обложка или видео без оформления.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Цвет мигающего маркера (HEX)</label>
                <Input
                  type="text"
                  value={cardCover.badge_dot_color ?? ''}
                  onChange={e =>
                    setCardCover(prev => ({
                      ...prev,
                      badge_dot_color: e.target.value.trim() || undefined,
                    }))
                  }
                  placeholder="#00e5ff"
                  className="w-[140px] font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Цвет точки рядом с плашкой. Пусто — цвет по формату курса.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Обложка карточки</label>
                <Select
                  value={cardCover.media_type || 'image'}
                  onValueChange={v => setCardCover(prev => ({ ...prev, media_type: v as 'image' | 'video' }))}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Картинка</SelectItem>
                    <SelectItem value="video">Видео (промо-ролик)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Видео — из «URL промо видео». Картинка — из «Обложка курса».
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Пресет</label>
                <Select
                  value={cardCover.preset || 'meshGrid'}
                  onValueChange={v => {
                    const presets: Record<string, Partial<CardCoverSettings>> = {
                      mesh: { preset: 'mesh', show_grid: false, show_noise: true, show_scanlines: false, show_orbs: true, show_frame_corners: false, show_play_icon: false, overlay_strength: 'medium' },
                      meshGrid: { preset: 'meshGrid', show_grid: true, show_noise: true, show_scanlines: false, show_orbs: true, show_frame_corners: false, show_play_icon: false, overlay_strength: 'medium' },
                      meshGridScanlines: { preset: 'meshGridScanlines', show_grid: true, show_noise: true, show_scanlines: true, show_orbs: true, show_frame_corners: false, show_play_icon: true, overlay_strength: 'medium' },
                      minimalTech: { preset: 'minimalTech', show_grid: true, show_noise: false, show_scanlines: false, show_orbs: false, show_frame_corners: true, show_play_icon: false, overlay_strength: 'low' },
                    }
                    const preset = presets[v]
                    if (preset) setCardCover(prev => ({ ...prev, ...preset, accent1: prev.accent1, accent2: prev.accent2, accent3: prev.accent3 }))
                  }}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mesh">Mesh</SelectItem>
                    <SelectItem value="meshGrid">Mesh + Grid</SelectItem>
                    <SelectItem value="meshGridScanlines">Mesh + Grid + Scanlines</SelectItem>
                    <SelectItem value="minimalTech">Minimal Tech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Акцент 1 (HEX)</label>
                  <Input type="text" value={cardCover.accent1 || ''} onChange={e => setCardCover(prev => ({ ...prev, accent1: e.target.value || undefined }))} placeholder="#3b82f6" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Акцент 2</label>
                  <Input type="text" value={cardCover.accent2 || ''} onChange={e => setCardCover(prev => ({ ...prev, accent2: e.target.value || undefined }))} placeholder="#8b5cf6" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Акцент 3</label>
                  <Input type="text" value={cardCover.accent3 || ''} onChange={e => setCardCover(prev => ({ ...prev, accent3: e.target.value || undefined }))} placeholder="#ec4899" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Затемнение</label>
                <Select value={cardCover.overlay_strength || 'medium'} onValueChange={v => setCardCover(prev => ({ ...prev, overlay_strength: v as 'low' | 'medium' | 'high' }))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкое</SelectItem>
                    <SelectItem value="medium">Среднее</SelectItem>
                    <SelectItem value="high">Высокое</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'show_grid' as const, label: 'Сетка' },
                  { key: 'show_noise' as const, label: 'Шум' },
                  { key: 'show_scanlines' as const, label: 'Сканлайны' },
                  { key: 'show_orbs' as const, label: 'Орбы' },
                  { key: 'show_frame_corners' as const, label: 'Углы рамки' },
                  { key: 'show_play_icon' as const, label: 'Иконка Play' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={!!cardCover[key]} onChange={e => setCardCover(prev => ({ ...prev, [key]: e.target.checked }))} className="rounded border-border" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Медиа контент</h3>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
              <label className="text-sm font-medium mb-2 block">🖼️ Обложка курса</label>
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Где отображается:</strong> Карточка курса на странице{' '}
                <code className="text-xs bg-background px-1 py-0.5 rounded">/courses</code> и
                детальная страница курса
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                <strong>Что загружать:</strong> Главное изображение курса, постер, обложка.
                Рекомендуемый размер: 16:9.
              </p>
              <FileUpload
                type="image"
                existingFiles={coverImage ? [coverImage] : []}
                onUpload={setCoverImage}
                onRemove={() => setCoverImage('')}
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <FormField
                control={form.control}
                name="video_promo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL промо видео</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/promo.mp4 или Mux URL" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Где отображается:</strong> Hero секция на детальной странице курса{' '}
                      <code className="text-xs bg-background px-1 py-0.5 rounded">
                        /courses/[slug]
                      </code>
                    </p>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <ArrayInput label="Требования" value={requirements} onChange={setRequirements} />
          <ArrayInput label="Чему научитесь" value={whatYouLearn} onChange={setWhatYouLearn} />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создание...' : 'Создать'}
            </Button>
            <Link href="/admin/courses">
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
