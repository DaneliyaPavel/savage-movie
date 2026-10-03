#!/usr/bin/env node
/**
 * Пакетная сборка превью для всех проектов портфолио (профиль project).
 *
 * Берёт список проектов из API сайта (или из файла), для каждого находит мастер
 * на Bunny (`<cdn>/<id>/original`, читаются только первые секунды) и вызывает
 * build-web-video.mjs. Файлы и манифест пишутся ОТДЕЛЬНО от репозитория: десятки
 * мегабайт видео в git не нужны, они едут на VDS в /var/www/savage-media, а
 * манифест вливается вторым шагом (scripts/media/merge-manifest.mjs).
 *
 *   node scripts/media/build-projects.mjs \
 *     --api https://savagemovie.ru/api/projects \
 *     --cdn https://vz-a08b303a-cb8.b-cdn.net \
 *     --out media-build/files --manifest media-build/manifest.projects.json
 *
 * Параметры:
 *   --projects-json f.json   список проектов из файла вместо --api
 *   --only slug,slug         только эти проекты
 *   --end 8                  длина превью, секунд (по умолчанию 8, но не больше фильма)
 *   --ranges ranges.json     {"slug": {"start": 2, "end": 9.5}} — своё окно для проекта
 *   --force                  пересобрать, даже если запись уже есть в манифесте
 *
 * Если фильм начинается с чёрного кадра (плашка, затемнение), начало превью
 * сдвигается за него: постер из нулевого кадра не должен быть чёрным.
 * Запуск повторяемый: проекты с готовой записью пропускаются.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..', '..')
const BUILD = join(HERE, 'build-web-video.mjs')
const MAX_BLACK_SKIP = 5

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue
    const key = argv[i].slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) out[key] = true
    else {
      out[key] = next
      i++
    }
  }
  return out
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

function probeDuration(url) {
  const res = spawnSync(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', url],
    { encoding: 'utf8' }
  )
  const value = parseFloat((res.stdout || '').trim())
  return Number.isFinite(value) ? value : null
}

/** Длина чёрного начала (секунды), если фильм открывается чёрным кадром */
function leadingBlack(url) {
  const res = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-nostats',
      '-t',
      String(MAX_BLACK_SKIP + 1),
      '-i',
      url,
      '-vf',
      'blackdetect=d=0.12:pix_th=0.08',
      '-an',
      '-f',
      'null',
      '-',
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )
  const m = /black_start:0(?:\.0+)?\s+black_end:([0-9.]+)/.exec(res.stderr || '')
  return m ? Math.min(Number(m[1]), MAX_BLACK_SKIP) : 0
}

async function loadProjects(args) {
  if (args['projects-json']) return JSON.parse(readFileSync(String(args['projects-json']), 'utf8'))
  if (!args.api) {
    console.error('Нужен --api <url> или --projects-json <файл>')
    process.exit(1)
  }
  const res = await fetch(String(args.api))
  if (!res.ok) throw new Error(`API ответил ${res.status}`)
  return res.json()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.cdn || !args.out || !args.manifest) {
    console.error(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0] + '*/')
    process.exit(1)
  }
  const cdn = String(args.cdn).replace(/\/+$/, '')
  const manifestPath = resolve(String(args.manifest))
  const existing = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null
  const ranges = args.ranges ? JSON.parse(readFileSync(String(args.ranges), 'utf8')) : {}
  const only = args.only ? new Set(String(args.only).split(',')) : null
  const wantedLength = Number(args.end ?? 8)

  const projects = (await loadProjects(args)).filter(p => !only || only.has(p.slug))
  const results = []

  for (const project of projects) {
    const id = UUID.exec(project.mux_playback_id || project.video_url || '')?.[0]
    if (!id) {
      results.push({ slug: project.slug, status: 'пропущен: нет id видео' })
      continue
    }
    const key = `project-${project.slug}`
    if (existing?.assets?.[key] && !args.force) {
      results.push({ slug: project.slug, status: 'уже собран' })
      continue
    }

    const master = `${cdn}/${id}/original`
    const duration = probeDuration(master)
    if (!duration) {
      results.push({ slug: project.slug, status: 'пропущен: мастер недоступен' })
      continue
    }

    const own = ranges[project.slug]
    const skip = own ? 0 : leadingBlack(master)
    const start = own?.start ?? (skip > 0.05 ? Math.ceil(skip * 25) / 25 : 0)
    const end = Math.min(own?.end ?? start + wantedLength, duration)
    if (end - start < 2) {
      results.push({
        slug: project.slug,
        status: `пропущен: слишком короткий фильм (${duration}s)`,
      })
      continue
    }

    console.log(`\n=== ${project.slug} (${id}) ${start.toFixed(2)}–${end.toFixed(2)} с ===`)
    const run = spawnSync(
      process.execPath,
      [
        BUILD,
        '--profile',
        'project',
        '--key',
        key,
        '--master',
        master,
        '--master-label',
        `bunny:${id}/original`,
        '--hls',
        id,
        '--start',
        String(start),
        '--end',
        String(end),
        '--out',
        resolve(String(args.out)),
        '--manifest',
        manifestPath,
      ],
      { stdio: 'inherit', cwd: ROOT }
    )
    results.push({
      slug: project.slug,
      status:
        run.status === 0
          ? `готово ${start.toFixed(2)}–${end.toFixed(2)}`
          : `ОШИБКА (код ${run.status})`,
    })
  }

  console.log('\nИтог:')
  console.table(results)
  if (results.some(r => r.status.startsWith('ОШИБКА'))) process.exit(1)
}

main().catch(error => {
  console.error(error?.stack || String(error))
  process.exit(1)
})
