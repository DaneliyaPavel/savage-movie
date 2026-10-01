#!/usr/bin/env node
/**
 * Локальный сервер для страницы ai.savagemovie.ru (sites/ai).
 *
 *   node scripts/ai-dev-server.mjs [порт]        # по умолчанию 4310
 *
 * Раздаёт sites/ai как статику и подменяет POST /api/lead заглушкой,
 * чтобы проверять форму без отправки писем на hello@savagemovie.ru.
 *
 * Управление заглушкой (GET-запросом из браузера или curl):
 *   /__mode?m=ok      заявка принята (по умолчанию)
 *   /__mode?m=fail    сервер отвечает 500
 *   /__mode?m=limit   сервер отвечает 429
 *   /__mode?m=slow    ответ приходит через 25 с (проверка таймаута)
 *   /__mode?m=bad     200 без поля success
 *   /__last           последняя принятая заявка и все пришедшие заголовки Content-Type
 */
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('../sites/ai', import.meta.url)))
const PORT = Number(process.argv[2] || process.env.PORT || 4310)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8',
}

let mode = 'ok'
let last = null
const log = []

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (url.pathname === '/__mode') {
    mode = url.searchParams.get('m') || 'ok'
    return json(res, 200, { mode })
  }
  if (url.pathname === '/__last') return json(res, 200, { mode, last, log })

  if (url.pathname === '/api/lead') {
    if (req.method !== 'POST') return json(res, 405, { error: 'POST only' })
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      let body = null
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        return json(res, 400, { error: 'bad json' })
      }
      last = { at: new Date().toISOString(), contentType: req.headers['content-type'], body }
      log.push(last)
      console.log('[lead]', JSON.stringify(body))
      if (mode === 'fail') return json(res, 500, { error: 'Ошибка отправки заявки' })
      if (mode === 'limit') return json(res, 429, { error: 'Too Many Requests' })
      if (mode === 'bad') return json(res, 200, { ok: true })
      if (mode === 'slow') return void setTimeout(() => json(res, 200, { success: true }), 25000)
      return json(res, 200, { success: true })
    })
    return
  }

  let rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
  if (rel.endsWith('/') || rel === '') rel = join(rel, 'index.html')
  const file = join(ROOT, rel)
  if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('404')
  }
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  })
  createReadStream(file).pipe(res)
})

server.listen(PORT, () => {
  console.log(`ai.savagemovie.ru dev: http://localhost:${PORT}  (корень: ${ROOT})`)
})
