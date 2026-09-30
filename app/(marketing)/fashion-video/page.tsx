/**
 * Страница направления «Fashion-видео».
 *
 * Серверный компонент: заголовки, копия, FAQ и разметка уходят в HTML первого
 * ответа, кадры собираются из опубликованных работ портфолио. Композиция
 * страницы своя, не копия /reklamny-rolik (см. комментарий в directions.ts).
 */
import type { Metadata } from 'next'

import { FashionPage } from '@/components/sections/direction/pages/fashion-page'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { FASHION_PAGE } from '@/lib/services/pages/content/fashion'
import { directionPath } from '@/lib/services/pages'
import { loadDirectionWorks } from '@/lib/services/pages/load'
import { directionJsonLd, directionMetadata } from '@/lib/services/pages/seo'

/** Кадры и подписи собираются из портфолио: обновляем раз в час, как /services */
export const revalidate = 3600

export const metadata: Metadata = {
  ...directionMetadata(FASHION_PAGE),
  alternates: { canonical: directionPath('fashion') },
}

export default async function Page() {
  const works = await loadDirectionWorks('fashion')

  return (
    <>
      <JsonLdScripts scripts={directionJsonLd(FASHION_PAGE, 'Fashion-видео')} />
      <FashionPage works={works} />
    </>
  )
}
