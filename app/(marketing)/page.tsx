/**
 * Главная страница в стиле The Up&Up Group
 */
import { HeroSection } from '@/components/sections/HeroSection'
import { ClientsSection } from '@/components/sections/ClientsSection'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { ProjectsGrid } from '@/components/sections/ProjectsGrid'
import { NewsletterSection } from '@/components/sections/NewsletterSection'
import { CTASection } from '@/components/sections/CTASection'
import { getProjects } from '@/lib/api/projects'
import type { Project } from '@/lib/api/projects'

export default async function HomePage() {
  // Загружаем проекты из API
  let projects: Project[] = []
  
  try {
    const allProjects = await getProjects()
    projects = allProjects.slice(0, 6) // Берем первые 6
  } catch (error) {
    // Если API не настроен, просто показываем пустой список
    console.warn('API не настроен или произошла ошибка:', error)
  }

  return (
    <>
      <HeroSection />
      <ClientsSection />
      <ServicesSection />
      <ProjectsGrid projects={projects} />
      <NewsletterSection />
      <CTASection />
    </>
  )
}
