/**
 * Страница направления «Регулярный продакшн».
 *
 * Серверный компонент: заголовки, копия, FAQ и разметка уходят в HTML первого
 * ответа, кадры собираются из опубликованных работ портфолио. Композиция
 * страницы своя, не копия /reklamny-rolik (см. комментарий в directions.ts).
 */
import type { Metadata } from 'next'

import { ContentPage } from '@/components/sections/direction/pages/content-page'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { CONTENT_PAGE } from '@/lib/services/pages/content/content-production'
import { directionPath } from '@/lib/services/pages'
import { loadDirectionWorks } from '@/lib/services/pages/load'
import { directionJsonLd, directionMetadata } from '@/lib/services/pages/seo'

/** Кадры и подписи собираются из портфолио: обновляем раз в час, как /services */
export const revalidate = 3600

export const metadata: Metadata = {
  ...directionMetadata(CONTENT_PAGE),
  alternates: { canonical: directionPath('content-production') },
}

export default async function Page() {
  const works = await loadDirectionWorks('content-production')

  return (
    <>
      <JsonLdScripts scripts={directionJsonLd(CONTENT_PAGE, 'Регулярный продакшн')} />
      <ContentPage works={works} />
    </>
  )
}
