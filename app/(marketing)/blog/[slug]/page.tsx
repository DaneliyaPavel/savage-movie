import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { getBlogPostBySlugServer, getBlogPostsServer } from '@/lib/api/blog'
import { buildDescription, buildTitle, stripBrandTail } from '@/lib/seo/snippet'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import ArticleClient from './article-client'

export const dynamic = 'force-dynamic'

const SITE_NAME = 'SAVAGE MOVIE'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  let post = null
  try {
    post = await getBlogPostBySlugServer(slug)
  } catch {
    post = null
  }
  if (!post) return { title: SITE_NAME }

  const title = buildTitle(post.title)
  const description = post.excerpt
    ? buildDescription(post.excerpt)
    : 'Статья в блоге Savage Movie \u2014 видеопродакшн, ИИ-генерация, обучение.'

  const publishedTime = post.published_at || post.created_at
  const authorName = post.author || 'Savage Movie'

  return {
    title,
    description,
    // Self-canonical обязателен: без него маршрут наследует canonical родителя.
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/blog/${slug}`,
      publishedTime: publishedTime ?? undefined,
      authors: [authorName],
      ...(post.cover_image ? { images: [{ url: post.cover_image }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let post
  try {
    post = await getBlogPostBySlugServer(slug)
  } catch {
    post = null
  }
  if (!post) return notFound()

  // Fetch related posts (same category, excluding current)
  let relatedPosts: Awaited<ReturnType<typeof getBlogPostsServer>> = []
  try {
    const allPosts = await getBlogPostsServer(true)
    relatedPosts = allPosts
      .filter(p => p.slug !== slug)
      .filter(p => post.category ? p.category === post.category : true)
      .slice(0, 3)

    // If not enough from same category, fill with other posts
    if (relatedPosts.length < 3) {
      const morePostsNeeded = 3 - relatedPosts.length
      const relatedIds = new Set(relatedPosts.map(p => p.id))
      const otherPosts = allPosts
        .filter(p => p.slug !== slug && !relatedIds.has(p.id))
        .slice(0, morePostsNeeded)
      relatedPosts = [...relatedPosts, ...otherPosts]
    }
  } catch {
    relatedPosts = []
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://savagemovie.ru'
  const articleUrl = `${baseUrl}/blog/${slug}`
  const published = post.published_at || post.created_at
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: stripBrandTail(post.title),
    description: post.excerpt ?? undefined,
    url: articleUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    ...(post.cover_image ? { image: post.cover_image } : {}),
    datePublished: published ?? undefined,
    dateModified: post.updated_at ?? published ?? undefined,
    author: {
      '@type': 'Person',
      name: post.author || 'Savage Movie',
    },
    // Связь с Organization из корневого layout по @id, а не второй копией организации
    publisher: { '@id': `${baseUrl}/#organization` },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Блог', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: stripBrandTail(post.title), item: articleUrl },
    ],
  }

  return (
    <main className="min-h-screen bg-background">
      <JsonLdScripts scripts={[JSON.stringify(articleJsonLd), JSON.stringify(breadcrumbJsonLd)]} />
      <TopBar />
      <JalousieMenu />
      <ArticleClient
        post={{ ...post, title: stripBrandTail(post.title) }}
        relatedPosts={relatedPosts}
        articleUrl={articleUrl}
      />
    </main>
  )
}
