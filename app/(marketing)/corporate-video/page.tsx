/**
 * Страница направления «Корпоративное видео».
 *
 * Серверный компонент: заголовки, копия, FAQ и разметка уходят в HTML первого
 * ответа, кадры собираются из опубликованных работ портфолио. Композиция
 * страницы своя, не копия /reklamny-rolik (см. комментарий в directions.ts).
 */
import type { Metadata } from 'next'

import { CorporatePage } from '@/components/sections/direction/pages/corporate-page'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { CORPORATE_PAGE } from '@/lib/services/pages/content/corporate'
import { directionPath } from '@/lib/services/pages'
import { loadDirectionWorks } from '@/lib/services/pages/load'
import { directionJsonLd, directionMetadata } from '@/lib/services/pages/seo'

/** Кадры и подписи собираются из портфолио: обновляем раз в час, как /services */
export const revalidate = 3600

export const metadata: Metadata = {
  ...directionMetadata(CORPORATE_PAGE),
  alternates: { canonical: directionPath('corporate') },
}

export default async function Page() {
  const works = await loadDirectionWorks('corporate')

  return (
    <>
      <JsonLdScripts scripts={directionJsonLd(CORPORATE_PAGE, 'Корпоративное видео')} />
      <CorporatePage works={works} />
    </>
  )
}
