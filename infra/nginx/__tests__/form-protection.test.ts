/**
 * Защита публичных форм и лимиты тела запроса в nginx.
 *
 * Раньше серверный client_max_body_size был 100M и наследовался каждой локацией:
 * анонимный POST на /api/estimate (главный путь лидов) целиком буферизовался
 * nginx, а Next.js разбирал его синхронным JSON.parse в единственном процессе,
 * который отдаёт весь сайт. У сметы не было и limit_req. Вторая дыра — заголовок
 * X-Forwarded-For: $proxy_add_x_forwarded_for дописывает настоящий адрес к тому,
 * что прислал сам клиент, а приложение читает первый элемент, то есть подделку.
 *
 * Тесты фиксируют инварианты, а не конкретные числа блока: достаточно, чтобы
 * у каждой публичной формы были лимит частоты и небольшой лимит тела, чтобы
 * большой размер был только у загрузок файлов и чтобы клиентский XFF не доходил
 * до приложения. Реальную работу nginx проверяет ручной прогон `nginx -t` и curl.
 */
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const NGINX_CONF = path.join(REPO_ROOT, 'infra/nginx/conf.d/default.conf')

interface Node {
  /** Заголовок блока: `server`, `location ^~ /api/upload/brief` и т.п. */
  header: string
  /** Директивы блока без `;`, пробелы схлопнуты */
  directives: string[]
  children: Node[]
}

/** Комментарии могут содержать имена директив и переменных — смотрим только на код. */
function stripComments(source: string): string {
  return source
    .split('\n')
    .map(line => line.replace(/^\s*#.*$/, '').replace(/\s+#.*$/, ''))
    .join('\n')
}

/**
 * Минимальный разбор синтаксиса nginx: блоки `{}` и директивы `;`, с вложенностью.
 * Содержимое кавычек не разбирается: в `return 401 '{"detail":"..."}'` скобки и `;` — это текст.
 */
function parseNginx(source: string): Node {
  const root: Node = { header: '', directives: [], children: [] }
  const stack: Node[] = [root]
  let buffer = ''
  let quote = ''

  for (const char of stripComments(source)) {
    const current = stack[stack.length - 1]!
    if (quote) {
      buffer += char
      if (char === quote) quote = ''
    } else if (char === '"' || char === "'") {
      quote = char
      buffer += char
    } else if (char === '{') {
      const node: Node = {
        header: buffer.trim().replace(/\s+/g, ' '),
        directives: [],
        children: [],
      }
      current.children.push(node)
      stack.push(node)
      buffer = ''
    } else if (char === '}') {
      stack.pop()
      buffer = ''
    } else if (char === ';') {
      current.directives.push(buffer.trim().replace(/\s+/g, ' '))
      buffer = ''
    } else {
      buffer += char
    }
  }

  return root
}

/** Аргументы всех директив с таким именем: `proxy_set_header X-Real-IP $remote_addr` -> [`X-Real-IP $remote_addr`] */
function args(node: Node, name: string): string[] {
  return node.directives
    .filter(directive => directive === name || directive.startsWith(`${name} `))
    .map(directive => directive.slice(name.length).trim())
}

/** `64k`, `11m`, `100M`, `2m` -> байты. `0` в nginx отключает проверку, поэтому это Infinity. */
function toBytes(size: string): number {
  const match = size.match(/^(\d+)([kmg]?)$/i)
  if (!match) throw new Error(`Не разобрать размер: ${size}`)
  const value = Number(match[1])
  if (value === 0) return Infinity
  const unit = match[2]!.toLowerCase()
  const multiplier = unit === 'k' ? 1024 : unit === 'm' ? 1024 ** 2 : unit === 'g' ? 1024 ** 3 : 1
  return value * multiplier
}

const KB = 1024
const MB = 1024 * 1024

const source = fs.readFileSync(NGINX_CONF, 'utf-8')
const tree = parseNginx(source)

const mainServer = tree.children.find(
  node =>
    node.header === 'server' &&
    args(node, 'server_name').includes('savagemovie.ru') &&
    args(node, 'listen').includes('443 ssl')
)

if (!mainServer) throw new Error('Не найден основной HTTPS server-блок savagemovie.ru')

const locations = mainServer.children.filter(node => node.header.startsWith('location '))

function location(header: string): Node {
  const found = locations.find(node => node.header === header)
  if (!found) throw new Error(`Нет блока "${header}" в default.conf`)
  return found
}

const serverBodyLimit = toBytes(args(mainServer, 'client_max_body_size')[0] ?? '1m')

/** Лимит тела, который nginx реально применит к локации: собственный или унаследованный. */
function effectiveBodyLimit(node: Node): number {
  const own = args(node, 'client_max_body_size')[0]
  return own ? toBytes(own) : serverBodyLimit
}

/** Параметр rate= из объявления зоны: `rate=30r/m` -> `30r/m` */
function declaredRate(directive: 'limit_req_zone', zone: string): string | undefined {
  const declaration = args(tree, directive).find(item => item.includes(`zone=${zone}:`))
  return declaration?.match(/rate=(\S+)/)?.[1]
}

function zonesOf(directive: 'limit_req_zone' | 'limit_conn_zone'): Map<string, string> {
  const result = new Map<string, string>()
  for (const declaration of args(tree, directive)) {
    const match = declaration.match(/^(\S+)\s+zone=([^:\s]+):/)
    if (match) result.set(match[2]!, match[1]!)
  }
  return result
}

const zones = zonesOf('limit_req_zone')
const connZones = zonesOf('limit_conn_zone')

/**
 * Какая локация обработает путь, в порядке nginx: точное совпадение, самый длинный префикс
 * с ^~, первый подходящий regex, иначе самый длинный обычный префикс.
 */
function resolve(uri: string): Node {
  const parsed = locations.flatMap(node => {
    const match = node.header.match(/^location(?: (=|\^~|~\*|~))? (\S+)$/)
    return match ? [{ node, modifier: match[1] ?? '', pattern: match[2]! }] : []
  })

  const exact = parsed.find(item => item.modifier === '=' && item.pattern === uri)
  if (exact) return exact.node

  const longest = parsed
    .filter(item => ['', '^~'].includes(item.modifier) && uri.startsWith(item.pattern))
    .sort((a, b) => b.pattern.length - a.pattern.length)[0]
  if (longest?.modifier === '^~') return longest.node

  const regex = parsed.find(
    item =>
      ['~', '~*'].includes(item.modifier) &&
      new RegExp(item.pattern, item.modifier === '~*' ? 'i' : '').test(uri)
  )
  const found = regex ?? longest
  if (!found) throw new Error(`Ни одна локация не обрабатывает ${uri}`)
  return found.node
}

/** Публичные формы, которые принимают JSON и могут слать письма, Telegram и n8n. */
const LEAD_FORMS = ['location /api/contact', 'location /api/subscribe', 'location /api/estimate']

/** Публичная загрузка брифа: ^~ нужен, чтобы /api/upload/brief/ тоже попадал сюда, а не в админский блок */
const BRIEF = 'location ^~ /api/upload/brief'
/** Загрузки админки: тело до 100M, поэтому за ним стоят отсев по Authorization и лимиты */
const ADMIN_UPLOAD = 'location /api/upload/'

/** Единственные места, где разрешено тело больше серверного по умолчанию. */
const UPLOAD_LOCATIONS = {
  [ADMIN_UPLOAD]: 100 * MB,
  [BRIEF]: 11 * MB,
} as const

describe('nginx: разбор конфига для этих тестов', () => {
  it('находит основной сервер, локации и зоны, иначе остальные проверки пусты', () => {
    expect(locations.length).toBeGreaterThan(5)
    expect(zones.size).toBeGreaterThan(0)
  })

  it('понимает вложенные блоки и не принимает комментарии за код', () => {
    const sample = parseNginx(`
      # location /commented { client_max_body_size 1g; }
      server {
        client_max_body_size 1m; # хвост
        location /a {
          limit_except POST { deny all; }
          proxy_pass http://x:1;
        }
      }
    `)
    const server = sample.children[0]!
    expect(server.children).toHaveLength(1)
    expect(args(server, 'client_max_body_size')).toEqual(['1m'])
    expect(server.children[0]!.children[0]!.header).toBe('limit_except POST')
    expect(args(server.children[0]!, 'proxy_pass')).toEqual(['http://x:1'])
  })

  it('размеры считаются по правилам nginx, а 0 означает "без лимита"', () => {
    expect(toBytes('16k')).toBe(16 * KB)
    expect(toBytes('11m')).toBe(11 * MB)
    expect(toBytes('100M')).toBe(100 * MB)
    expect(toBytes('0')).toBe(Infinity)
  })
})

describe('nginx: лимит тела запроса', () => {
  it('серверный по умолчанию не больше 2 МБ (раньше было 100M для всех)', () => {
    expect(
      serverBodyLimit,
      'client_max_body_size на уровне server должен быть небольшим: его наследуют все /api/* без своего значения'
    ).toBeLessThanOrEqual(2 * MB)
  })

  it('больше серверного по умолчанию лимит только у загрузок файлов', () => {
    const raised = locations.filter(node => effectiveBodyLimit(node) > serverBodyLimit)

    expect(raised.map(node => node.header).sort()).toEqual(Object.keys(UPLOAD_LOCATIONS).sort())
  })

  it.each(Object.entries(UPLOAD_LOCATIONS))('%s: лимит не выше %d байт', (header, cap) => {
    expect(effectiveBodyLimit(location(header))).toBeLessThanOrEqual(cap)
  })

  it('публичный бриф вмещает файл в 10 МБ, который разрешает бэкенд', () => {
    // upload.py: MAX_BRIEF_SIZE = 10 MB; нужен запас на служебные части multipart
    expect(effectiveBodyLimit(location(BRIEF))).toBeGreaterThan(10 * MB)
  })

  it('нет локаций с отключённой проверкой тела (client_max_body_size 0)', () => {
    for (const node of [mainServer, ...locations]) {
      expect(effectiveBodyLimit(node), node.header).not.toBe(Infinity)
    }
  })

  it('бриф объявлен префиксом ^~ и выигрывает у админского /api/upload/', () => {
    const brief = location(BRIEF)

    expect(args(brief, 'proxy_pass')).toEqual(['http://backend:8000/api/upload/brief'])
    // ^~ длиннее префикса /api/upload/ и отменяет проверку regex; блок для админки остаётся
    expect(locations.map(node => node.header)).toContain(ADMIN_UPLOAD)
  })
})

describe('nginx: публичные формы', () => {
  it.each(LEAD_FORMS)('%s: есть limit_req по IP и ответ 429', header => {
    const node = location(header)
    const limits = args(node, 'limit_req')

    expect(limits, `у "${header}" нет limit_req — форму можно заливать заявками`).toHaveLength(1)

    const zone = limits[0]!.match(/zone=(\S+)/)?.[1]
    expect(zone, 'limit_req без zone=').toBeDefined()
    expect(zones.has(zone!), `зона ${zone} не объявлена через limit_req_zone`).toBe(true)
    expect(args(node, 'limit_req_status')).toEqual(['429'])
  })

  it.each(LEAD_FORMS)('%s: тело запроса не больше 64 КБ', header => {
    const node = location(header)

    expect(
      args(node, 'client_max_body_size'),
      `у "${header}" должен быть собственный client_max_body_size, не наследованный`
    ).toHaveLength(1)
    expect(effectiveBodyLimit(node)).toBeLessThanOrEqual(64 * KB)
  })

  it('смета вмещает длинный комментарий: лимит не меньше 32 КБ', () => {
    // Комментарий в форме без maxLength, сервер обрезает его до 2000 знаков, но
    // кириллица в JSON занимает по 2 байта. Слишком жёсткий лимит терял бы заявки.
    expect(effectiveBodyLimit(location('location /api/estimate'))).toBeGreaterThanOrEqual(32 * KB)
  })

  it('загрузка брифа ограничена по частоте, пока файл не прочитан', () => {
    const brief = location(BRIEF)
    const zone = args(brief, 'limit_req')[0]?.match(/zone=(\S+)/)?.[1]

    expect(zone, 'у публичной загрузки брифа нет limit_req').toBeDefined()
    expect(zones.has(zone!)).toBe(true)
    expect(args(brief, 'limit_req_status')).toEqual(['429'])
  })

  it('все зоны считают лимит по IP соединения, а не по заголовку, который шлёт клиент', () => {
    for (const [name, key] of [...zones, ...connZones]) {
      expect(key, `зона ${name}`).toBe('$binary_remote_addr')
    }
  })

  it('формы и загрузки не задают add_header: иначе nginx теряет заголовки безопасности server', () => {
    for (const header of [...LEAD_FORMS, BRIEF, ADMIN_UPLOAD]) {
      expect(args(location(header), 'add_header'), header).toEqual([])
    }
  })
})

describe('nginx: /api/upload/ — тело до 100M открыто из интернета', () => {
  // Токен проверяет только FastAPI, и до этого nginx принимает всё тело, а бэкенд
  // разбирает multipart. Поэтому и безымянный клиент, и частые запросы должны
  // отбиваться самим nginx, а брифу с публичной формы нужен собственный блок.
  const ADMIN = location(ADMIN_UPLOAD)

  it.each([
    ['/api/upload/brief', BRIEF],
    ['/api/upload/brief/', BRIEF],
    ['/api/upload/brief/x', BRIEF],
    ['/api/upload/image', ADMIN_UPLOAD],
    ['/api/upload/images', ADMIN_UPLOAD],
    ['/api/upload/video', ADMIN_UPLOAD],
    ['/api/upload/BRIEF', ADMIN_UPLOAD],
    ['/api/upload/x', ADMIN_UPLOAD],
  ])('%s обрабатывает блок "%s"', (uri, header) => {
    expect(resolve(uri).header).toBe(header)
  })

  it('все варианты пути брифа получают его лимит 11m, а не 100M админского блока', () => {
    for (const uri of ['/api/upload/brief', '/api/upload/brief/', '/api/upload/brief/.x']) {
      expect(effectiveBodyLimit(resolve(uri)), uri).toBeLessThanOrEqual(11 * MB)
    }
  })

  it('путь /api/upload/<имя>.png уходит в regex статики с серверным лимитом, а не в 100M', () => {
    const node = resolve('/api/upload/evil.png')

    expect(node.header).not.toBe(ADMIN_UPLOAD)
    expect(effectiveBodyLimit(node)).toBeLessThanOrEqual(serverBodyLimit)
  })

  it('есть limit_req по IP и ответ 429 (мягче лимита бэкенда: 10 в минуту)', () => {
    const limit = args(ADMIN, 'limit_req')[0]!
    const zone = limit.match(/zone=(\S+)/)?.[1]

    expect(zone, 'у /api/upload/ нет limit_req').toBeDefined()
    expect(zones.has(zone!)).toBe(true)
    expect(args(ADMIN, 'limit_req_status')).toEqual(['429'])

    // админ не должен упираться в nginx раньше бэкенда: 10 в минуту == 10r/m
    const rate = Number(declaredRate('limit_req_zone', zone!)?.match(/^(\d+)r\/m$/)?.[1])
    const burst = Number(limit.match(/burst=(\d+)/)?.[1])
    expect(rate).toBeGreaterThanOrEqual(10)
    expect(burst).toBeGreaterThanOrEqual(10)
  })

  it('число одновременных загрузок с IP ограничено (limit_conn), но не меньше пачки админки', () => {
    const [zone, limit] = (args(ADMIN, 'limit_conn')[0] ?? '').split(' ')

    expect(zone, 'у /api/upload/ нет limit_conn').toBeTruthy()
    expect(connZones.has(zone!)).toBe(true)
    expect(Number(limit)).toBeGreaterThanOrEqual(5)
    expect(Number(limit)).toBeLessThanOrEqual(20)
    expect(args(ADMIN, 'limit_conn_status')).toEqual(['429'])
  })

  it('запрос без Authorization отбивается кодом 401 с телом как у FastAPI, до чтения тела', () => {
    const gate = ADMIN.children.find(node => node.header === 'if ($upload_without_token)')

    expect(gate, 'нет if ($upload_without_token) { return 401 ... }').toBeDefined()
    expect(gate!.directives).toHaveLength(1)

    const reply = gate!.directives[0]!.match(/^return 401 '(.+)'$/)
    expect(reply, 'отбой должен быть return 401 с JSON').not.toBeNull()
    // клиент админки (lib/api/base.ts) показывает поле detail
    expect(JSON.parse(reply![1]!)).toEqual({ detail: expect.any(String) })
    expect(args(ADMIN, 'default_type')).toEqual(['application/json'])
  })

  it('proxy_pass стоит до блока if: разбор в api-routing читает тело локации до первой }', () => {
    const body = fs.readFileSync(NGINX_CONF, 'utf-8')
    const start = body.indexOf(`${ADMIN_UPLOAD} {`)

    expect(start).toBeGreaterThan(0)
    const block = body.slice(start)
    expect(block.indexOf('proxy_pass')).toBeGreaterThan(-1)
    expect(block.indexOf('proxy_pass')).toBeLessThan(block.indexOf('if ('))
  })

  describe('map $upload_without_token', () => {
    const mapNode = tree.children.find(
      node => node.header === 'map "$request_method:$http_authorization" $upload_without_token'
    )

    /** Значение по правилам map: сначала точные ключи, затем regex по порядку, иначе default */
    function lookup(method: string, authorization: string): string {
      const key = `${method}:${authorization}`
      let fallback = ''
      for (const directive of mapNode!.directives) {
        const match = directive.match(/^(?:"([^"]*)"|(\S+))\s+(\S+)$/)!
        const rule = match[1] ?? match[2]!
        if (rule === 'default') fallback = match[3]!
        else if (!rule.startsWith('~') && rule === key) return match[3]!
      }
      for (const directive of mapNode!.directives) {
        const match = directive.match(/^"~([^"]*)"\s+(\S+)$/)
        if (match && new RegExp(match[1]!).test(key)) return match[2]!
      }
      return fallback
    }

    it('объявлен на уровне http (рядом с зонами)', () => {
      expect(mapNode).toBeDefined()
    })

    it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'GET', 'HEAD', 'FOO'])(
      '%s без токена отбивается',
      method => {
        expect(lookup(method, '')).toBe('1')
      }
    )

    it.each([
      ['Bearer abc.def.ghi'],
      ['Bearer a:b'],
      ['Bearer abc:'], // двоеточие в конце токена не должно выглядеть как «пустой токен»
      ['Basic eDp5'],
    ])('POST с заголовком %j проходит к бэкенду (токен проверяет FastAPI)', authorization => {
      expect(lookup('POST', authorization)).toBe('0')
    })

    it('OPTIONS (CORS-preflight без Authorization) проходит с токеном и без него', () => {
      expect(lookup('OPTIONS', '')).toBe('0')
      expect(lookup('OPTIONS', 'Bearer abc')).toBe('0')
    })
  })
})

describe('nginx: X-Forwarded-For не берётся от клиента', () => {
  // включая именованный @media_frontend: он тоже ходит на фронтенд
  const proxied = locations.filter(node =>
    /^http:\/\/(frontend:3000|backend:8000)/.test(args(node, 'proxy_pass')[0] ?? '')
  )

  it('находит проксирующие локации, иначе проверка ниже пуста', () => {
    expect(proxied.length).toBeGreaterThan(10)
  })

  it('в конфиге нет $proxy_add_x_forwarded_for и $http_x_forwarded_for', () => {
    const code = stripComments(source)

    expect(code).not.toContain('$proxy_add_x_forwarded_for')
    expect(code).not.toContain('$http_x_forwarded_for')
  })

  it.each(proxied.map(node => [node.header, node] as const))(
    '%s: X-Real-IP = $remote_addr и X-Forwarded-Proto = $scheme',
    (_header, node) => {
      const headers = args(node, 'proxy_set_header')

      // приложение читает X-Real-IP первым (lib/leads/client-ip.ts, backend/app/rate_limit.py):
      // без явной подмены сюда доехал бы заголовок, который выдумал клиент
      expect(headers).toContain('X-Real-IP $remote_addr')
      expect(headers).toContain('X-Forwarded-Proto $scheme')
    }
  )

  it.each(proxied.map(node => [node.header, node] as const))(
    '%s: X-Forwarded-For = $remote_addr',
    (_header, node) => {
      const forwarded = args(node, 'proxy_set_header').filter(value =>
        value.toLowerCase().startsWith('x-forwarded-for ')
      )

      expect(
        forwarded,
        'без явного proxy_set_header nginx пробрасывает X-Forwarded-For клиента как есть'
      ).toEqual(['X-Forwarded-For $remote_addr'])
    }
  )
})
