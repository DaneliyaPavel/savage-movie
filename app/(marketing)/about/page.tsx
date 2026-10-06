/**
 * Страница «О студии» — единственная страница о Savage Movie (бывший /studio).
 *
 * Серверный компонент: заголовки, копия, FAQ, цифры портфолио и JSON-LD уходят
 * в HTML первого ответа. Композиция — components/sections/about.
 */
import type { Metadata } from 'next'

import { AboutPage } from '@/components/sections/about/about-page'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { loadAboutData } from '@/lib/about/load'
import { ABOUT_PATH } from '@/lib/about/content'
import { aboutJsonLd, aboutMetadata } from '@/lib/about/seo'

/** Цифры, работы и команда собираются из CMS: обновляем раз в час, как /services */
export const revalidate = 3600

export const metadata: Metadata = {
  ...aboutMetadata(),
  alternates: { canonical: ABOUT_PATH },
}

export default async function Page() {
  const data = await loadAboutData()

  return (
    <>
      <JsonLdScripts scripts={aboutJsonLd()} />
      <AboutPage data={data} />
    </>
  )
}
