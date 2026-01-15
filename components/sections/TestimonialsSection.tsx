/**
 * Секция с отзывами клиентов
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star } from 'lucide-react'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { motion } from 'framer-motion'

interface Testimonial {
  id: string
  name: string
  company?: string
  projectType: string
  videoUrl?: string
  videoPlaybackId?: string
  rating: number
  text?: string
}

interface TestimonialsSectionProps {
  testimonials?: Testimonial[]
}

export function TestimonialsSection({ testimonials: propsTestimonials }: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(propsTestimonials || [])
  const [loading, setLoading] = useState(!propsTestimonials)

  useEffect(() => {
    if (!propsTestimonials) {
      const loadTestimonials = async () => {
        try {
          const data = await import('@/lib/api/testimonials').then(m => m.getTestimonials())
          setTestimonials(data.map(t => ({
            id: t.id,
            name: t.name,
            company: t.company || undefined,
            projectType: t.project_type || '',
            rating: t.rating,
            text: t.text || undefined,
            videoUrl: t.video_url || undefined,
            videoPlaybackId: t.video_playback_id || undefined,
          })))
        } catch (error) {
          console.error('Ошибка загрузки отзывов:', error)
        } finally {
          setLoading(false)
        }
      }
      loadTestimonials()
    }
  }, [propsTestimonials])
  return (
    <section className="relative py-32 px-4 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent" />
      
      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-heading font-bold text-5xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
          >
            Отзывы клиентов
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-muted-foreground text-xl md:text-2xl max-w-3xl mx-auto font-light"
          >
            Что говорят о нас наши клиенты
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка отзывов...</div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Отзывы не добавлены</div>
        ) : (
          <Carousel className="w-full max-w-6xl mx-auto">
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
              <CarouselItem key={testimonial.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Card className="relative h-full overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 bg-card/80 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:shadow-primary/10 group">
                    {/* Decorative gradient */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <CardContent className="p-6 relative z-10">
                    {testimonial.videoPlaybackId ? (
                      <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                        <VideoPlayer
                          playbackId={testimonial.videoPlaybackId}
                          controls
                          className="w-full h-full"
                        />
                      </div>
                    ) : testimonial.videoUrl ? (
                      <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                        <video
                          src={testimonial.videoUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    
                      <div className="flex items-center gap-1 mb-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 + i * 0.05 }}
                          >
                            <Star
                              className={`w-5 h-5 ${
                                i < testimonial.rating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          </motion.div>
                        ))}
                      </div>

                      {testimonial.text && (
                        <p className="text-base text-foreground/90 mb-6 leading-relaxed">
                          "{testimonial.text}"
                        </p>
                      )}

                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {testimonial.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-base">{testimonial.name}</p>
                          {testimonial.company && (
                            <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                          )}
                          <p className="text-sm text-primary/80">{testimonial.projectType}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background" />
            <CarouselNext className="right-0 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background" />
          </Carousel>
        )}
      </div>
    </section>
  )
}
