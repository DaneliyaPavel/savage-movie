'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { CardCoverSettings } from '@/features/courses/api'
import { CourseCover } from '@/features/courses/components/CourseCover'
import { cn } from '@/lib/utils'

export interface CourseCardProps {
  title: string
  slug: string
  shortDescription?: string
  format: string | null
  durationText?: string | null
  locationText?: string | null
  scheduleText?: string | null
  tags?: string[]
  badgeText?: string | null
  ctaText?: string | null
  cardCover?: CardCoverSettings | null
  coverImage?: string | null
  /** Video URL for card cover (e.g. video_promo_url) */
  coverVideoUrl?: string | null
  /** Show play icon on cover when format is online */
  showPlayIcon?: boolean
}

const formatLabels: Record<string, string> = {
  online: 'Онлайн',
  offline: 'Офлайн',
  hybrid: 'Гибрид',
  'online+live': 'Онлайн + живые',
}

export function CourseCard({
  title,
  slug,
  shortDescription,
  format,
  durationText,
  locationText,
  scheduleText,
  tags = [],
  badgeText,
  ctaText,
  cardCover,
  coverImage,
  coverVideoUrl,
  showPlayIcon,
}: CourseCardProps) {
  const coverSettings = cardCover
    ? { ...cardCover, show_play_icon: showPlayIcon ?? cardCover.show_play_icon ?? format === 'online' }
    : undefined

  const metaParts = [
    format ? formatLabels[format] ?? format : null,
    durationText,
    locationText,
    scheduleText,
  ].filter(Boolean)

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4 }}
      className="group flex h-full flex-col"
    >
      <Link
        href={`/courses/${slug}`}
        className="flex h-full flex-col rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-border hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CourseCover
          settings={coverSettings}
          coverImage={coverImage}
          coverVideoUrl={coverVideoUrl}
          coverMediaType={cardCover?.media_type ?? 'image'}
          badgeText={badgeText}
          format={format}
        />

        <div className="flex flex-1 flex-col p-5">
          {/* Meta row */}
          {metaParts.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {metaParts.map((part, i) => (
                <span key={i}>{part}</span>
              ))}
            </div>
          )}

          <h3 className="mb-2 text-xl font-medium leading-tight tracking-tight group-hover:text-accent transition-colors">
            {title}
          </h3>
          {shortDescription && (
            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {shortDescription}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {tags.slice(0, 5).map((tag, i) => (
                <span
                  key={i}
                  className={cn(
                    'rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground'
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto pt-4 border-t border-border">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-accent transition-colors">
              {ctaText || 'Подробнее'}
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
