import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Курсы | SAVAGE MOVIE — обучение видеопродакшну и ИИ-генерации',
  description:
    'Онлайн и офлайн курсы: ИИ-генерация, съемка, монтаж, продакшн. Обучение от практиков Savage Movie.',
}

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children
}
