import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Студия | SAVAGE MOVIE — команда и ценности',
  description:
    'Команда Savage Movie: кто мы, как работаем. Видеопродакшн полного цикла, от идеи до релиза.',
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children
}
