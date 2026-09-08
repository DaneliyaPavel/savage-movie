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
  let blogPosts: SitemapItem[] = []

  try {
    ;[projects, courses, blogPosts] = await Promise.all([
      apiGet<SitemapItem[]>('/api/sitemap/projects'),
      apiGet<SitemapItem[]>('/api/sitemap/courses'),
      apiGet<SitemapItem[]>('/api/sitemap/blog'),
    ])
  } catch (error) {
    console.warn('Ошибка загрузки данных для sitemap:', error)
  }

  /*
   * У статических страниц нет lastModified. Раньше здесь стоял new Date(), и
   * sitemap на каждой генерации заявлял, что «Политика», «О студии» и
   * «Контакты» изменились только что. Достоверной даты правки у этих
   * маршрутов нет, а выдуманная — это шум для планировщика обхода, поэтому
   * поле просто отсутствует. У проектов, курсов и блога ниже дата настоящая,
   * из updated_at, и остаётся на месте.
   */
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/projects`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/courses`,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      // Коммерческая посадочная под кластер рекламного видеопроизводства.
      // Приоритет выше раздела услуг: это точка приземления платного трафика.
      url: `${baseUrl}/reklamny-rolik`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/clients`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/booking`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  const projectPages: MetadataRoute.Sitemap = projects.map(project => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: new Date(project.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const coursePages: MetadataRoute.Sitemap = courses.map(course => ({
    url: `${baseUrl}/courses/${course.slug}`,
    lastModified: new Date(course.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const blogPages: MetadataRoute.Sitemap = blogPosts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...projectPages, ...coursePages, ...blogPages]
}
