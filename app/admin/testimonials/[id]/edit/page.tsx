'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { getTestimonials, updateTestimonial } from '@/lib/api/testimonials'
import Link from 'next/link'

const formSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  project_type: z.string().optional(),
  text: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  video_url: z.string().url().optional().or(z.literal('')),
  video_playback_id: z.string().optional(),
  order: z.number().int().min(0),
})

export default function EditTestimonialPage() {
  const router = useRouter()
  const params = useParams()
  const testimonialId = params.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { name: '', company: '', project_type: '', text: '', rating: 5, video_url: '', video_playback_id: '', order: 0 } })

  useEffect(() => {
    const load = async () => {
      try {
        const testimonials = await getTestimonials()
        const testimonial = testimonials.find(t => t.id === testimonialId)
        if (testimonial) {
          form.reset({ name: testimonial.name, company: testimonial.company || '', project_type: testimonial.project_type || '', text: testimonial.text || '', rating: testimonial.rating, video_url: testimonial.video_url || '', video_playback_id: testimonial.video_playback_id || '', order: testimonial.order })
        } else {
          setLoadError('Отзыв не найден.')
        }
      } catch (error) {
        // В production используйте логирование на сервере
        if (process.env.NODE_ENV === 'development') {
          console.error('Ошибка загрузки отзыва:', error)
        }
        setLoadError('Не удалось загрузить отзыв.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [testimonialId, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    setError(null)
    try {
      await updateTestimonial(testimonialId, { ...values, video_url: values.video_url || null, video_playback_id: values.video_playback_id || null })
      router.push('/admin/testimonials')
    } catch {
      setError('Ошибка обновления отзыва. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-8">Загрузка...</div>
  if (loadError) return <div className="p-8">{loadError}</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Breadcrumbs 
          items={[
            { label: 'Админ-панель', href: '/admin' },
            { label: 'Отзывы', href: '/admin/testimonials' },
            { label: 'Редактировать отзыв' }
          ]} 
          className="mb-4"
        />
        <BackButton href="/admin/testimonials" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">Редактировать отзыв</h1>
      </div>
      {error && (
        <div className="mb-4 p-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-auto p-0 text-red-500 hover:text-red-700"
            onClick={() => setError(null)}
            aria-label="Закрыть"
          >
            ✕
          </Button>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Имя</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="company" render={({ field }) => <FormItem><FormLabel>Компания</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="project_type" render={({ field }) => <FormItem><FormLabel>Тип проекта</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="text" render={({ field }) => <FormItem><FormLabel>Текст отзыва</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="rating" render={({ field }) => <FormItem><FormLabel>Рейтинг (1-5)</FormLabel><FormControl><Input type="number" min="1" max="5" {...field} value={field.value || ''} onChange={(e) => field.onChange(parseInt(e.target.value) || 5)} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="order" render={({ field }) => <FormItem><FormLabel>Порядок</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>} />
          </div>
          <FormField control={form.control} name="video_url" render={({ field }) => <FormItem><FormLabel>URL видео</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="video_playback_id" render={({ field }) => <FormItem><FormLabel>Mux Playback ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <div className="flex gap-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button><Link href="/admin/testimonials"><Button type="button" variant="outline">Отмена</Button></Link></div>
        </form>
      </Form>
    </div>
  )
}
