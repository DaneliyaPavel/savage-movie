'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { getSettings, updateSettings } from '@/lib/api/settings'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  hero_video_url: z.string().url().optional().or(z.literal('')),
  hero_video_playback_id: z.string().optional(),
  stats_projects: z.string(),
  stats_clients: z.string(),
  stats_years: z.string(),
})

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hero_video_url: '',
      hero_video_playback_id: '',
      stats_projects: '100',
      stats_clients: '50',
      stats_years: '15',
    },
  })

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await getSettings()
        form.reset({
          hero_video_url: settings.hero_video_url || '',
          hero_video_playback_id: settings.hero_video_playback_id || '',
          stats_projects: String(settings.stats_projects || '100'),
          stats_clients: String(settings.stats_clients || '50'),
          stats_years: String(settings.stats_years || '15'),
        })
      } catch (error) {
        console.error('Ошибка загрузки настроек:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      await updateSettings({
        hero_video_url: values.hero_video_url || null,
        hero_video_playback_id: values.hero_video_playback_id || null,
        stats_projects: values.stats_projects,
        stats_clients: values.stats_clients,
        stats_years: values.stats_years,
      })
      alert('Настройки сохранены!')
    } catch (error) {
      alert('Ошибка сохранения настроек')
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
            { label: 'Настройки' }
          ]} 
          className="mb-4"
        />
        <BackButton href="/admin" className="mb-4" />
        <h1 className="text-3xl font-bold mb-2">Настройки сайта</h1>
        <p className="text-muted-foreground">Управление настройками главной страницы</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Hero секция</h2>
            <FormField control={form.control} name="hero_video_url" render={({ field }) => (
              <FormItem><FormLabel>URL видео для Hero</FormLabel><FormControl><Input {...field} placeholder="https://example.com/video.mp4" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="hero_video_playback_id" render={({ field }) => (
              <FormItem><FormLabel>Mux Playback ID для Hero</FormLabel><FormControl><Input {...field} placeholder="Или используйте Mux ID" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Статистика</h2>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="stats_projects" render={({ field }) => (
                <FormItem><FormLabel>Проектов</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="stats_clients" render={({ field }) => (
                <FormItem><FormLabel>Клиентов</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="stats_years" render={({ field }) => (
                <FormItem><FormLabel>Лет опыта</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</> : 'Сохранить настройки'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
