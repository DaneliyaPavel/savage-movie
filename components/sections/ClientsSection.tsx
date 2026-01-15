/**
 * Секция клиентов в премиум стиле Freshman.tv
 */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getClients, type Client } from '@/lib/api/clients'
import { getSettings } from '@/lib/api/settings'
import { SectionTitle } from '@/components/ui/section-title'
import { GrainOverlay } from '@/components/ui/grain-overlay'

export function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState({ projects: '100+', clients: '50+', years: '15+' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, settings] = await Promise.all([
          getClients().catch(() => []),
          getSettings().catch(() => ({})),
        ])
        setClients(clientsData)
        setStats({
          projects: settings.stats_projects ? `${settings.stats_projects}+` : '100+',
          clients: settings.stats_clients ? `${settings.stats_clients}+` : '50+',
          years: settings.stats_years ? `${settings.stats_years}+` : '15+',
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
            Наши клиенты
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
                  <span className="text-sm text-[#FFFFFF]/40 font-medium text-center">{client.name}</span>
                )}
              </motion.div>
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
            <div className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 text-[#CCFF00]">
              {stats.projects}
            </div>
            <p className="text-lg md:text-xl text-[#FFFFFF]/60">Проектов</p>
          </div>
          <div>
            <div className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 text-[#CCFF00]">
              {stats.clients}
            </div>
            <p className="text-lg md:text-xl text-[#FFFFFF]/60">Клиентов</p>
          </div>
          <div>
            <div className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold mb-4 text-[#CCFF00]">
              {stats.years}
            </div>
            <p className="text-lg md:text-xl text-[#FFFFFF]/60">Лет опыта</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
