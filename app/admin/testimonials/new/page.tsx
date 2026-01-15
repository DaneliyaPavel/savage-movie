'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { createTestimonial } from '@/lib/api/testimonials'
import Link from 'next/link'

const formSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  project_type: z.string().optional(),
  text: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  video_url: z.string().url().optional().or(z.literal('')),
  video_playback_id: z.string().optional(),
  order: z.number().default(0),
})

export default function NewTestimonialPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { name: '', company: '', project_type: '', text: '', rating: 5, video_url: '', video_playback_id: '', order: 0 } })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      await createTestimonial({ ...values, video_url: values.video_url || null, video_playback_id: values.video_playback_id || null })
      router.push('/admin/testimonials')
    } catch (error) {
      alert('Ошибка создания отзыва')
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
            { label: 'Отзывы', href: '/admin/testimonials' },
            { label: 'Создать отзыв' }
          ]} 
          className="mb-4"
        />
        <BackButton href="/admin/testimonials" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">Создать отзыв</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Имя</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="company" render={({ field }) => <FormItem><FormLabel>Компания</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="project_type" render={({ field }) => <FormItem><FormLabel>Тип проекта</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="text" render={({ field }) => <FormItem><FormLabel>Текст отзыва</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="rating" render={({ field }) => <FormItem><FormLabel>Рейтинг (1-5)</FormLabel><FormControl><Input type="number" min="1" max="5" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 5)} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="order" render={({ field }) => <FormItem><FormLabel>Порядок</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>} />
          </div>
          <FormField control={form.control} name="video_url" render={({ field }) => <FormItem><FormLabel>URL видео</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="video_playback_id" render={({ field }) => <FormItem><FormLabel>Mux Playback ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <div className="flex gap-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Создание...' : 'Создать'}</Button><Link href="/admin/testimonials"><Button type="button" variant="outline">Отмена</Button></Link></div>
        </form>
      </Form>
    </div>
  )
}
