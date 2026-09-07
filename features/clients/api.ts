/**
 * Загрузка данных для страницы /clients.
 *
 * Страница собирается из двух источников: опубликованных проектов (обязательный)
 * и CMS-записей клиентов (опциональный, сейчас на проде пустой). Отказ любого из
 * них не должен ронять страницу — см. `loadClientRollData`.
 */
import { getProjectsServer, type Project } from '@/features/projects/api'
import type { Client } from '@/lib/api/clients'
import { buildClientRoll, type ClientRoll } from './mappers'
import { ROLL_PRIORITY } from './content'
import { logger } from '@/lib/utils/logger'

/** Список клиентов из CMS (server-side) */
export async function getClientsServer(cookies?: {
  get: (name: string) => { value: string } | undefined
}): Promise<Client[]> {
  const { apiGet } = await import('@/lib/api/server')
  return apiGet<Client[]>('/api/clients', cookies)
}

export interface ClientRollData extends ClientRoll {
  projects: Project[]
}

/**
 * Проекты и клиенты одним вызовом. Ошибки логируются и деградируют в пустой
 * список: /clients — коммерческая страница, лучше показать её без ролла, чем 500.
 */
export async function loadClientRollData(): Promise<ClientRollData> {
  const [projects, cmsClients] = await Promise.all([
    getProjectsServer().catch(error => {
      logger.error('Не удалось загрузить проекты для /clients', error)
      return [] as Project[]
    }),
    getClientsServer().catch(error => {
      logger.error('Не удалось загрузить CMS-клиентов для /clients', error)
      return [] as Client[]
    }),
  ])

  return { ...buildClientRoll(projects, cmsClients, ROLL_PRIORITY), projects }
}
