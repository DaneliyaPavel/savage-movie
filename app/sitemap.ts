/**
 * Динамическая генерация sitemap.xml
 */
import { MetadataRoute } from 'next'
import { apiGet } from '@/lib/api/server'

interface SitemapItem {
  slug: string
  updated_at: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'
  
  // Загружаем проекты и курсы для sitemap из API
  let projects: SitemapItem[] = []
  let courses: SitemapItem[] = []
  
  try {
    [projects, courses] = await Promise.all([
      apiGet<SitemapItem[]>('/api/sitemap/projects'),
      apiGet<SitemapItem[]>('/api/sitemap/courses'),
    ])
  } catch (error) {
    console.warn('Ошибка загрузки данных для sitemap:', error)
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: new Date(project.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const coursePages: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${baseUrl}/courses/${course.slug}`,
    lastModified: new Date(course.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...projectPages, ...coursePages]
}
