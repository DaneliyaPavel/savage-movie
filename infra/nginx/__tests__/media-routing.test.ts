/**
 * Веб-медиа (/media/*): вечный кеш, Range/206 и фолбэк на фронтенд.
 *
 * Имена файлов в /media содержат хеш содержимого, поэтому immutable безопасен —
 * и именно поэтому его нельзя потерять: без него каждый заход заново проверяет
 * несколько мегабайт видео. Второй риск — приоритет локаций: regex статики
 * (.webp/.jpg) перехватил бы постеры, и они ушли бы с 30-дневным кешем.
 * Safari не проигрывает MP4 без ответа 206 на Range, поэтому файлы отдаёт
 * статикой nginx, а фолбэк — фронтенд, который тоже обязан понимать Range.
 */
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = path.resolve(__dirname, '../../..')
const conf = fs.readFileSync(path.join(REPO_ROOT, 'infra/nginx/conf.d/default.conf'), 'utf-8')
const compose = fs.readFileSync(path.join(REPO_ROOT, 'docker-compose.yml'), 'utf-8')
const nextConfig = fs.readFileSync(path.join(REPO_ROOT, 'next.config.ts'), 'utf-8')

function block(source: string, header: string): string {
  const start = source.indexOf(header)
  if (start === -1) return ''
  const open = source.indexOf('{', start)
  const close = source.indexOf('}', open)
  return source.slice(open + 1, close)
}

const IMMUTABLE = 'public, max-age=31536000, immutable'

describe('nginx: /media/', () => {
  const media = block(conf, 'location ^~ /media/')
  const fallback = block(conf, 'location @media_frontend')

  it('объявлен как ^~: regex статики не должен его перехватывать', () => {
    expect(media, 'пропал location ^~ /media/').not.toBe('')
  })

  it('отдаёт файлы из тома, а при их отсутствии идёт на фронтенд', () => {
    expect(media).toMatch(/root\s+\/srv;/)
    expect(media).toMatch(/try_files\s+\$uri\s+@media_frontend;/)
  })

  it('кеш вечный, но без always: ошибки 403/404/5xx не должны закрепляться на год', () => {
    expect(media).toContain(`add_header Cache-Control "${IMMUTABLE}";`)
    expect(media).not.toMatch(/Cache-Control[^\n]*always/)
  })

  it('фолбэк проксирует на фронтенд, а не на бэкенд, и не подменяет его Cache-Control', () => {
    expect(fallback, 'пропал именованный location @media_frontend').not.toBe('')
    expect(fallback).toContain('proxy_pass http://frontend:3000;')
    expect(fallback).not.toContain('backend:8000')
    // 404 фронтенда остаётся no-store, а успешный ответ несёт immutable из next.config.ts
    expect(fallback).not.toContain('proxy_hide_header Cache-Control')
    expect(fallback).not.toMatch(/add_header Cache-Control/)
  })

  it('локация стоит раньше regex статики и Next-статики', () => {
    const mediaAt = conf.indexOf('location ^~ /media/')
    expect(mediaAt).toBeGreaterThan(-1)
    expect(mediaAt).toBeLessThan(conf.indexOf('location ~* \\.(svg|png|ico|webp|jpg|jpeg)$'))
  })

  it('не включает gzip для видео и не отключает Range', () => {
    expect(media).not.toMatch(/max_ranges\s+0/)
    expect(media).not.toMatch(/gzip\s+on/)
  })

  it('прокси Bunny остаётся на месте: HLS полного фильма по-прежнему идёт через /cdn', () => {
    expect(conf).toContain('location ^~ /cdn/')
    expect(conf).toContain('vz-a08b303a-cb8.b-cdn.net')
  })
})

describe('том и заголовки Next.js', () => {
  it('docker-compose монтирует том с медиа в nginx только на чтение', () => {
    expect(compose).toMatch(/\/var\/www\/savage-media:\/srv\/media:ro/)
  })

  it('next.config.ts даёт /media/* тот же immutable (dev и прямой доступ)', () => {
    expect(nextConfig).toContain('/media/:path*')
    expect(nextConfig).toContain(IMMUTABLE)
  })
})
