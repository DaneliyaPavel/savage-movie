/**
 * Главная страница в премиум стиле Freshman.tv
 */
import { ClientsSection } from '@/components/sections/ClientsSection'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { FeaturedProjects } from '@/components/sections/FeaturedProjects'
import { AboutTeaser } from '@/components/sections/AboutTeaser'
import { getProjects } from '@/lib/api/projects'
import type { Project } from '@/lib/api/projects'
import { HeroSectionClient } from '@/components/sections/HeroSectionClient'

export default async function HomePage() {
  // Загружаем проекты из API
  let projects: Project[] = []
  
  try {
    const allProjects = await getProjects()
    projects = allProjects.slice(0, 6) // Берем первые 6
  } catch (error) {
    console.warn('API не настроен или произошла ошибка:', error)
  }

  return (
    <>
      <HeroSectionClient />
      <FeaturedProjects projects={projects} />
      <ServicesSection />
      <ClientsSection />
      <AboutTeaser />
    </>
  )
}
