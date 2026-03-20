/**
 * Страница "О нас" — единственная страница о студии (бывший /studio)
 */
import type { Metadata } from 'next'
import StudioPage from './client'

export const metadata: Metadata = {
  title: 'О студии Savage Movie — видеопродакшн в Санкт-Петербурге',
  description:
    'Savage Movie — продакшн-студия полного цикла в СПб. Команда, ценности, подход к работе. Реклама, клипы, AI-видео для брендов и артистов.',
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return <StudioPage />
}
