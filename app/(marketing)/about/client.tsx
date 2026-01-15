/**
 * Клиентский компонент страницы About в премиум стиле Freshman.tv
 * Редакторский стиль: портрет, манифест, клиенты
 */
'use client'

import { motion } from 'framer-motion'
import { Film, Users, Award } from 'lucide-react'
import { SectionTitle } from '@/components/ui/section-title'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getClients } from '@/lib/api/clients'
import { useEffect, useState } from 'react'
import type { Client } from '@/lib/api/clients'

export function AboutPageClient() {
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    getClients()
      .then(setClients)
      .catch(() => setClients([]))
  }, [])

  return (
    <div className="min-h-screen pt-20 pb-20 bg-[#000000]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 md:mb-32 editorial-spacing"
        >
          <SectionTitle size="xl" className="text-[#FFFFFF] mb-8">
            О нас
          </SectionTitle>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/60 font-light leading-relaxed max-w-4xl"
          >
            Смотрим на мир через объектив кинокамеры. Работаем с лучшими исполнителями, 
            чтобы рассказать о вас миру с помощью современных технологий и креатива.
          </motion.p>
        </motion.div>

        {/* Портрет/визуал - крупный, на всю ширину */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-video md:aspect-[21/9] mb-20 md:mb-32 bg-[#050505] border border-[#1A1A1A] overflow-hidden"
        >
          <GrainOverlay />
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-24 h-24 text-[#FFFFFF]/10" />
          </div>
          {/* Placeholder для портрета/видео */}
        </motion.div>

        {/* Манифест */}
        <section className="mb-20 md:mb-32 editorial-spacing">
          <SectionTitle mark="arrow" markPosition="top-left" size="lg" className="text-[#FFFFFF] mb-12">
            Наша история
          </SectionTitle>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8 text-editorial text-[#FFFFFF]/80 font-light leading-relaxed max-w-4xl"
          >
            <p>
              Мы работаем так, чтобы люди смотрели, а вам всегда хотелось сказать: 
              "Это именно то, что нужно!"
            </p>
            <p>
              SAVAGE MOVIE — это команда профессионалов, которые создают видеоконтент 
              высочайшего качества. От коммерческих роликов до музыкальных клипов, 
              от ИИ-генерации до полного цикла продакшна.
            </p>
            <p>
              Мы не просто снимаем видео — мы создаем истории, которые вдохновляют, 
              продают и запоминаются.
            </p>
          </motion.div>
        </section>

        {/* Достижения */}
        <section className="mb-20 md:mb-32 border-t border-[#1A1A1A] pt-16 editorial-spacing">
          <SectionTitle mark="plus" markPosition="top-left" size="lg" className="text-[#FFFFFF] mb-16">
            Достижения
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
            {[
              { icon: Film, value: '100+', label: 'Проектов' },
              { icon: Users, value: '50+', label: 'Клиентов' },
              { icon: Award, value: '10+', label: 'Наград' },
            ].map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <motion.div
                  key={achievement.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="mb-6">
                    <Icon className="w-8 h-8 text-[#CCFF00]" />
                  </div>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 text-[#FFFFFF]">
                    {achievement.value}
                  </div>
                  <p className="text-lg md:text-xl text-[#FFFFFF]/60">{achievement.label}</p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Миссия */}
        <section className="mb-20 md:mb-32 border-t border-[#1A1A1A] pt-16 editorial-spacing">
          <SectionTitle mark="circle" markPosition="top-left" size="lg" className="text-[#FFFFFF] mb-12">
            Наша миссия
          </SectionTitle>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/80 font-light leading-relaxed max-w-4xl"
          >
            Использовать креативность для продвижения самых амбициозных брендов, 
            организаций и проектов в России и за её пределами. Создавать видеоконтент, 
            который не просто демонстрирует продукт или услугу, но и вдохновляет, 
            мотивирует и оставляет незабываемое впечатление.
          </motion.p>
        </section>

        {/* Клиенты */}
        {clients.length > 0 && (
          <section className="border-t border-[#1A1A1A] pt-16 editorial-spacing">
            <SectionTitle mark="cross" markPosition="top-left" size="lg" className="text-[#FFFFFF] mb-12">
              Наши клиенты
            </SectionTitle>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
            >
              {clients.slice(0, 8).map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.05 }}
                  className="aspect-video bg-[#050505] border border-[#1A1A1A] hover:border-[#FFFFFF]/30 transition-colors flex items-center justify-center p-4"
                >
                  {client.logo_url ? (
                    <img
                      src={client.logo_url}
                      alt={client.name}
                      className="max-w-full max-h-full object-contain opacity-60 hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <span className="text-sm text-[#FFFFFF]/40 font-medium">{client.name}</span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* CTA к контактам */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-[#1A1A1A] pt-16 mt-20 md:mt-32"
        >
          <div className="max-w-3xl">
            <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-6 text-[#FFFFFF]">
              Готовы начать проект?
            </h2>
            <p className="text-lg md:text-xl text-[#FFFFFF]/60 font-light mb-8 leading-relaxed">
              Свяжитесь с нами, и мы обсудим ваш проект
            </p>
            <Link href="/contact">
              <motion.div
                className="inline-flex items-center gap-4 group"
                whileHover={{ x: 10 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-xl md:text-2xl font-medium text-[#FFFFFF] group-hover:text-[#CCFF00] transition-colors">
                  Связаться
                </span>
                <ArrowRight className="w-6 h-6 text-[#FFFFFF]/60 group-hover:text-[#CCFF00] transition-colors" />
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
