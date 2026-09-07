/**
 * 404.
 *
 * Живёт вне группы (marketing), поэтому не получает её layout — провайдеры
 * подключаются здесь явно. Без них страница отдавала бы дефолтный экран
 * Next.js: белый фон, английский текст и ни одного выхода обратно на сайт.
 *
 * Ссылка снятого с публикации проекта или опечатка в рекламной ссылке не
 * должны выглядеть как поломка: человек попадает на страницу Savage Movie с
 * рабочей навигацией и двумя очевидными продолжениями.
 */
import type { Metadata } from 'next'
import { NotFoundContent } from './not-found-client'

export const metadata: Metadata = {
  title: 'Страница не найдена — Savage Movie',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return <NotFoundContent />
}
