/**
 * Роуты Next.js должны быть явно прописаны в nginx.
 *
 * В конфиге стоит catch-all `location /api/` на FastAPI. Любой новый роут в
 * app/api без своего location-блока молча уходит на бэкенд и отвечает 404 —
 * при том, что код на месте, типы сходятся и тесты зелёные. Так потерялась
 * подписка на рассылку: /api/subscribe уходил в FastAPI, где такого пути нет.
 */
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const NGINX_CONF = path.join(REPO_ROOT, 'infra/nginx/conf.d/default.conf')
const API_DIR = path.join(REPO_ROOT, 'app/api')

/**
 * Роуты, которые сознательно обслуживает FastAPI, хотя одноимённый файл есть и
 * в app/api. Список — не разрешение забывать про nginx, а фиксация известного
 * расхождения: обе реализации существуют, какая нужна — решается отдельно.
 */
const SERVED_BY_BACKEND = new Set(['/api/auth/refresh', '/api/admin/revalidate'])

interface Location {
  prefix: string
  target: string
}

/** Плоские prefix-локации конфига; regex-локации (~, ~*) в разборе не участвуют */
function parsePrefixLocations(conf: string): Location[] {
  const blocks = conf.matchAll(/location\s+(?:(\^~|=)\s+)?(\S+)\s*\{([^}]*)\}/g)
  const locations: Location[] = []

  for (const block of blocks) {
    const [, , prefix, body] = block
    if (prefix.startsWith('~')) continue

    const proxyPass = body.match(/proxy_pass\s+(\S+?);/)
    locations.push({ prefix, target: proxyPass ? proxyPass[1] : '' })
  }

  return locations
}

/** nginx выбирает самый длинный подходящий префикс */
function resolve(locations: Location[], url: string): Location | undefined {
  return locations
    .filter(location => url.startsWith(location.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]
}

/** app/api/uploads/[...path]/route.ts -> /api/uploads/sample */
function collectNextApiRoutes(dir: string, segments: string[] = []): string[] {
  const routes: string[] = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const segment = entry.name.startsWith('[') ? 'sample' : entry.name
      routes.push(...collectNextApiRoutes(path.join(dir, entry.name), [...segments, segment]))
    } else if (entry.name === 'route.ts') {
      routes.push(`/api/${segments.join('/')}`)
    }
  }

  return routes
}

describe('nginx: маршрутизация API', () => {
  const conf = fs.readFileSync(NGINX_CONF, 'utf-8')
  const locations = parsePrefixLocations(conf)
  const nextRoutes = collectNextApiRoutes(API_DIR)

  it('находит роуты и локации, иначе тест бессмысленный', () => {
    expect(nextRoutes.length).toBeGreaterThan(0)
    expect(locations.length).toBeGreaterThan(0)
    expect(nextRoutes).toContain('/api/subscribe')
  })

  it.each(nextRoutes)('%s обслуживается фронтендом', route => {
    const matched = resolve(locations, route)

    expect(matched, `нет ни одной подходящей location для ${route}`).toBeDefined()

    if (SERVED_BY_BACKEND.has(route)) {
      expect(matched!.target).toContain('backend:8000')
      return
    }

    expect(
      matched!.target,
      `${route} попадает в "location ${matched!.prefix}" -> ${matched!.target}. ` +
        'Добавьте свой location-блок на frontend:3000, иначе роут ответит 404.'
    ).toContain('frontend:3000')
  })
})
