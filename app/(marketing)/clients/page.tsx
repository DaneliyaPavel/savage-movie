/**
 * Страница списка Clients в стиле Freshman.tv
 */
import type { Metadata } from 'next'
import { getClients } from '@/lib/api/clients'
import type { Client } from '@/lib/api/clients'
import { ClientsPageClient } from './client'

export const metadata: Metadata = {
  title: 'Клиенты | SAVAGE MOVIE',
  description: 'Бренды и артисты, с которыми работала студия Savage Movie.',
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
