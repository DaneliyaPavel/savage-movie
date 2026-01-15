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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload } from '@/components/admin/FileUpload'
import { ArrayInput } from '@/components/admin/ArrayInput'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { createCourse, type CourseCreate } from '@/lib/api/courses'
import Link from 'next/link'

const formSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  duration: z.number().optional(),
  cover_image: z.string().optional(),
  video_promo_url: z.string().url().optional().or(z.literal('')),
  category: z.enum(['ai', 'shooting', 'editing', 'production']),
})

export default function NewCoursePage() {
  const router = useRouter()
  const [requirements, setRequirements] = useState<string[]>([])
  const [whatYouLearn, setWhatYouLearn] = useState<string[]>([])
  const [coverImage, setCoverImage] = useState<string>('')
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
    },
  })

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
      }
      await createCourse(courseData)
      router.push('/admin/courses')
    } catch (error) {
      console.error('Ошибка создания курса:', error)
      alert('Ошибка создания курса')
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
            { label: 'Создать курс' }
          ]} 
          className="mb-4"
        />
        <BackButton href="/admin/courses" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">Создать курс</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Название</FormLabel>
              <FormControl>
                <Input {...field} onChange={(e) => {
                  field.onChange(e)
                  if (!form.getValues('slug')) form.setValue('slug', generateSlug(e.target.value))
                }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="slug" render={({ field }) => (
            <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Описание</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem>
                <FormLabel>Цена (₽)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Категория</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="ai">ИИ</SelectItem>
                    <SelectItem value="shooting">Съемка</SelectItem>
                    <SelectItem value="editing">Монтаж</SelectItem>
                    <SelectItem value="production">Продюсирование</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Обложка</label>
            <FileUpload type="image" existingFiles={coverImage ? [coverImage] : []} onUpload={setCoverImage} onRemove={() => setCoverImage('')} />
          </div>

          <FormField control={form.control} name="video_promo_url" render={({ field }) => (
            <FormItem><FormLabel>URL промо видео</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />

          <ArrayInput label="Требования" value={requirements} onChange={setRequirements} />
          <ArrayInput label="Чему научитесь" value={whatYouLearn} onChange={setWhatYouLearn} />

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Создание...' : 'Создать'}</Button>
            <Link href="/admin/courses"><Button type="button" variant="outline">Отмена</Button></Link>
          </div>
        </form>
      </Form>
    </div>
  )
}
