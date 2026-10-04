/**
 * HTTP/2 на основном сайте.
 *
 * Раньше главная отдавалась по HTTP/1.1: браузер держит до шести соединений на хост,
 * а у главной больше 80 файлов (скрипты, шрифты, постеры, превью), и они вставали
 * в очередь друг за другом. HTTP/2 пускает всё по одному соединению и не меняет ни
 * адреса, ни тела, ни заголовки ответов.
 *
 * Что фиксируют тесты:
 *  - `http2 on;` стоит на уровне server у основного сайта и у www. Сертификат у них
 *    общий, поэтому браузер может отправить запрос на www по уже открытому h2-соединению
 *    к savagemovie.ru, а сервер без http2 отвечает на такой запрос 421.
 *  - директива именно на уровне server: внутри location nginx её не принимает.
 *  - старая форма `listen 443 ssl http2;` не нужна: с nginx 1.25.1 она считается устаревшей.
 *  - сервер, который только обрывает чужие рукопожатия (ssl_reject_handshake), h2 не получает.
 * Живую работу проверяет `nginx -t` на деплое и ручной прогон curl --http2.
 */
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const CONF_DIR = path.join(REPO_ROOT, 'infra/nginx/conf.d')

interface Node {
  header: string
  directives: string[]
  children: Node[]
}

/** Комментарии могут содержать имена директив — смотрим только на код. */
function stripComments(source: string): string {
  return source
    .split('\n')
    .map(line => line.replace(/^\s*#.*$/, '').replace(/\s+#.*$/, ''))
    .join('\n')
}

/** Минимальный разбор синтаксиса nginx: блоки `{}` и директивы `;`, кавычки не разбираются. */
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

function args(node: Node, name: string): string[] {
  return node.directives
    .filter(directive => directive === name || directive.startsWith(`${name} `))
    .map(directive => directive.slice(name.length).trim())
}

function servers(file: string): Node[] {
  const tree = parseNginx(fs.readFileSync(path.join(CONF_DIR, file), 'utf-8'))
  return tree.children.filter(node => node.header === 'server')
}

const confFiles = fs.readdirSync(CONF_DIR).filter(file => file.endsWith('.conf'))
const allServers = confFiles.flatMap(file => servers(file).map(server => ({ file, server })))

const tlsServers = allServers.filter(({ server }) =>
  args(server, 'listen').some(listen => /^443\b.*\bssl\b/.test(listen))
)
const rejectingServers = tlsServers.filter(
  ({ server }) => args(server, 'ssl_reject_handshake')[0] === 'on'
)
const servingServers = tlsServers.filter(
  ({ server }) => !rejectingServers.some(r => r.server === server)
)

const findServer = (name: string) =>
  servingServers.find(({ server }) => args(server, 'server_name').includes(name))

describe('nginx: HTTP/2', () => {
  it('основной сайт savagemovie.ru включает http2 один раз на уровне server', () => {
    const main = findServer('savagemovie.ru')
    expect(main, 'пропал HTTPS server для savagemovie.ru').toBeDefined()
    expect(args(main!.server, 'http2')).toEqual(['on'])
  })

  it('www.savagemovie.ru тоже включает http2: общий сертификат, иначе запрос на www по h2 получит 421', () => {
    const www = findServer('www.savagemovie.ru')
    expect(www, 'пропал HTTPS server для www.savagemovie.ru').toBeDefined()
    expect(args(www!.server, 'http2')).toEqual(['on'])
  })

  it('каждый обслуживающий HTTPS-сервер включает http2 на своём уровне', () => {
    expect(servingServers.length).toBeGreaterThanOrEqual(3)
    for (const { file, server } of servingServers) {
      const names = args(server, 'server_name').join(' ')
      expect(args(server, 'http2'), `${file}: ${names}`).toEqual(['on'])
    }
  })

  it('http2 не стоит внутри location и других вложенных блоков', () => {
    const nested = (node: Node): Node[] => node.children.flatMap(child => [child, ...nested(child)])
    for (const { file, server } of allServers) {
      for (const child of nested(server)) {
        expect(args(child, 'http2'), `${file}: ${child.header}`).toEqual([])
      }
    }
  })

  it('устаревшая форма `listen ... http2` не используется', () => {
    for (const { file, server } of allServers) {
      for (const listen of args(server, 'listen')) {
        expect(listen, `${file}: listen ${listen}`).not.toMatch(/\bhttp2\b/)
      }
    }
  })

  it('сервер, обрывающий чужие рукопожатия, остаётся без http2 и без сайта', () => {
    expect(rejectingServers.length).toBeGreaterThanOrEqual(1)
    for (const { file, server } of rejectingServers) {
      expect(args(server, 'http2'), file).toEqual([])
      expect(args(server, 'return'), file).toEqual(['444'])
    }
  })
})
