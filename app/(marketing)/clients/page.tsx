/**
 * Страница списка Clients в стиле Freshman.tv
 */
import { getClients } from '@/lib/api/clients'
import type { Client } from '@/lib/api/clients'
import { ClientsPageClient } from './client'

export default async function ClientsPage() {
  let clients: Client[] = []
  
  try {
    clients = await getClients()
  } catch (error) {
    console.warn('Ошибка загрузки клиентов:', error)
  }

  return (
    <ClientsPageClient clients={clients} />
  )
}
