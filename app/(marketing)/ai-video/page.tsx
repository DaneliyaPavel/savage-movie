/**
 * Страница направления «AI-видео».
 *
 * Серверный компонент: заголовки, копия, FAQ и разметка уходят в HTML первого
 * ответа, кадры собираются из опубликованных работ портфолио. Композиция
 * страницы своя, не копия /reklamny-rolik (см. комментарий в directions.ts).
 */
import type { Metadata } from 'next'

import { AiPage } from '@/components/sections/direction/pages/ai-page'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { AI_PAGE } from '@/lib/services/pages/content/ai'
import { directionPath } from '@/lib/services/pages'
import { loadDirectionWorks } from '@/lib/services/pages/load'
import { directionJsonLd, directionMetadata } from '@/lib/services/pages/seo'

/** Кадры и подписи собираются из портфолио: обновляем раз в час, как /services */
export const revalidate = 3600

export const metadata: Metadata = {
  ...directionMetadata(AI_PAGE),
  alternates: { canonical: directionPath('ai') },
}

export default async function Page() {
  const works = await loadDirectionWorks('ai')

  return (
    <>
      <JsonLdScripts scripts={directionJsonLd(AI_PAGE, 'AI-видео')} />
      <AiPage works={works} />
    </>
  )
}
