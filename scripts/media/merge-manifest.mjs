#!/usr/bin/env node
/**
 * Вливает записи из отдельного манифеста (например, media-build/manifest.projects.json)
 * в lib/media/manifest.json. Второй шаг выкладки «сначала файлы, потом манифест»:
 * запускается ТОЛЬКО после того, как файлы лежат на VDS в /var/www/savage-media
 * (иначе страницы начнут просить MP4, которых ещё нет, и вернутся к постеру).
 *
 *   node scripts/media/merge-manifest.mjs media-build/manifest.projects.json
 *   node scripts/media/merge-manifest.mjs media-build/manifest.projects.json --check-files /var/www/savage-media
 *
 * --check-files <каталог> отказывается сливать, если хотя бы одного файла из записей
 * нет в каталоге: так нельзя случайно включить превью без файлов.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MANIFEST = join(ROOT, 'lib', 'media', 'manifest.json')

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map(k => [k, sortKeys(value[k])])
    )
  }
  return value
}

/** Все имена файлов, на которые ссылается запись манифеста */
export function filesOf(asset) {
  const files = []
  for (const name of ['desktop', 'mobile']) {
    if (asset.preview?.[name]?.file) files.push(asset.preview[name].file)
    const poster = asset.poster?.[name]
    if (poster) {
      for (const variant of [...(poster.avif ?? []), ...(poster.webp ?? []), poster.jpeg]) {
        if (variant?.file) files.push(variant.file)
      }
    }
  }
  return files
}

function main() {
  const args = process.argv.slice(2)
  const patchPath = args.find(arg => !arg.startsWith('--'))
  if (!patchPath) {
    console.error('Укажите файл с записями: node scripts/media/merge-manifest.mjs <patch.json>')
    process.exit(1)
  }
  const checkAt = args.indexOf('--check-files')
  const filesDir = checkAt >= 0 ? args[checkAt + 1] : null

  const patch = JSON.parse(readFileSync(resolve(patchPath), 'utf8'))
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))

  if (filesDir) {
    const missing = Object.entries(patch.assets).flatMap(([key, asset]) =>
      filesOf(asset)
        .filter(file => !existsSync(join(filesDir, file)))
        .map(file => `${key}: ${file}`)
    )
    if (missing.length) {
      console.error(`Нет файлов в ${filesDir}, манифест не изменён:\n  ${missing.join('\n  ')}`)
      process.exit(1)
    }
  }

  const keys = Object.keys(patch.assets)
  for (const key of keys) manifest.assets[key] = patch.assets[key]
  writeFileSync(MANIFEST, JSON.stringify(sortKeys(manifest), null, 2) + '\n')
  console.log(`✓ влито записей: ${keys.length} (${keys.join(', ')})`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
