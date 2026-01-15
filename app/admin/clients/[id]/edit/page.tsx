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
import { FileUpload } from '@/components/admin/FileUpload'
import { getClients, updateClient } from '@/lib/api/clients'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const formSchema = z.object({ name: z.string().min(1), description: z.string().optional(), order: z.number().default(0) })

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const [logoUrl, setLogoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues: { name: '', description: '', order: 0 } })

  useEffect(() => {
    const load = async () => {
      try {
        const clients = await getClients()
        const client = clients.find(c => c.id === clientId)
        if (client) {
          form.reset({ name: client.name, description: client.description || '', order: client.order })
          setLogoUrl(client.logo_url || '')
        }
      } catch (error) {
        console.error('Ошибка загрузки клиента:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [clientId])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      await updateClient(clientId, { ...values, logo_url: logoUrl || null })
      router.push('/admin/clients')
    } catch (error) {
      alert('Ошибка обновления клиента')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-8">Загрузка...</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/clients"><Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Назад</Button></Link>
        <h1 className="text-3xl font-bold mb-2">Редактировать клиента</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Название</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Описание</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="order" render={({ field }) => <FormItem><FormLabel>Порядок</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>} />
          <div><label className="text-sm font-medium mb-2 block">Логотип</label><FileUpload type="image" existingFiles={logoUrl ? [logoUrl] : []} onUpload={setLogoUrl} onRemove={() => setLogoUrl('')} /></div>
          <div className="flex gap-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Сохранение...' : 'Сохранить'}</Button><Link href="/admin/clients"><Button type="button" variant="outline">Отмена</Button></Link></div>
        </form>
      </Form>
    </div>
  )
}
