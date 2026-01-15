/**
 * Секция клиентов в стиле The Up&Up Group
 */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getClients, type Client } from '@/lib/api/clients'
import { getSettings } from '@/lib/api/settings'

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
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
            Наши клиенты
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl">
            Мы работаем с амбициозными брендами, организациями и проектами, 
            помогая им достигать своих целей через креативный видеоконтент.
          </p>
        </motion.div>

        {/* Clients Grid */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Клиенты не добавлены</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {clients.map((client, index) => (
            <motion.div
              key={client.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="border-b border-border/30 pb-6 group-hover:border-primary/50 transition-colors">
                {client.logo ? (
                  <div className="mb-6 h-16 flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                    <img 
                      src={client.logo} 
                      alt={client.name}
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mb-6 h-16 flex items-center">
                    <h3 className="font-heading font-bold text-2xl text-foreground/60 group-hover:text-foreground transition-colors">
                      {client.name}
                    </h3>
                  </div>
                )}
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  {client.description}
                </p>
              </div>
            </motion.div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-border/30 pt-16"
        >
          <div>
            <div className="text-5xl md:text-6xl font-heading font-bold text-primary mb-3">
              {stats.projects}
            </div>
            <p className="text-muted-foreground text-lg">Проектов</p>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-heading font-bold text-primary mb-3">
              {stats.clients}
            </div>
            <p className="text-muted-foreground text-lg">Клиентов</p>
          </div>
          <div>
            <div className="text-5xl md:text-6xl font-heading font-bold text-primary mb-3">
              {stats.years}
            </div>
            <p className="text-muted-foreground text-lg">Лет опыта</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
