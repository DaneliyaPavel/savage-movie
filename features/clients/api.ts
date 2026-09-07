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
 * Проекты и клиенты одним вызовом.
 *
 * Пустой ответ CMS и отказ загрузки — разные события, и обрабатываются
 * по-разному. Пустой список законен: рисуем честную заглушку со ссылкой на
 * портфолио. Отказ загрузки — нет, и глотать его нельзя: страница отрендерилась
 * бы как «портфолио недоступно», Next засчитал бы этот рендер успешным и
 * закешировал, а при s-maxage=60 плюс stale-while-revalidate такой ответ живёт
 * до следующей удачной ревалидации. Один блип бэкенда во время сборки образа
 * запёк бы пустую страницу клиентов в деплой.
 *
 * Поэтому отказ пробрасывается: при сборке она падает громко и заметно, при
 * ISR Next оставляет предыдущую удачную версию и повторяет попытку позже.
 *
 * CMS-записи клиентов необязательны: без них ролл целиком живёт на проектах,
 * их отказ действительно можно пережить.
 */
export async function loadClientRollData(): Promise<ClientRollData> {
  const [projects, cmsClients] = await Promise.all([
    getProjectsServer(),
    getClientsServer().catch(error => {
      logger.error('Не удалось загрузить CMS-клиентов для /clients', error)
      return [] as Client[]
    }),
  ])

  return { ...buildClientRoll(projects, cmsClients, ROLL_PRIORITY), projects }
}
