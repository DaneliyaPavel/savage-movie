import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JsonLdScripts } from '@/components/seo/json-ld-scripts'
import { getBlogPostBySlugServer, getBlogPostsServer } from '@/lib/api/blog'
import { TopBar } from '@/components/ui/top-bar'
import { JalousieMenu } from '@/components/ui/jalousie-menu'
import ArticleClient from './article-client'

export const dynamic = 'force-dynamic'

const SITE_NAME = 'SAVAGE MOVIE'

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1).trim() + '\u2026'
}

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

  const title = truncate(`${post.title} | Блог | ${SITE_NAME}`, 60)
  const description = post.excerpt
    ? truncate(post.excerpt, 160)
    : 'Статья в блоге Savage Movie \u2014 видеопродакшн, ИИ-генерация, обучение.'

  const publishedTime = post.published_at || post.created_at
  const authorName = post.author || 'Savage Movie'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
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
    headline: post.title,
    description: post.excerpt ?? undefined,
    url: articleUrl,
    ...(post.cover_image ? { image: post.cover_image } : {}),
    datePublished: published ?? undefined,
    dateModified: post.updated_at ?? published ?? undefined,
    author: {
      '@type': 'Person',
      name: post.author || 'Savage Movie',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SAVAGE MOVIE',
      url: baseUrl,
      logo: { '@type': 'ImageObject', url: `${baseUrl}/sm_logo.svg` },
    },
  }

  return (
    <main className="min-h-screen bg-background">
      <JsonLdScripts scripts={[JSON.stringify(articleJsonLd)]} />
      <TopBar />
      <JalousieMenu />
      <ArticleClient
        post={post}
        relatedPosts={relatedPosts}
        articleUrl={articleUrl}
      />
    </main>
  )
}
