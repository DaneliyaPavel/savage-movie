import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Контакты Savage Movie — видеопродакшн СПб | Заказать съёмку',
  description:
    'Обсудить видеопроект: рекламные ролики, клипы, AI-видео. Студия в Санкт-Петербурге. Телефон, email, форма заявки.',
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
