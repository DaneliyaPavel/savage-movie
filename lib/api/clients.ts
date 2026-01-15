/**
 * API функции для клиентов
 */
import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface Client {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  order: number
  created_at: string
  updated_at: string
}

export interface ClientCreate {
  name: string
  description?: string | null
  logo_url?: string | null
  order?: number
}

export interface ClientUpdate {
  name?: string
  description?: string | null
  logo_url?: string | null
  order?: number
}

/**
 * Получить список клиентов
 */
export async function getClients(): Promise<Client[]> {
  return apiGet<Client[]>('/api/clients')
}

/**
 * Создать клиента
 */
export async function createClient(data: ClientCreate): Promise<Client> {
  return apiPost<Client>('/api/clients', data)
}

/**
 * Обновить клиента
 */
export async function updateClient(id: string, data: ClientUpdate): Promise<Client> {
  return apiPut<Client>(`/api/clients/${id}`, data)
}

/**
 * Удалить клиента
 */
export async function deleteClient(id: string): Promise<void> {
  return apiDelete<void>(`/api/clients/${id}`)
}
