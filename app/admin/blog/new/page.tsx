'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
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
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { createBlogPost } from '@/lib/api/blog'
import { slugify } from '@/lib/utils/slugify'

const formSchema = z.object({
  title: z.string().min(1, 'Введите заголовок'),
  slug: z.string().min(1, 'Укажите slug'),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  reading_time: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'published']),
})

type FormValues = z.infer<typeof formSchema>

export default function NewBlogPostPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      category: '',
      author: '',
      reading_time: '',
      content: '',
      status: 'draft',
    },
  })

  const normalize = (value?: string) => (value && value.trim() ? value.trim() : null)

  const handleGenerateSlug = () => {
    const title = form.getValues('title')
    if (!title) return
    form.setValue('slug', slugify(title), { shouldValidate: true })
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      await createBlogPost({
        title: values.title.trim(),
        slug: values.slug.trim(),
        excerpt: normalize(values.excerpt),
        category: normalize(values.category),
        author: normalize(values.author),
        reading_time: normalize(values.reading_time),
        content: normalize(values.content),
        is_published: values.status === 'published',
      })
      router.push('/admin/blog')
    } catch {
      alert('Ошибка создания статьи')
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
            { label: 'Блог', href: '/admin/blog' },
            { label: 'Новая статья' },
          ]}
          className="mb-4"
        />
        <BackButton href="/admin/blog" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">Новая статья</h1>
        <p className="text-muted-foreground">
          Заполните данные статьи и опубликуйте, когда всё готово.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Заголовок</FormLabel>
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
                <div className="flex items-center justify-between gap-3">
                  <FormLabel>Slug</FormLabel>
                  <Button type="button" variant="ghost" size="sm" onClick={handleGenerateSlug}>
                    Сгенерировать
                  </Button>
                </div>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Используйте латиницу, цифры и дефисы. Можно редактировать вручную.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Например: Продакшн" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Автор</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Savage Movie" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="reading_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Время чтения</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Например: 5 мин" />
                  </FormControl>
                  <FormDescription>Если оставить пустым, будет рассчитано автоматически.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Статус публикации</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите статус" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="published">Опубликовано</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="excerpt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Краткое описание</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Текст статьи (Markdown)</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={12} />
                </FormControl>
                <FormDescription>
                  Поддерживаются заголовки, списки и выделение текста.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Создание...' : 'Создать'}
            </Button>
            <Link href="/admin/blog">
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
