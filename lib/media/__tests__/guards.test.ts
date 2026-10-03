/**
 * Архитектурные стражи медиа-слоя.
 *
 * 1. hls.js создаётся в одном месте. До фабрики `new Hls({...})` лежал в
 *    одиннадцати файлах с разными настройками, и «починить» один из них
 *    значило оставить десять сломанными.
 * 2. Загрузчик в <head> — сгенерированный файл: исходник правят, а в страницу
 *    попадает минифицированная копия. Устаревшая копия молча меняет поведение
 *    продакшена, поэтому её свежесть проверяется тестом.
 * 3. Hero не может потерять приоритет: <video> с preload, <link rel=preload as=video>
 *    и анимированные картинки в первом экране вернули бы старую гонку за канал.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { MEDIA_BOOT_SCRIPT } from '../boot/boot.generated'

const ROOT = path.resolve(__dirname, '../../..')
const SOURCE_DIRS = ['app', 'components', 'features', 'lib']
const SKIP_DIRS = new Set(['node_modules', '.next', '__tests__'])

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) out.push(...sourceFiles(path.join(dir, entry.name)))
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      out.push(path.join(dir, entry.name))
    }
  }
  return out
}

const files = SOURCE_DIRS.flatMap(dir => sourceFiles(path.join(ROOT, dir)))
const rel = (file: string) => path.relative(ROOT, file)

describe('hls.js создаётся только в фабрике', () => {
  const FACTORY = path.join(ROOT, 'lib/media/hls-controller.ts')

  it('находит исходники, иначе тест бессмысленный', () => {
    expect(files.length).toBeGreaterThan(50)
    expect(files).toContain(FACTORY)
  })

  it('нет `new Hls(` вне lib/media/hls-controller.ts', () => {
    const offenders = files
      .filter(file => file !== FACTORY)
      .filter(file => /new\s+Hls\s*\(/.test(readFileSync(file, 'utf8')))
      .map(rel)
    expect(offenders, 'используйте createHlsController / useHlsSource').toEqual([])
  })

  it('нет рантайм-импорта hls.js вне фабрики (import type разрешён)', () => {
    const offenders = files
      .filter(file => file !== FACTORY)
      .filter(file => {
        const source = readFileSync(file, 'utf8')
        return (
          /import\s*\(\s*['"]hls\.js['"]\s*\)/.test(source) ||
          /import\s+(?!type\b)[^'"\n]*from\s+['"]hls\.js['"]/.test(source)
        )
      })
      .map(rel)
    expect(offenders).toEqual([])
  })
})

describe('загрузчик в <head> актуален', () => {
  it('boot.generated.ts совпадает с тем, что собирается из boot.ts', () => {
    // отдельным процессом: скрипт — ESM с top-level await и esbuild, типы ему не нужны
    expect(() =>
      execFileSync(process.execPath, ['scripts/media/build-boot.mjs', '--check'], {
        cwd: ROOT,
        stdio: 'pipe',
      })
    ).not.toThrow()
  })

  it('скрипт небольшой: он на критическом пути <head>', () => {
    expect(MEDIA_BOOT_SCRIPT.length).toBeGreaterThan(1000)
    expect(MEDIA_BOOT_SCRIPT.length).toBeLessThan(24 * 1024)
  })

  it('скрипт не ломает HTML: нет закрывающего тега script', () => {
    expect(MEDIA_BOOT_SCRIPT.toLowerCase()).not.toContain('</script')
  })
})

describe('медиа-поверхность', () => {
  const surface = readFileSync(path.join(ROOT, 'components/media/motion-surface.tsx'), 'utf8')

  it('<video> рендерится без src и без preload: источник назначает загрузчик', () => {
    const video = surface.match(/<video\s[\s\S]*?\/>/)?.[0] ?? ''
    expect(video).toContain('preload="none"')
    expect(video).not.toMatch(/\ssrc=/)
    expect(video).toContain('muted')
    expect(video).toContain('playsInline')
  })

  it('нет <link rel="preload" as="video">: он качает видео в обход решения загрузчика', () => {
    const offenders = files
      .filter(file => /rel=["']preload["'][^>]*as=["']video["']/.test(readFileSync(file, 'utf8')))
      .map(rel)
    expect(offenders).toEqual([])
  })
})
