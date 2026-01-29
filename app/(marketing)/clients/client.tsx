/**
 * Клиентский компонент страницы Clients с анимациями
 */
'use client'

import { ClientsList } from '@/components/sections/ClientsList'
import { motion } from 'framer-motion'
import type { Client } from '@/lib/api/clients'

interface ClientsPageClientProps {
  clients: Client[]
}

export function ClientsPageClient({ clients }: ClientsPageClientProps) {
  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок секции */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 md:mb-24"
        >
          <h1 className="font-heading font-bold text-6xl md:text-7xl lg:text-8xl mb-6 text-foreground">
            Клиенты
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl"
          >
            Мы работаем с амбициозными брендами, организациями и проектами, помогая им достигать
            своих целей через креативный видеоконтент.
          </motion.p>
        </motion.div>

        {/* Список Clients */}
        <ClientsList clients={clients} />
      </div>
    </div>
  )
}
