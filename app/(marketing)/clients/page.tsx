/**
 * /clients — страница брендов Savage Movie.
 *
 * Данные собираются из опубликованных проектов и CMS-записей клиентов
 * (см. features/clients/mappers.ts). Таблица `clients` на проде пустая, поэтому
 * страница, построенная только на ней, показывала пустой экран при 19 живых
 * работах — это чинилось на уровне данных, а не хардкодом списка в вёрстке.
 */
import type { Metadata } from 'next'
import { loadClientRollData } from '@/features/clients/api'
import { indexProjectsBySlug, pickStill } from '@/features/clients/mappers'
import { CAPABILITY_TASKS, COLLABORATIONS } from '@/features/clients/content'
import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { ClientsHero } from '@/components/sections/clients/clients-hero'
import { ClientRoll } from '@/components/sections/clients/client-roll'
import {
  SelectedCollaborations,
  type CollaborationItem,
} from '@/components/sections/clients/selected-collaborations'
import {
  CapabilityIndex,
  type CapabilityEntry,
} from '@/components/sections/clients/capability-index'
import { EntryPoints } from '@/components/sections/clients/entry-points'
import { ClientsCta } from '@/components/sections/clients/clients-cta'
import { ClientsPageShell } from './client'

export const revalidate = 60

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'

const metaDescription =
  'Бренды, для которых снимал Savage Movie: ZARINA, Wellery, Diesel, Biotherm, Совкомбанк и другие. Кейсы рекламных и имиджевых роликов с кадрами из работ.'

export const metadata: Metadata = {
  title: 'Клиенты Savage Movie — бренды в портфолио студии',
  description: metaDescription,
  alternates: {
    canonical: '/clients',
  },
  openGraph: {
    title: 'Клиенты Savage Movie — бренды в портфолио студии',
    description: metaDescription,
    url: `${baseUrl}/clients`,
  },
}

export default async function ClientsPage() {
  const { entries, brandCount, projectCount, yearRange, projects } = await loadClientRollData()
  const bySlug = indexProjectsBySlug(projects)

  // Кейс показывается, только если проект всё ещё опубликован в CMS
  const collaborationItems: CollaborationItem[] = COLLABORATIONS.flatMap(collaboration => {
    const project = bySlug.get(collaboration.slug)
    if (!project) return []
    return [{ collaboration, project, still: pickStill(project) }]
  })

  // Тип задачи остаётся в списке, только если за ним стоит хотя бы один проект
  const capabilityEntries: CapabilityEntry[] = CAPABILITY_TASKS.flatMap(task => {
    const linked = task.slugs.flatMap(slug => {
      const project = bySlug.get(slug)
      if (!project) return []
      return [
        {
          slug: project.slug,
          title: project.title,
          client: project.client,
          still: pickStill(project),
        },
      ]
    })
    if (linked.length === 0) return []
    return [{ task, projects: linked }]
  })

  const breadcrumbJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Клиенты', item: `${baseUrl}/clients` },
    ],
  })

  return (
    <>
      {/* JSON-LD рендерится вне клиентской оболочки: <script> внутри клиентского
          дерева React не выполняет и ломает гидрацию */}
      <JsonLdScripts scripts={[breadcrumbJsonLd]} />
      <ClientsPageShell>
        <ClientsHero
          brandCount={brandCount}
          projectCount={projectCount}
          leader={entries
            .filter(entry => entry.primary?.still)
            .slice(0, 4)
            .map(entry => ({
              id: entry.id,
              still: entry.primary?.still ?? '',
              name: entry.name,
            }))}
        />
        <ClientRoll entries={entries} yearRange={yearRange} />
        <SelectedCollaborations items={collaborationItems} />
        <CapabilityIndex entries={capabilityEntries} />
        <EntryPoints />
        <ClientsCta nextIndex={brandCount + 1} />
      </ClientsPageShell>
    </>
  )
}
