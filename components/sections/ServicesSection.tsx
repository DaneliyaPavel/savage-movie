/**
 * Секция услуг в grid-стиле The Up&Up Group
 */
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const services = [
  {
    title: 'Видеопродакшн',
    description: 'Полный цикл создания видео: от концепции до публикации',
    href: '/projects?category=commercial',
  },
  {
    title: 'ИИ-генерация',
    description: 'Создание контента с помощью искусственного интеллекта',
    href: '/projects?category=ai-content',
  },
  {
    title: 'Обучение',
    description: 'Онлайн-курсы по видеопродакшну и ИИ-генерации',
    href: '/courses',
  },
  {
    title: 'Консультации',
    description: 'Экспертные советы по созданию видеоконтента',
    href: '/contact',
  },
]

export function ServicesSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-border/30">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h2 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl mb-6 text-foreground">
            Наши услуги
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl">
            Мы объединяем разнообразные возможности маркетинга и коммуникаций 
            для создания качественного видеоконтента.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Link href={service.href}>
                <div className="border-b border-border/30 pb-6 group-hover:border-primary/50 transition-colors">
                  <h3 className="font-heading font-bold text-2xl mb-4 text-foreground group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
