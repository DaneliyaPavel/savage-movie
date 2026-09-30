/**
 * Серверная загрузка работ страницы направления.
 *
 * Без портфолио страница деградирует до текстовой версии: заголовки, копия,
 * FAQ и форма остаются, исчезают только кадры и титры.
 */
import { getProjectsServer, type Project } from '@/features/projects/api'
import { logger } from '@/lib/utils/logger'
import type { ServiceDirectionId } from '../directions'
import { SERVICE_FRAMES } from '../frames'
import { directionPath } from './index'
import { resolvePageWorks, type DirectionPageWork } from './resolve'

export async function loadDirectionWorks(id: ServiceDirectionId): Promise<DirectionPageWork[]> {
  const projects = await getProjectsServer().catch((error: unknown) => {
    logger.error('Не удалось загрузить проекты для страницы направления', error, {
      route: directionPath(id),
    })
    return [] as Project[]
  })
  return resolvePageWorks(id, projects, SERVICE_FRAMES[id].still)
}
