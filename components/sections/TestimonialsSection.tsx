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
import { EditorialCorrection } from '@/components/ui/editorial-correction'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import { HoverNote } from '@/components/ui/hover-note'

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
    <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-[#1A1A1A] bg-[#000000]">
      <GrainOverlay />
      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 md:mb-24 editorial-spacing"
        >
          <HoverNote text="testimonials" position="top">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8"
            >
              <EditorialCorrection wrong="Отзывы клиентов" correct="Что говорят" size="xl" delay={0.2} />
            </motion.div>
          </HoverNote>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/60 font-light max-w-3xl mx-auto"
          >
            Что говорят о нас наши клиенты
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12 text-[#FFFFFF]/60">Загрузка отзывов...</div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12 text-[#FFFFFF]/60">Отзывы не добавлены</div>
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
                  <Card className="relative h-full overflow-hidden border-[#1A1A1A] hover:border-[#FFFFFF]/30 transition-all duration-300 bg-[#050505] shadow-xl hover:shadow-2xl group">
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
                        <p className="text-base text-[#FFFFFF]/90 mb-6 leading-relaxed">
                          &quot;{testimonial.text}&quot;
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
                          <p className="font-semibold text-base text-[#FFFFFF]">{testimonial.name}</p>
                          {testimonial.company && (
                            <p className="text-sm text-[#FFFFFF]/60">{testimonial.company}</p>
                          )}
                          <p className="text-sm text-[#ff2936]/80">{testimonial.projectType}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-[#050505]/80 backdrop-blur-sm border-[#1A1A1A] hover:bg-[#050505] hover:border-[#FFFFFF]/30" />
            <CarouselNext className="right-0 bg-[#050505]/80 backdrop-blur-sm border-[#1A1A1A] hover:bg-[#050505] hover:border-[#FFFFFF]/30" />
          </Carousel>
        )}
      </div>
    </section>
  )
}
