/**
 * Карточка курса для отображения в grid
 */
'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Clock, Star } from 'lucide-react'

interface CourseCardProps {
  id: string
  title: string
  slug: string
  category: 'ai' | 'shooting' | 'editing' | 'production'
  coverImage?: string
  price: number
  duration?: number
  rating?: number
}

const categoryLabels: Record<string, string> = {
  ai: 'ИИ-генерация',
  shooting: 'Съемка',
  editing: 'Монтаж',
  production: 'Продакшн',
}

export function CourseCard({
  title,
  slug,
  category,
  coverImage,
  price,
  duration,
  rating,
}: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/courses/${slug}`}>
        <Card className="group cursor-pointer overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-lg hover:shadow-2xl hover:shadow-primary/10 h-full flex flex-col">
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-muted to-muted/50">
            {coverImage ? (
              <>
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-500">
                <motion.span
                  className="text-6xl font-heading font-bold text-primary"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                >
                  {title.charAt(0)}
                </motion.span>
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute top-4 left-4"
            >
              <Badge className="bg-primary/90 backdrop-blur-sm shadow-lg">
                {categoryLabels[category]}
              </Badge>
            </motion.div>
            {rating && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="absolute top-4 right-4 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full"
              >
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
              </motion.div>
            )}
          </div>
          <CardContent className="p-6 flex-1">
            <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {duration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{duration} мин</span>
                </div>
              )}
            </div>
            <motion.div
              className="mt-3 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-300"
            />
          </CardContent>
          <CardFooter className="p-6 pt-0 flex items-center justify-between">
            <div className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {price.toLocaleString('ru-RU')} ₽
            </div>
            <Button
              size="sm"
              className="ml-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              Подробнее
              <motion.span
                className="ml-1"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </Button>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  )
}
