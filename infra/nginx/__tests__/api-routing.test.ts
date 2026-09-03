/**
 * Роуты Next.js должны быть явно прописаны в nginx.
 *
 * В конфиге стоит catch-all `location /api/` на FastAPI. Любой новый роут в
 * app/api без своего location-блока молча уходит на бэкенд и отвечает 404 —
 * при том, что код на месте, типы сходятся и тесты зелёные. Так потерялась
 * подписка на рассылку: /api/subscribe уходил в FastAPI, где такого пути нет.
 *
 * Второй класс поломок — приоритет локаций. nginx выбирает не «самый длинный
 * префикс», а сначала точное совпадение, потом `^~`, потом regex в порядке
 * объявления, и только затем обычный префикс. Из-за этого regex-блок со
 * списком расширений картинок перехватывал /uploads/*.png и всё выглядело
 * рабочим, пока /uploads/*.pdf и /uploads/*.mp4 уходили на бэкенд и отвечали
 * 404. Поэтому резолвер ниже воспроизводит порядок nginx целиком, а не
 * приближение к нему.
 */
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const NGINX_CONF = path.join(REPO_ROOT, 'infra/nginx/conf.d/default.conf')
const NEXT_CONFIG = path.join(REPO_ROOT, 'next.config.ts')
const API_DIR = path.join(REPO_ROOT, 'app/api')

/**
 * Роуты, которые сознательно обслуживает FastAPI, хотя одноимённый файл есть и
 * в app/api. Список — не разрешение забывать про nginx, а фиксация известного
 * расхождения: обе реализации существуют, какая нужна — решается отдельно.
 */
const SERVED_BY_BACKEND = new Set(['/api/auth/refresh', '/api/admin/revalidate'])

type LocationKind = 'exact' | 'prefixNoRegex' | 'regex' | 'prefix'

interface Location {
  kind: LocationKind
  /** Префикс пути или исходный regex */
  pattern: string
  target: string
  /** Порядок объявления в конфиге — regex выбирается по нему */
  order: number
}

/**
 * Разбираем только основной HTTPS-сервер: в файле есть ещё редиректы www и
 * http->https, у них свои `location /`, и мешать их в общую кучу нельзя.
 */
function mainServerBlock(conf: string): string {
  const blocks = conf.split(/\nserver\s*\{/).slice(1)
  const main = blocks.find(block => block.includes('proxy_pass http://frontend:3000;'))
  if (!main) throw new Error('Не найден основной server-блок с проксированием на frontend')
  return main
}

function parseLocations(conf: string): Location[] {
  // Второй токен обязан быть непустым: с ленивым `[^{]*?` группа успешно
  // матчилась пустой строкой, модификатором становился сам путь, а шаблоном —
  // пустая строка, которая совпадает вообще с любым URL.
  const blocks = mainServerBlock(conf).matchAll(
    /location\s+([^\s{]+)(?:\s+([^\s{]+))?\s*\{([^}]*)\}/g
  )
  const locations: Location[] = []
  let order = 0

  for (const block of blocks) {
    const [, first, second, body] = block
    const hasModifier = second !== undefined && second !== ''
    const modifier = hasModifier ? first! : ''
    const pattern = (hasModifier ? second : first!).trim()

    const kind: LocationKind =
      modifier === '='
        ? 'exact'
        : modifier === '^~'
          ? 'prefixNoRegex'
          : modifier.startsWith('~')
            ? 'regex'
            : 'prefix'

    const proxyPass = body!.match(/proxy_pass\s+(\S+?);/)
    locations.push({ kind, pattern, target: proxyPass ? proxyPass[1]! : '', order: order++ })
  }

  return locations
}

/** Порядок выбора локации в nginx: = → ^~ → regex → обычный префикс */
function resolve(locations: Location[], url: string): Location | undefined {
  const exact = locations.find(item => item.kind === 'exact' && item.pattern === url)
  if (exact) return exact

  const longestPrefix = (kinds: LocationKind[]) =>
    locations
      .filter(item => kinds.includes(item.kind) && url.startsWith(item.pattern))
      .sort((a, b) => b.pattern.length - a.pattern.length)[0]

  // ^~ с самым длинным совпадением отменяет проверку regex
  const noRegex = longestPrefix(['prefixNoRegex'])
  const plain = longestPrefix(['prefix'])
  if (noRegex && (!plain || noRegex.pattern.length >= plain.pattern.length)) return noRegex

  const regexMatch = locations
    .filter(item => item.kind === 'regex')
    .sort((a, b) => a.order - b.order)
    .find(item => {
      try {
        return new RegExp(item.pattern, 'i').test(url)
      } catch {
        return false
      }
    })
  if (regexMatch) return regexMatch

  return plain ?? noRegex
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

const conf = fs.readFileSync(NGINX_CONF, 'utf-8')
const locations = parseLocations(conf)

describe('nginx: маршрутизация API', () => {
  const nextRoutes = collectNextApiRoutes(API_DIR)

  it('находит роуты и локации, иначе тест бессмысленный', () => {
    expect(nextRoutes.length).toBeGreaterThan(0)
    expect(locations.length).toBeGreaterThan(0)
    expect(nextRoutes).toContain('/api/subscribe')
    expect(nextRoutes).toContain('/api/estimate')
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
      `${route} попадает в "location ${matched!.pattern}" -> ${matched!.target}. ` +
        'Добавьте свой location-блок на frontend:3000, иначе роут ответит 404.'
    ).toContain('frontend:3000')
  })
})

describe('nginx: загруженные файлы', () => {
  /**
   * Пути из next.config.ts, которые переписываются на роуты Next.js.
   * Файлы физически лежат в томе backend/uploads, но отдаёт их фронтенд:
   * у FastAPI маршрута /uploads/ нет.
   */
  it('rewrite /uploads/ объявлен в next.config.ts', () => {
    const nextConfig = fs.readFileSync(NEXT_CONFIG, 'utf-8')
    expect(
      nextConfig,
      'исчез rewrite /uploads/:path* -> /api/uploads/:path*; тогда и nginx-блок надо пересматривать'
    ).toContain('/uploads/:path*')
  })

  /**
   * Разные расширения перечислены не для красоты: именно на них ломался
   * приоритет локаций. Картинки перехватывал regex-блок статики и они
   * работали, а pdf брифов и mp4 из админки уходили на бэкенд.
   */
  it.each([
    ['/uploads/images/9f1c.png', 'картинка проекта'],
    ['/uploads/images/9f1c.webp', 'превью'],
    ['/uploads/videos/9f1c.mp4', 'видео из админки'],
    ['/uploads/briefs/9f1c.pdf', 'бриф с формы сметы'],
    ['/uploads/briefs/9f1c.docx', 'бриф в документе'],
    ['/uploads/briefs/9f1c.zip', 'архив с референсами'],
  ])('%s отдаёт фронтенд (%s)', url => {
    const matched = resolve(locations, url)

    expect(matched, `нет подходящей location для ${url}`).toBeDefined()
    expect(
      matched!.target,
      `${url} попадает в "location ${matched!.pattern}" -> ${matched!.target}. ` +
        'У FastAPI нет маршрута /uploads/ — он ответит {"detail":"Not Found"}.'
    ).toContain('frontend:3000')
  })

  it('блок /uploads/ объявлен как ^~, иначе regex статики снова перехватит картинки', () => {
    const uploads = locations.find(item => item.pattern === '/uploads/')

    expect(uploads, 'блок location /uploads/ пропал из конфига').toBeDefined()
    expect(
      uploads!.kind,
      'без ^~ картинки уйдут в regex-блок статики, а остальные файлы — в этот; ' +
        'обработка станет разной для разных расширений'
    ).toBe('prefixNoRegex')
  })
})

describe('nginx: резолвер повторяет порядок выбора локаций nginx', () => {
  // Проверяем сам резолвер на синтетическом конфиге: если он ошибётся,
  // тесты выше будут зелёными на сломанном конфиге.
  const sample = `
server {
    location /api/thing {
        proxy_pass http://frontend:3000/api/thing;
    }
    location ~* \\.(png|jpg)$ {
        proxy_pass http://static:1234;
    }
    location ^~ /guarded/ {
        proxy_pass http://frontend:3000/guarded/;
    }
    location /guarded/deeper/ {
        proxy_pass http://backend:8000/guarded/deeper/;
    }
    location = /exact {
        proxy_pass http://exact:9999;
    }
    location / {
        proxy_pass http://frontend:3000;
    }
}
`
  const sampleLocations = parseLocations(sample)

  it('точное совпадение выигрывает у всего остального', () => {
    expect(resolve(sampleLocations, '/exact')!.target).toContain('exact:9999')
  })

  it('regex перехватывает путь у более короткого префикса', () => {
    expect(resolve(sampleLocations, '/whatever/pic.png')!.target).toContain('static:1234')
  })

  it('^~ отменяет проверку regex', () => {
    expect(resolve(sampleLocations, '/guarded/pic.png')!.target).toContain('frontend:3000/guarded/')
  })

  it('более длинный обычный префикс выигрывает у более короткого ^~', () => {
    expect(resolve(sampleLocations, '/guarded/deeper/file.txt')!.target).toContain('backend:8000')
  })

  it('без совпадений остаётся catch-all', () => {
    expect(resolve(sampleLocations, '/some/page')!.target).toContain('frontend:3000')
  })
})
