/**
 * Секция клиентов в премиум стиле Freshman.tv
 */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { getClients, type Client } from '@/lib/api/clients'
import { getSettings, type Settings } from '@/lib/api/settings'
import { SectionTitle } from '@/components/ui/section-title'
import { GrainOverlay } from '@/components/ui/grain-overlay'
import { HoverNote } from '@/components/ui/hover-note'
import { EditorialCorrection } from '@/components/ui/editorial-correction'

export function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState({ projects: '100+', clients: '50+', years: '15+' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, settings] = await Promise.all([
          getClients().catch(() => []),
          getSettings().catch(() => ({} as Settings)),
        ])
        setClients(clientsData)

        const statsProjects = typeof settings.stats_projects === 'number' ? settings.stats_projects : null
        const statsClients = typeof settings.stats_clients === 'number' ? settings.stats_clients : null
        const statsYears = typeof settings.stats_years === 'number' ? settings.stats_years : null

        setStats({
          projects: statsProjects ? `${statsProjects}+` : '100+',
          clients: statsClients ? `${statsClients}+` : '50+',
          years: statsYears ? `${statsYears}+` : '15+',
        })
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

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
          <SectionTitle mark="cross" markPosition="top-left" size="xl" className="text-[#FFFFFF] mb-8">
            <EditorialCorrection wrong="Наши клиенты" correct="Доверяют нам" size="lg" inline delay={0.2} />
          </SectionTitle>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-editorial text-[#FFFFFF]/60 font-light max-w-3xl"
          >
            Мы работаем с амбициозными брендами, организациями и проектами
          </motion.p>
        </motion.div>

        {/* Clients Grid */}
        {loading ? (
          <div className="text-center py-12 text-[#FFFFFF]/60">Загрузка...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-[#FFFFFF]/60">Клиенты не добавлены</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-20 md:mb-32">
            {clients.slice(0, 8).map((client, index) => (
              <HoverNote key={client.id} text="trusted by" position="top" className="w-full">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.05 }}
                  className="aspect-video bg-[#050505] border border-[#1A1A1A] hover:border-[#FFFFFF]/30 transition-colors flex items-center justify-center p-4"
                >
                {client.logo_url ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={client.logo_url}
                      alt={client.name}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-contain opacity-60 hover:opacity-100 transition-opacity"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-[#FFFFFF]/40 font-medium text-center">{client.name}</span>
                )}
                </motion.div>
              </HoverNote>
            ))}
          </div>
        )}

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="border-t border-[#1A1A1A] pt-16 md:pt-20 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16"
        >
          <div>
            <div className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 text-[#ff2936]">
              {stats.projects}
            </div>
            <p className="text-lg md:text-xl text-[#FFFFFF]/60">Проектов</p>
          </div>
          <div>
            <div className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 text-[#ff2936]">
              {stats.clients}
            </div>
            <p className="text-lg md:text-xl text-[#FFFFFF]/60">Клиентов</p>
          </div>
          <div>
            <div className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 text-[#ff2936]">
              {stats.years}
            </div>
            <p className="text-lg md:text-xl text-[#FFFFFF]/60">Лет опыта</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
