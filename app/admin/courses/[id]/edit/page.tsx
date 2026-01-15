/**
 * Страница редактирования курса
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileUpload } from '@/components/admin/FileUpload'
import { ArrayInput } from '@/components/admin/ArrayInput'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { getCourses, updateCourse, type CourseUpdate } from '@/lib/api/courses'
import Link from 'next/link'

const formSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  duration: z.number().optional(),
  video_promo_url: z.string().url().optional().or(z.literal('')),
  category: z.enum(['ai', 'shooting', 'editing', 'production']),
})

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const [requirements, setRequirements] = useState<string[]>([])
  const [whatYouLearn, setWhatYouLearn] = useState<string[]>([])
  const [coverImage, setCoverImage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      price: 0,
      duration: undefined,
      video_promo_url: '',
      category: 'ai',
    },
  })

  useEffect(() => {
    loadCourse()
  }, [courseId])

  const loadCourse = async () => {
    try {
      const courses = await getCourses()
      const course = courses.find(c => c.id === courseId)
      if (course) {
        form.reset({
          title: course.title,
          slug: course.slug,
          description: course.description || '',
          price: course.price,
          duration: course.duration || undefined,
          video_promo_url: course.video_promo_url || '',
          category: course.category,
        })
        setCoverImage(course.cover_image || '')
        setRequirements(course.requirements || [])
        setWhatYouLearn(course.what_you_learn || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки курса:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const courseData: CourseUpdate = {
        ...values,
        description: values.description || null,
        cover_image: coverImage || null,
        video_promo_url: values.video_promo_url || null,
        requirements: requirements.length > 0 ? requirements : null,
        what_you_learn: whatYouLearn.length > 0 ? whatYouLearn : null,
      }
      await updateCourse(courseId, courseData)
      router.push('/admin/courses')
    } catch (error) {
      console.error('Ошибка обновления курса:', error)
      alert('Ошибка обновления курса')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-8">Загрузка...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Breadcrumbs 
          items={[
            { label: 'Админ-панель', href: '/admin' },
            { label: 'Курсы', href: '/admin/courses' },
            { label: 'Редактировать курс' }
          ]} 
          className="mb-4"
        />
        <BackButton href="/admin/courses" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">Редактировать курс</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Название</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                  <Input type="number" {...field} value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Категория</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button>
            <Link href="/admin/courses"><Button type="button" variant="outline">Отмена</Button></Link>
          </div>
        </form>
      </Form>
    </div>
  )
}
