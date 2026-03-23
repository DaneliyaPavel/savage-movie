'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import ReactMarkdown from 'react-markdown'
import { Badge } from '@/components/ui/badge'
import { ReadingProgress } from '@/components/features/blog/reading-progress'
import { ShareButtons } from '@/components/features/blog/share-buttons'
import { RelatedPosts } from '@/components/features/blog/related-posts'
import { TableOfContents, slugifyHeading } from '@/components/features/blog/table-of-contents'
import type { BlogPost } from '@/lib/api/blog'

const EASE = [0.16, 1, 0.3, 1] as const

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return format(d, 'd MMMM yyyy', { locale: ru })
}

interface ArticleClientProps {
  post: BlogPost
  relatedPosts: BlogPost[]
  articleUrl: string
}

export default function ArticleClient({ post, relatedPosts, articleUrl }: ArticleClientProps) {
  const date = formatDate(post.published_at || post.created_at)

  return (
    <>
      <ReadingProgress />

      <div className="pt-24 pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mb-10"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#ff2936] transition-colors duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад в блог
            </Link>
          </motion.div>

          {/* Article Hero */}
          {post.cover_image && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="relative aspect-[21/9] overflow-hidden mb-12"
            >
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </motion.div>
          )}

          {/* Main layout: TOC + Article */}
          <div className="grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-12">
            {/* Sidebar TOC */}
            {post.content && (
              <aside>
                <TableOfContents content={post.content} />
              </aside>
            )}

            {/* Article Content */}
            <div className="max-w-3xl mx-auto w-full xl:mx-0">
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
                className="mb-12"
              >
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <Badge
                    variant="secondary"
                    className="bg-[#ff2936]/10 text-[#ff2936] border-[#ff2936]/20"
                  >
                    {post.category || 'Блог'}
                  </Badge>
                  {post.reading_time && (
                    <span className="text-sm text-muted-foreground">{post.reading_time}</span>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>{post.author || 'Savage Movie'}</span>
                  <span className="opacity-40">|</span>
                  <span className="text-base text-white/70" style={{ fontFamily: 'var(--font-handwritten), cursive' }}>{date}</span>
                </div>
              </motion.header>

              {/* Article body */}
              <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
                className="space-y-6"
              >
                {post.content ? (
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => {
                        const text = typeof children === 'string' ? children : String(children)
                        const id = slugifyHeading(text)
                        return (
                          <h2
                            id={id}
                            className="text-2xl md:text-3xl font-bold tracking-tight pt-10 pb-2 scroll-mt-24"
                          >
                            {children}
                          </h2>
                        )
                      },
                      h3: ({ children }) => {
                        const text = typeof children === 'string' ? children : String(children)
                        const id = slugifyHeading(text)
                        return (
                          <h3
                            id={id}
                            className="text-xl md:text-2xl font-semibold tracking-tight pt-8 pb-1 scroll-mt-24"
                          >
                            {children}
                          </h3>
                        )
                      },
                      p: ({ children }) => (
                        <p className="text-lg leading-[1.8] text-foreground/85 font-secondary">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 space-y-2 text-foreground/85 text-lg leading-[1.7]">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 space-y-2 text-foreground/85 text-lg leading-[1.7]">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li className="pl-1">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-[#ff2936] pl-6 py-2 my-8 italic text-foreground/70">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          className="text-[#ff2936] underline underline-offset-4 decoration-[#ff2936]/30 hover:decoration-[#ff2936] transition-colors duration-300"
                          target={href?.startsWith('http') ? '_blank' : undefined}
                          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {children}
                        </a>
                      ),
                      img: ({ src, alt }) => (
                        <figure className="my-10 -mx-4 md:-mx-8 lg:-mx-16">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={alt || ''}
                            className="w-full h-auto"
                            loading="lazy"
                          />
                          {alt && (
                            <figcaption className="mt-3 text-center text-sm text-muted-foreground px-4">
                              {alt}
                            </figcaption>
                          )}
                        </figure>
                      ),
                      code: ({ children, className }) => {
                        const isBlock = className?.includes('language-')
                        if (isBlock) {
                          return (
                            <code className="block bg-muted/30 p-4 overflow-x-auto font-mono text-sm leading-relaxed">
                              {children}
                            </code>
                          )
                        }
                        return (
                          <code className="bg-muted/30 px-1.5 py-0.5 font-mono text-sm">
                            {children}
                          </code>
                        )
                      },
                      pre: ({ children }) => (
                        <pre className="my-6 overflow-hidden">{children}</pre>
                      ),
                      hr: () => (
                        <hr className="my-12 border-t border-dashed border-muted-foreground/20" />
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-foreground">{children}</strong>
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                ) : (
                  <p className="text-lg leading-relaxed text-foreground/90">
                    Текст статьи скоро появится.
                  </p>
                )}
              </motion.article>

              {/* Author block + Share */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE }}
                className="mt-16 pt-8 border-t border-dashed border-muted-foreground/20"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted/30 flex items-center justify-center font-brand text-lg">
                      {(post.author || 'SM').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{post.author || 'Savage Movie'}</p>
                      <p className="text-xs text-muted-foreground">Автор</p>
                    </div>
                  </div>

                  {/* Share */}
                  <ShareButtons url={articleUrl} title={post.title} />
                </div>
              </motion.div>

              {/* Related Posts */}
              <RelatedPosts posts={relatedPosts} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
