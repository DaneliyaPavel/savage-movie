/**
 * Services/Capabilities секция в премиум стиле Freshman.tv
 * Короткие, ударные фразы, крупная типографика
 */
'use client'

import { motion } from 'framer-motion'
import { SectionTitle } from '@/components/ui/section-title'
import { GrainOverlay } from '@/components/ui/grain-overlay'

const services = [
  { title: 'Коммерческий видеопродакшн', description: 'Рекламные ролики, брендовые фильмы, корпоративные видео' },
  { title: 'ИИ-генерация контента', description: 'Инновационные решения с использованием искусственного интеллекта' },
  { title: 'Музыкальные клипы', description: 'Креативные видео для артистов и музыкальных проектов' },
  { title: 'Полный цикл продакшна', description: 'От концепции до постпродакшна и публикации' },
]

export function ServicesSection() {
  return (
    <section className="relative py-24 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-[#1A1A1A] bg-[#000000]">
      <GrainOverlay />
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 md:mb-24 editorial-spacing"
        >
          <SectionTitle mark="arrow" markPosition="top-left" size="xl" className="text-[#FFFFFF] mb-8">
            Услуги
          </SectionTitle>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/60 font-light max-w-3xl"
          >
            Что мы предлагаем для вашего проекта
          </motion.p>
        </motion.div>

        {/* Services List */}
        <div className="space-y-12 md:space-y-16">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="border-b border-[#1A1A1A] pb-12 md:pb-16 last:border-0"
            >
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-[#FFFFFF] mb-4">
                {service.title}
              </h3>
              <p className="text-lg md:text-xl text-[#FFFFFF]/60 font-light leading-relaxed max-w-3xl">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
