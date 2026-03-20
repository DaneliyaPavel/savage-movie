import type { Metadata } from 'next'
import ServicesPageClient from './client'

export const metadata: Metadata = {
  title: 'Услуги — видеопродакшн, AI-генерация, клипы | Savage Movie СПб',
  description:
    'Услуги Savage Movie: рекламные ролики, музыкальные клипы, AI-генерация видео, корпоративное видео, контент для соцсетей. Студия в Санкт-Петербурге, работаем по всей России.',
  alternates: {
    canonical: '/services',
  },
}

export default function ServicesPage() {
  return <ServicesPageClient />
}
