#!/usr/bin/env node
/**
 * Собирает lib/media/boot/boot.ts в одну минифицированную строку
 * lib/media/boot/boot.generated.ts. Строка вставляется инлайном в <head>,
 * поэтому у загрузчика нет отдельного запроса и он работает до гидратации.
 *
 *   npm run media:boot            — пересобрать
 *   node scripts/media/build-boot.mjs --check   — проверить, что файл свежий (тест делает то же)
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const entry = resolve(root, 'lib/media/boot/boot-entry.ts')
const out = resolve(root, 'lib/media/boot/boot.generated.ts')

export async function renderBootModule() {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2019',
    legalComments: 'none',
    write: false,
    logLevel: 'silent',
  })
  const code = result.outputFiles[0].text.trim()
  const hash = createHash('sha256').update(code).digest('hex').slice(0, 8)
  return [
    '// Файл сгенерирован scripts/media/build-boot.mjs из lib/media/boot/boot.ts.',
    '// Руками не править: npm run media:boot (проверяется тестом lib/media/__tests__/boot-generated.test.ts).',
    `export const MEDIA_BOOT_HASH = '${hash}'`,
    `export const MEDIA_BOOT_SCRIPT = ${JSON.stringify(code)}`,
    '',
  ].join('\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const next = await renderBootModule()
  if (process.argv.includes('--check')) {
    const current = readFileSync(out, 'utf8')
    if (current !== next) {
      console.error('boot.generated.ts устарел: запустите npm run media:boot')
      process.exit(1)
    }
    console.log('boot.generated.ts актуален')
  } else {
    writeFileSync(out, next)
    console.log(`boot.generated.ts: ${(next.length / 1024).toFixed(1)} КБ`)
  }
}
