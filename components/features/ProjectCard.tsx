/**
 * Карточка проекта для отображения в grid
 */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'

interface ProjectCardProps {
  id: string
  title: string
  slug: string
  category: 'commercial' | 'ai-content' | 'music-video' | 'other'
  thumbnail?: string
  videoUrl?: string
}

const categoryLabels: Record<string, string> = {
  commercial: 'Коммерция',
  'ai-content': 'ИИ-контент',
  'music-video': 'Клип',
  other: 'Другое',
}

const categoryColors: Record<string, string> = {
  commercial: 'bg-primary',
  'ai-content': 'bg-accent',
  'music-video': 'bg-secondary',
  other: 'bg-muted',
}

export function ProjectCard({
  title,
  slug,
  category,
  thumbnail,
  videoUrl,
}: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/projects/${slug}`}>
        <Card className="group cursor-pointer overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:shadow-primary/10">
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            {thumbnail ? (
              <>
                <Image
                  src={thumbnail}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                <Play className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            )}
            {videoUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/50"
                >
                  <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
                </motion.div>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute top-4 right-4"
            >
              <Badge className={`${categoryColors[category]} shadow-lg backdrop-blur-sm`}>
                {categoryLabels[category]}
              </Badge>
            </motion.div>
          </div>
          <CardContent className="p-6">
            <h3 className="font-heading font-bold text-xl group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
            <motion.div
              className="mt-2 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300"
            />
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
