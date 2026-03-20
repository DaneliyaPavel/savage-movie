import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Курсы по AI-генерации видео и видеопродакшну — Savage Movie',
  description:
    'Обучение AI-генерации видео (Sora, Runway, Kling), съёмке и монтажу. Онлайн и офлайн курсы от практиков. Записаться →',
  alternates: {
    canonical: '/courses',
  },
}

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children
}
