/**
 * Страница списка Clients в стиле Freshman.tv
 */
import type { Metadata } from 'next'
import { getClients } from '@/lib/api/clients'
import type { Client } from '@/lib/api/clients'
import { ClientsPageClient } from './client'

export const metadata: Metadata = {
  title: 'Клиенты Savage Movie — бренды и артисты',
  description:
    'Бренды и артисты, которые доверяют Savage Movie. Видеопродакшн для бизнеса в Санкт-Петербурге и Москве.',
  alternates: {
    canonical: '/clients',
  },
}

export default async function ClientsPage() {
  let clients: Client[] = []

  try {
    clients = await getClients()
  } catch (error) {
    console.warn('Ошибка загрузки клиентов:', error)
  }

  return <ClientsPageClient clients={clients} />
}
