import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Забронировать консультацию | SAVAGE MOVIE',
  description:
    'Выберите удобное время для консультации: съемка, продакшн, обучение. Запись через Calendly.',
}

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children
}
