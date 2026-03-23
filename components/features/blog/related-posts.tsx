'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale/ru'
import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { BlogPost } from '@/lib/api/blog'

const EASE = [0.16, 1, 0.3, 1] as const

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return format(d, 'd MMMM yyyy', { locale: ru })
}

interface RelatedPostsProps {
  posts: BlogPost[]
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: EASE }}
      className="mt-24 pt-16 border-t border-dashed border-muted-foreground/20"
    >
      <div className="flex items-baseline gap-4 mb-10">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Читайте также</h2>
        <span className="text-lg text-white uppercase" style={{ fontFamily: 'var(--font-handwritten), cursive' }}>ЕЩЁ</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.slice(0, 3).map((post, index) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: EASE }}
            >
              {post.cover_image ? (
                <div className="relative aspect-[16/10] overflow-hidden mb-4">
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  />
                </div>
              ) : (
                <div className="aspect-[16/10] bg-muted/20 mb-4" />
              )}

              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className="bg-[#ff2936]/10 text-[#ff2936] border-[#ff2936]/20 text-xs"
                >
                  {post.category || 'Блог'}
                </Badge>
                <span className="text-xs text-white uppercase" style={{ fontFamily: 'var(--font-handwritten), cursive' }}>
                  {formatDate(post.published_at || post.created_at)}
                </span>
              </div>

              <h3 className="text-lg font-bold tracking-tight leading-snug mb-1 group-hover:text-[#ff2936] transition-colors duration-300">
                {post.title}
              </h3>

              <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-[#ff2936] transition-colors">
                Читать <ArrowRight className="w-3 h-3" />
              </span>
            </motion.article>
          </Link>
        ))}
      </div>
    </motion.section>
  )
}
