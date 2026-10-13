#!/usr/bin/env node
/**
 * Сборка пар «до ИИ / после ИИ» для /ai-video: два синхронных MP4 и постеры из нулевого кадра.
 *
 *   node scripts/media/build-compare-pairs.mjs --pair student \
 *     --before Студент.mp4 --after hf_20261004_175943_….mp4 --out public/media
 *
 * Зачем отдельный скрипт. Hero и превью проектов — один ролик на поверхность, а здесь два файла
 * должны совпадать КАДР В КАДР: шов режет картинку пополам, и любой сдвиг по времени виден как
 * «прыжок» руки или губ. Поэтому «до» приводится к таймлинии «после» (скорость, частота кадров,
 * длина), оба файла кодируются одинаково, а постеры берутся из нулевого кадра готовых MP4,
 * как в build-web-video.mjs.
 *
 * Параметры пар лежат в PAIRS ниже: скорость (`speed`) — во сколько раз «до» длиннее «после» на том же
 * действии. Измерено сопоставлением движения (корреляция энергии движения, затем проверка сдвига
 * по окнам: расхождение ≤ 1 кадра на всей длине). Мобильный кроп — вертикаль вокруг героя кадра.
 *
 * Результат: файлы с хэшем содержимого в имени (public/media) и запись в lib/media/compare-pairs.json.
 * Нужны ffmpeg ≥ 5 с libx264 и sharp (уже в node_modules). На VDS скрипт не запускают.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const require = createRequire(import.meta.url)
const OUT_JSON = join(ROOT, 'lib', 'media', 'compare-pairs.json')

const FPS = 24

/**
 * speed: «до» растянуто/сжато на этот коэффициент (setpts=PTS/speed), чтобы действие совпало с «после».
 * mobile: кроп в долях исходного кадра 1920×1080 — [x от центра героя, соотношение сторон].
 */
const PAIRS = {
  student: { speed: 1.0225, mobile: { aspect: [9, 16], centerX: 0.505, width: 608, height: 1080 } },
  lech: { speed: 1.031, mobile: { aspect: [4, 5], centerX: 0.53, width: 720, height: 900 } },
}

const DESKTOP = { width: 1920, height: 1080, crf: 27, maxrate: '6M', bufsize: '8M' }
const MOBILE_CRF = 26
const POSTER_QUALITY = { avif: 62, jpeg: 82 }

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue
    out[argv[i].slice(2)] = argv[i + 1]
    i++
  }
  return out
}

function fail(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  if (res.error) fail(`Не удалось запустить ${cmd}: ${res.error.message}`)
  if (res.status !== 0) fail(`${cmd}: ${(res.stderr || '').split('\n').slice(-10).join('\n')}`)
  return res.stdout
}

const sha8 = file => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8)

function probe(file) {
  const info = JSON.parse(
    run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file])
  )
  const video = info.streams.find(s => s.codec_type === 'video')
  return { width: video.width, height: video.height, duration: Number(info.format.duration) }
}

/** Фильтр «до»: скорость → 24 к/с → кадр 1920×1080 (кроп, если мастер не 16:9 до пикселя) */
function filterFor(side, pair, geometry, crop) {
  const filters = []
  if (side === 'before') filters.push(`setpts=PTS/${pair.speed}`)
  filters.push(`fps=${FPS}`)
  filters.push(`scale=${DESKTOP.width}:${DESKTOP.height}:flags=lanczos`)
  if (crop) filters.push(`crop=${crop.w}:${crop.h}:${crop.x}:0`)
  filters.push(`scale=${geometry.width}:${geometry.height}:flags=lanczos`)
  filters.push('format=yuv420p')
  return filters.join(',')
}

function encode({ input, vf, frames, crf, maxrate, bufsize, outFile }) {
  run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    input,
    '-an',
    '-vf',
    vf,
    '-frames:v',
    String(frames),
    '-c:v',
    'libx264',
    '-preset',
    'veryslow',
    '-tune',
    'film',
    '-crf',
    String(crf),
    '-maxrate',
    maxrate,
    '-bufsize',
    bufsize,
    // GOP 2 с без сцен-детекта: у обоих файлов ключевые кадры в одних и тех же местах,
    // перемотка при синхронизации не уходит на разные границы
    '-x264-params',
    `aq-mode=3:aq-strength=0.9:ref=5:bframes=3:keyint=${FPS * 2}:min-keyint=${FPS * 2}:scenecut=0`,
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-level:v',
    '4.1',
    '-colorspace',
    'bt709',
    '-color_primaries',
    'bt709',
    '-color_trc',
    'bt709',
    '-color_range',
    'tv',
    '-movflags',
    '+faststart',
    outFile,
  ])
}

async function posters(sharp, mp4, base, outDir, width) {
  const work = mkdtempSync(join(tmpdir(), 'pair-poster-'))
  const png = join(work, 'frame0.png')
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp4, '-frames:v', '1', png])
  const img = sharp(png)
  const meta = await img.metadata()
  const height = Math.round((meta.height * width) / meta.width)
  const resized = () => sharp(png).resize(width, height, { kernel: 'lanczos3' })
  const stats = await sharp(png).resize(16, 9, { fit: 'fill' }).removeAlpha().stats()
  const [r, g, b] = stats.channels.map(c => Math.round(c.mean))
  const color = `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`

  const files = {}
  for (const [fmt, opts] of [
    ['avif', { avif: { quality: POSTER_QUALITY.avif, effort: 6 } }],
    ['jpeg', { jpeg: { quality: POSTER_QUALITY.jpeg, mozjpeg: true } }],
  ]) {
    const ext = fmt === 'jpeg' ? 'jpg' : fmt
    const tmp = join(work, `p.${ext}`)
    await resized().toFormat(fmt, opts[fmt]).toFile(tmp)
    const name = `${base}.${sha8(tmp)}.${ext}`
    renameSync(tmp, join(outDir, name))
    files[fmt] = { file: name, w: width, h: height, bytes: statSync(join(outDir, name)).size }
  }
  return { color, ...files }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const pair = PAIRS[args.pair]
  if (!pair) fail(`--pair: ${Object.keys(PAIRS).join(' | ')}`)
  if (!args.before || !args.after) fail('Нужны --before и --after (мастера «до» и «после»)')
  const outDir = resolve(ROOT, args.out || 'public/media')
  mkdirSync(outDir, { recursive: true })
  const sharp = require('sharp')

  const after = probe(args.after)
  const before = probe(args.before)
  const frames = Math.round(after.duration * FPS)
  const needed = frames / FPS
  if (before.duration / pair.speed < needed - 0.05) {
    fail(`«До» с учётом скорости короче «после»: ${(before.duration / pair.speed).toFixed(2)} с`)
  }

  const m = pair.mobile
  const cropW = Math.round((DESKTOP.height * m.aspect[0]) / m.aspect[1] / 2) * 2
  const cropX = Math.round((DESKTOP.width * m.centerX - cropW / 2) / 2) * 2
  const mobileCrop = { w: cropW, h: DESKTOP.height, x: Math.max(0, cropX) }

  const record = {
    fps: FPS,
    frames,
    duration: Number((frames / FPS).toFixed(3)),
    speed: pair.speed,
  }
  const tmpBase = mkdtempSync(join(tmpdir(), 'pair-video-'))

  for (const side of ['before', 'after']) {
    record[side] = {}
    const input = side === 'before' ? args.before : args.after
    for (const kind of ['desktop', 'mobile']) {
      const geometry =
        kind === 'desktop'
          ? { width: DESKTOP.width, height: DESKTOP.height }
          : { width: m.width, height: m.height }
      const tmp = join(tmpBase, `${side}-${kind}.mp4`)
      encode({
        input,
        vf: filterFor(side, pair, geometry, kind === 'mobile' ? mobileCrop : null),
        frames,
        crf: kind === 'desktop' ? DESKTOP.crf : MOBILE_CRF,
        maxrate: kind === 'desktop' ? DESKTOP.maxrate : '3M',
        bufsize: kind === 'desktop' ? DESKTOP.bufsize : '4M',
        outFile: tmp,
      })
      const base = `ai-${args.pair}-${side}-${kind}`
      const name = `${base}.${sha8(tmp)}.mp4`
      renameSync(tmp, join(outDir, name))
      const file = join(outDir, name)
      const posterWidth = geometry.width
      record[side][kind] = {
        video: { file: name, ...geometry, bytes: statSync(file).size },
        poster: await posters(sharp, file, `${base}-poster`, outDir, posterWidth),
      }
      console.log(`✓ ${name}  ${(statSync(file).size / 1024).toFixed(0)} КБ`)
    }
  }

  let all = { version: 1, pairs: {} }
  try {
    all = JSON.parse(readFileSync(OUT_JSON, 'utf8'))
  } catch {
    // файла ещё нет — создаём
  }
  all.pairs[args.pair] = record
  writeFileSync(OUT_JSON, `${JSON.stringify(all, null, 2)}\n`)
  console.log(`✓ запись «${args.pair}» в ${OUT_JSON}`)
}

main()
