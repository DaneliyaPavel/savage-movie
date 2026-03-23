'use client'

import { useState, useMemo } from 'react'
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

function getCategories(posts: BlogPost[]): string[] {
  const cats = new Set<string>()
  posts.forEach(p => {
    if (p.category) cats.add(p.category)
  })
  return Array.from(cats)
}

/* ──────────────────────── Featured Post ──────────────────────── */

function FeaturedPost({ post }: { post: BlogPost }) {
  const date = formatDate(post.published_at || post.created_at)

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <motion.article
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pb-12 mb-12 border-b border-dashed border-muted-foreground/20"
      >
        {/* Cover image */}
        {post.cover_image ? (
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
          </div>
        ) : (
          <div className="relative aspect-video bg-muted/30 flex items-center justify-center">
            <span className="text-6xl text-white/20" style={{ fontFamily: 'var(--font-handwritten), cursive' }}>#01</span>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <Badge
              variant="secondary"
              className="bg-[#ff2936]/10 text-[#ff2936] border-[#ff2936]/20 hover:bg-[#ff2936]/20"
            >
              {post.category || 'Блог'}
            </Badge>
            {post.reading_time && (
              <span className="text-sm text-muted-foreground">{post.reading_time}</span>
            )}
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-4 transition-colors duration-300 group-hover:text-[#ff2936]">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-editorial text-muted-foreground line-clamp-3 mb-6 max-w-lg">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="text-base" style={{ fontFamily: 'var(--font-handwritten), cursive' }}>{date}</span>
            <span className="opacity-40">|</span>
            <span>{post.author || 'Savage Movie'}</span>
          </div>

          <motion.div
            className="flex items-center gap-2 mt-6 text-sm font-medium"
            initial={{ x: 0 }}
            whileHover={{ x: 5 }}
          >
            <span className="group-hover:text-[#ff2936] transition-colors">Читать</span>
            <ArrowRight className="w-4 h-4 group-hover:text-[#ff2936] transition-colors" />
          </motion.div>
        </div>
      </motion.article>
    </Link>
  )
}

/* ──────────────────────── Blog Card ──────────────────────── */

function BlogCard({ post, index }: { post: BlogPost, index: number }) {
  const date = formatDate(post.published_at || post.created_at)
  const num = String(index + 1).padStart(2, '0')

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: EASE }}
        className="relative"
      >
        {/* Cover image */}
        {post.cover_image ? (
          <div className="relative aspect-[16/10] overflow-hidden mb-5">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            {/* Handwritten number */}
            <span
              className="absolute top-3 left-4 text-xl text-white/60"
              style={{ fontFamily: 'var(--font-handwritten), cursive' }}
            >
              #{num}
            </span>
          </div>
        ) : (
          <div className="relative aspect-[16/10] bg-muted/20 mb-5 flex items-end justify-start p-4">
            <span
              className="text-4xl text-white/15 absolute top-3 left-4"
              style={{ fontFamily: 'var(--font-handwritten), cursive' }}
            >
              #{num}
            </span>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mb-3">
          <Badge
            variant="secondary"
            className="bg-[#ff2936]/10 text-[#ff2936] border-[#ff2936]/20 text-xs"
          >
            {post.category || 'Блог'}
          </Badge>
          <span className="text-xs text-white/60" style={{ fontFamily: 'var(--font-handwritten), cursive' }}>{date}</span>
        </div>

        {/* Title with animated underline */}
        <h3 className="text-xl md:text-2xl font-bold tracking-tight leading-snug mb-2 transition-colors duration-300 group-hover:text-[#ff2936]">
          <span className="relative">
            {post.title}
            <motion.span
              className="absolute bottom-0 left-0 h-[1px] bg-[#ff2936]"
              initial={{ width: 0 }}
              whileInView={{ width: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              style={{ width: 0 }}
            />
          </span>
        </h3>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Bottom border */}
        <div className="mt-6 pt-6 border-t border-dashed border-muted-foreground/15 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {post.reading_time || ''}
          </span>
          <motion.span
            className="text-xs font-medium flex items-center gap-1 group-hover:text-[#ff2936] transition-colors"
            whileHover={{ x: 3 }}
          >
            Читать <ArrowRight className="w-3 h-3" />
          </motion.span>
        </div>
      </motion.article>
    </Link>
  )
}

/* ──────────────────────── Category Filter ──────────────────────── */

function CategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: string[]
  active: string | null
  onChange: (cat: string | null) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
      className="flex flex-wrap gap-3 justify-center"
    >
      <button
        onClick={() => onChange(null)}
        className={`
          px-4 py-2 text-sm border transition-all duration-300
          ${!active
            ? 'border-foreground text-foreground'
            : 'border-border/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
          }
        `}
      >
        Все
      </button>
      {categories.map((cat, i) => (
        <motion.button
          key={cat}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 + i * 0.05, ease: EASE }}
          onClick={() => onChange(active === cat ? null : cat)}
          className={`
            px-4 py-2 text-sm border transition-all duration-300
            ${active === cat
              ? 'border-foreground text-foreground'
              : 'border-border/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
            }
          `}
        >
          {cat}
        </motion.button>
      ))}
    </motion.div>
  )
}

/* ──────────────────────── Main Component ──────────────────────── */

export default function BlogPageClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categories = useMemo(() => getCategories(initialPosts), [initialPosts])

  const featured = useMemo(
    () => initialPosts.find(p => p.is_featured) || initialPosts[0],
    [initialPosts],
  )

  const filteredPosts = useMemo(() => {
    const remaining = initialPosts.filter(p => p.id !== featured?.id)
    if (!activeCategory) return remaining
    return remaining.filter(p => p.category === activeCategory)
  }, [initialPosts, featured, activeCategory])

  return (
    <div className="pt-32 pb-24 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <h1 className="text-section-title font-brand mb-4">Блог</h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            className="text-editorial text-muted-foreground max-w-2xl mx-auto mb-2"
          >
            Статьи о видеопродакшне, ИИ-генерации и обучении
          </motion.p>

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
            className="text-lg text-white/70"
            style={{ fontFamily: 'var(--font-handwritten), cursive' }}
          >
            [ ЗАПИСКИ ]
          </motion.span>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-16">
            <CategoryFilter
              categories={categories}
              active={activeCategory}
              onChange={setActiveCategory}
            />
          </div>
        )}

        {/* Featured Post */}
        {featured && !activeCategory && (
          <FeaturedPost post={featured} />
        )}

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {filteredPosts.map((post, index) => (
              <BlogCard key={post.id} post={post} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <p className="text-muted-foreground text-lg">
              {activeCategory ? 'В этой категории пока нет статей' : 'Статьи скоро появятся'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
