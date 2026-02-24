import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Контакты | SAVAGE MOVIE — обсудить проект',
  description:
    'Свяжитесь с Savage Movie для обсуждения видеопроекта: реклама, клипы, обучение. Форма заявки и контакты.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
