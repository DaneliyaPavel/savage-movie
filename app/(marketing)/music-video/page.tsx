/**
 * Страница направления «Музыкальные клипы».
 *
 * Серверный компонент: заголовки, копия, FAQ и разметка уходят в HTML первого
 * ответа, кадры собираются из опубликованных работ портфолио. Композиция
 * страницы своя, не копия /reklamny-rolik (см. комментарий в directions.ts).
 */
import type { Metadata } from 'next'

import { MusicPage } from '@/components/sections/direction/pages/music-page'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { MUSIC_PAGE } from '@/lib/services/pages/content/music'
import { directionPath } from '@/lib/services/pages'
import { loadDirectionWorks } from '@/lib/services/pages/load'
import { directionJsonLd, directionMetadata } from '@/lib/services/pages/seo'

/** Кадры и подписи собираются из портфолио: обновляем раз в час, как /services */
export const revalidate = 3600

export const metadata: Metadata = {
  ...directionMetadata(MUSIC_PAGE),
  alternates: { canonical: directionPath('music') },
}

export default async function Page() {
  const works = await loadDirectionWorks('music')

  return (
    <>
      <JsonLdScripts scripts={directionJsonLd(MUSIC_PAGE, 'Музыкальные клипы')} />
      <MusicPage works={works} />
    </>
  )
}
