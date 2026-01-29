/**
 * API функции для клиентов/режиссеров
 */
import { apiGet, apiPost, apiPut, apiDelete } from './client'

export interface PortfolioVideo {
  url?: string
  playback_id?: string
  title?: string
  thumbnail?: string
}

export interface Client {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  order: number
  // Поля для Directors
  slug: string | null
  video_url: string | null
  video_playback_id: string | null
  portfolio_videos: PortfolioVideo[] | null
  bio: string | null
  role: string | null
  created_at: string
  updated_at: string
}

export interface ClientCreate {
  name: string
  description?: string | null
  logo_url?: string | null
  order?: number
  // Поля для Directors
  slug?: string | null
  video_url?: string | null
  video_playback_id?: string | null
  portfolio_videos?: PortfolioVideo[] | null
  bio?: string | null
  role?: string | null
}

export interface ClientUpdate {
  name?: string
  description?: string | null
  logo_url?: string | null
  order?: number
  // Поля для Directors
  slug?: string | null
  video_url?: string | null
  video_playback_id?: string | null
  portfolio_videos?: PortfolioVideo[] | null
  bio?: string | null
  role?: string | null
}

/**
 * Получить режиссера по slug
 */
export async function getClientBySlug(slug: string): Promise<Client | null> {
  return apiGet<Client>(`/api/clients/by-slug/${slug}`)
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
