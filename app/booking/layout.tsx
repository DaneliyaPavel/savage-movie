import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Бесплатная консультация — Savage Movie | Видеопродакшн СПб',
  description:
    'Запишитесь на бесплатную консультацию: обсудим ваш видеопроект, бюджет и сроки. Выберите удобное время.',
  alternates: {
    canonical: '/booking',
  },
}

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children
}
