import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Обсудить проект — Savage Movie | Видеопродакшн СПб',
  description:
    'Оставьте заявку на бесплатный созвон: обсудим ваш видеопроект, бюджет и сроки. Одно поле — телефон или Telegram.',
  alternates: {
    canonical: '/booking',
  },
}

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children
}
