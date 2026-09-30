/**
 * Страница направления «Beauty и предметная съёмка».
 *
 * Серверный компонент: заголовки, копия, FAQ и разметка уходят в HTML первого
 * ответа, кадры собираются из опубликованных работ портфолио. Композиция
 * страницы своя, не копия /reklamny-rolik (см. комментарий в directions.ts).
 */
import type { Metadata } from 'next'

import { BeautyPage } from '@/components/sections/direction/pages/beauty-page'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { BEAUTY_PAGE } from '@/lib/services/pages/content/beauty'
import { directionPath } from '@/lib/services/pages'
import { loadDirectionWorks } from '@/lib/services/pages/load'
import { directionJsonLd, directionMetadata } from '@/lib/services/pages/seo'

/** Кадры и подписи собираются из портфолио: обновляем раз в час, как /services */
export const revalidate = 3600

export const metadata: Metadata = {
  ...directionMetadata(BEAUTY_PAGE),
  alternates: { canonical: directionPath('beauty') },
}

export default async function Page() {
  const works = await loadDirectionWorks('beauty')

  return (
    <>
      <JsonLdScripts scripts={directionJsonLd(BEAUTY_PAGE, 'Beauty и предметная съёмка')} />
      <BeautyPage works={works} />
    </>
  )
}
