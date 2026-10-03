#!/usr/bin/env node
/**
 * Сборка веб-медиа из мастера: превью-видео и постеры.
 *
 *   MASTER → превью desktop (MP4) → превью mobile (MP4) → постеры AVIF/WebP/JPEG
 *
 * Зачем скрипт. Фоновое видео сайта (hero, превью проектов) не должно идти
 * через HLS: адаптивный поток стартует с низкого качества, и посетитель видит
 * лесенку 360p → 1080p. Здесь делается короткий файл фиксированного качества,
 * а постер вырезается из кадра 0 ГОТОВОГО файла: тогда переход «постер → видео»
 * бесшовный, потому что это один и тот же кадр, а не «похожий».
 *
 * Скрипт НЕ запускается на проде: кодирование — локально, в CI или отдельным
 * заданием (см. docs/media-pipeline.md). Нужны ffmpeg ≥ 5 с libx264 и пакет
 * sharp (он уже лежит в node_modules как зависимость Next.js).
 *
 * Примеры:
 *   # посмотреть монтажные склейки, чтобы выбрать начало и конец превью
 *   node scripts/media/build-web-video.mjs --master master.mp4 --detect-cuts --from 0 --to 20
 *
 *   # собрать набор hero (то, что лежит в public/media)
 *   node scripts/media/build-web-video.mjs --key showreel --master master.mp4 \
 *     --hls 83ad0e8e-c614-46fd-8324-2c26659ad721 --start 0 --end 8.04 --out public/media
 *
 *   # прогнать лесенку CRF и сравнить размер и SSIM (ничего не пишет в manifest)
 *   node scripts/media/build-web-video.mjs --master master.mp4 --end 8.04 --candidates 24,26,28
 *
 * Мастер может быть путём к файлу или http(s)-ссылкой на него (ffmpeg читает
 * её сам). Результат: файлы с хэшем содержимого в имени (безопасно отдавать
 * с immutable-кэшем) и запись в lib/media/manifest.json.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const require = createRequire(import.meta.url)

/**
 * Профили кодирования. Подобраны на реальном материале (шоурил, 25 к/с,
 * мастер 50 Мбит/с H.264): лесенка CRF, SSIM к мастеру и кадры в 100% рядом
 * с мастером. Ниже CRF 28 на коже и ткани появляется заметное сглаживание,
 * выше 25 на десктопе разница с мастером глазом не читается, а файл дороже
 * на 25–40%. Подробности: docs/media-pipeline.md.
 *
 * Мобильный профиль кодируется ЧУТЬ чище: на экране с DPR 3 каждый пиксель
 * кадра растягивается в 2,3 раза, и артефакты видны сильнее.
 */
const TARGETS = {
  desktop: {
    aspect: [16, 9],
    maxWidth: 1920,
    maxHeight: 1080,
    crf: 27,
    maxrate: '6M',
    bufsize: '8M',
  },
  mobile: {
    aspect: [9, 16],
    maxWidth: 1080,
    maxHeight: 1080,
    crf: 25,
    maxrate: '3M',
    bufsize: '4M',
  },
}

/** Ширины постеров. Меньшая нужна экранам DPR 1, большая — родное разрешение превью. */
const POSTER_WIDTHS = {
  desktop: [1280, 1920],
  mobile: [405, 608],
}

const POSTER_QUALITY = { avif: 62, webp: 80, jpeg: 82 }

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) out[key] = true
    else {
      out[key] = next
      i++
    }
  }
  return out
}

function fail(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

function run(cmd, args, { allowFail = false, capture = true } = {}) {
  const res = spawnSync(cmd, args, {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })
  if (res.error) fail(`Не удалось запустить ${cmd}: ${res.error.message}`)
  if (res.status !== 0 && !allowFail) {
    fail(
      `${cmd} завершился с кодом ${res.status}\n${(res.stderr || '').split('\n').slice(-12).join('\n')}`
    )
  }
  return res
}

function checkTools() {
  const ff = run('ffmpeg', ['-hide_banner', '-version'], { allowFail: true })
  if (ff.status !== 0)
    fail('Не найден ffmpeg. Установите ffmpeg ≥ 5 (apt install ffmpeg / brew install ffmpeg).')
  if (
    !/--enable-libx264/.test(
      run('ffmpeg', ['-hide_banner', '-buildconf'], { allowFail: true }).stdout || ''
    )
  ) {
    const enc = run('ffmpeg', ['-hide_banner', '-encoders'], { allowFail: true }).stdout || ''
    if (!/libx264/.test(enc)) fail('ffmpeg собран без libx264.')
  }
  const probe = run('ffprobe', ['-version'], { allowFail: true })
  if (probe.status !== 0) fail('Не найден ffprobe.')
}

function probe(file) {
  const res = run('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file])
  return JSON.parse(res.stdout)
}

function parseRate(value) {
  const [n, d] = String(value).split('/').map(Number)
  return d ? n / d : n
}

function even(n) {
  const v = Math.round(n)
  return v % 2 === 0 ? v : v + 1
}

/**
 * Геометрия цели: «cover» из исходного кадра, ровно как CSS object-fit: cover
 * (поэтому постер и видео ложатся друг на друга без сдвига). Вырезаем из центра
 * нужное соотношение сторон и только уменьшаем, никогда не растягиваем.
 */
export function planGeometry(srcW, srcH, target) {
  const [aw, ah] = target.aspect
  const aspect = aw / ah
  let cropW = srcW
  let cropH = srcH
  if (srcW / srcH > aspect) cropW = even(srcH * aspect)
  else cropH = even(srcW / aspect)
  cropW = Math.min(cropW, srcW - (srcW % 2))
  cropH = Math.min(cropH, srcH - (srcH % 2))
  const x = Math.floor((srcW - cropW) / 2 / 2) * 2
  const y = Math.floor((srcH - cropH) / 2 / 2) * 2
  const scale = Math.min(1, target.maxWidth / cropW, target.maxHeight / cropH)
  const outW = even(cropW * scale)
  const outH = even(cropH * scale)
  return { crop: { w: cropW, h: cropH, x, y }, out: { w: outW, h: outH }, scaled: scale < 1 }
}

function sha8(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8)
}

/** Читает первые байты MP4 и проверяет, что moov стоит перед mdat (faststart). */
export function isFaststart(file) {
  const fd = readFileSync(file)
  let offset = 0
  let moov = -1
  let mdat = -1
  while (offset + 8 <= fd.length && (moov < 0 || mdat < 0)) {
    let size = fd.readUInt32BE(offset)
    const type = fd.toString('ascii', offset + 4, offset + 8)
    if (size === 1) size = Number(fd.readBigUInt64BE(offset + 8))
    if (type === 'moov' && moov < 0) moov = offset
    if (type === 'mdat' && mdat < 0) mdat = offset
    if (size < 8) break
    offset += size
  }
  return moov >= 0 && mdat >= 0 && moov < mdat
}

function detectCuts(master, from, to) {
  const args = ['-hide_banner', '-nostats']
  if (from) args.push('-ss', String(from))
  if (to) args.push('-t', String(to - (from || 0)))
  args.push(
    '-i',
    master,
    '-vf',
    "scale=320:-1,select='gt(scene,0.18)',metadata=print:key=lavfi.scene_score",
    '-an',
    '-f',
    'null',
    '-'
  )
  const res = run('ffmpeg', args, { allowFail: true })
  const lines = (res.stderr || '').split('\n')
  const cuts = []
  for (const line of lines) {
    const m = /pts_time:([0-9.]+)/.exec(line)
    if (m) cuts.push(Number(m[1]) + (from || 0))
  }
  return cuts
}

function encodePreview({ master, probeInfo, start, frames, fps, target, outFile, crf }) {
  const video = probeInfo.streams.find(s => s.codec_type === 'video')
  const geo = planGeometry(video.width, video.height, target)
  const filters = []
  if (geo.crop.w !== video.width || geo.crop.h !== video.height) {
    filters.push(`crop=${geo.crop.w}:${geo.crop.h}:${geo.crop.x}:${geo.crop.y}`)
  }
  if (geo.scaled) filters.push(`scale=${geo.out.w}:${geo.out.h}:flags=lanczos`)

  const args = ['-hide_banner', '-loglevel', 'error', '-y']
  if (start > 0) args.push('-ss', String(start))
  args.push('-i', master)
  if (filters.length) args.push('-vf', filters.join(','))
  args.push(
    // Без звука вообще: дорожки нет, а не «приглушена»
    '-an',
    '-frames:v',
    String(frames),
    '-r',
    String(fps),
    '-c:v',
    'libx264',
    '-preset',
    'veryslow',
    '-tune',
    'film',
    '-crf',
    String(crf),
    '-maxrate',
    target.maxrate,
    '-bufsize',
    target.bufsize,
    // aq-mode=3 держит бюджет на тёмных сценах (меньше бэндинга в градиентах);
    // keyint=100 — GOP не длиннее 4 с, склейки монтажа получают свой IDR сами
    '-x264-params',
    'aq-mode=3:aq-strength=0.9:ref=5:bframes=4:b-adapt=2:rc-lookahead=60:keyint=100:min-keyint=12',
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
    // moov в начале файла: браузер получает метаданные первым же куском
    '-movflags',
    '+faststart',
    outFile
  )
  run('ffmpeg', args)
  return geo
}

function verifyPreview(file, expected) {
  const info = probe(file)
  const streams = info.streams
  const video = streams.find(s => s.codec_type === 'video')
  const problems = []
  if (!video) problems.push('нет видеодорожки')
  if (streams.some(s => s.codec_type === 'audio')) problems.push('в файле есть звуковая дорожка')
  if (video) {
    if (video.codec_name !== 'h264') problems.push(`кодек ${video.codec_name}, ожидался h264`)
    if (video.profile !== 'High') problems.push(`профиль ${video.profile}, ожидался High`)
    if (video.pix_fmt !== 'yuv420p') problems.push(`pix_fmt ${video.pix_fmt}, ожидался yuv420p`)
    if (video.width !== expected.w || video.height !== expected.h) {
      problems.push(`размер ${video.width}×${video.height}, ожидался ${expected.w}×${expected.h}`)
    }
  }
  if (!isFaststart(file)) problems.push('moov стоит после mdat (нет faststart)')
  if (problems.length) fail(`Проверка ${file} не пройдена:\n  - ${problems.join('\n  - ')}`)

  const duration = parseFloat(video.duration || info.format.duration)
  const bytes = statSync(file).size
  return {
    codec: `avc1.${video.profile === 'High' ? '64' : '4d'}00${Number(video.level).toString(16).padStart(2, '0')}`,
    profile: video.profile,
    pixFmt: video.pix_fmt,
    width: video.width,
    height: video.height,
    fps: Number(parseRate(video.r_frame_rate).toFixed(3)),
    frames: Number(video.nb_frames) || undefined,
    duration: Number(duration.toFixed(3)),
    bytes,
    bitrate: Math.round((bytes * 8) / duration),
    faststart: true,
    audio: false,
  }
}

/** Кадр 0 готового файла в PNG без потерь, с той же матрицей цвета, что у плеера. */
function extractFrameZero(file, pngFile) {
  run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    file,
    '-frames:v',
    '1',
    '-vf',
    'scale=in_range=limited:out_range=full:in_color_matrix=bt709:out_color_matrix=bt709',
    '-pix_fmt',
    'rgb24',
    pngFile,
  ])
}

async function loadSharp() {
  try {
    return require('sharp')
  } catch {
    fail('Не найден пакет sharp. Выполните npm ci в корне репозитория.')
  }
}

async function buildPosters({ sharp, pngFile, key, targetName, outDir, tmpDir }) {
  const widths = POSTER_WIDTHS[targetName]
  const meta = await sharp(pngFile).metadata()
  const maxW = widths[widths.length - 1]
  const result = { width: meta.width, height: meta.height, avif: [], webp: [], jpeg: null }

  async function emit(format, width) {
    const w = Math.min(width, meta.width)
    const h = Math.round((meta.height * w) / meta.width)
    const base = `${key}-poster-${targetName}-${w}`
    const tmp = join(tmpDir, `${base}.${format === 'jpeg' ? 'jpg' : format}`)
    let pipeline = sharp(pngFile).resize(w, h, { kernel: 'lanczos3' })
    if (format === 'avif')
      pipeline = pipeline.avif({
        quality: POSTER_QUALITY.avif,
        effort: 6,
        chromaSubsampling: '4:2:0',
      })
    if (format === 'webp')
      pipeline = pipeline.webp({ quality: POSTER_QUALITY.webp, effort: 6, smartSubsample: true })
    if (format === 'jpeg')
      pipeline = pipeline.jpeg({ quality: POSTER_QUALITY.jpeg, mozjpeg: true, progressive: true })
    await pipeline.toFile(tmp)
    const hash = sha8(tmp)
    const ext = format === 'jpeg' ? 'jpg' : format
    const file = `${base}.${hash}.${ext}`
    renameSync(tmp, join(outDir, file))
    return { w, h, file, bytes: statSync(join(outDir, file)).size }
  }

  for (const w of widths) result.avif.push(await emit('avif', w))
  result.webp.push(await emit('webp', maxW))
  result.jpeg = await emit('jpeg', maxW)
  return result
}

/** Средний цвет и крошечное размытое превью: фон, пока постер едет по сети. */
async function buildPlaceholder(sharp, pngFile) {
  const { data } = await sharp(pngFile)
    .resize(1, 1, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true })
  const hex = `#${[data[0], data[1], data[2]].map(v => v.toString(16).padStart(2, '0')).join('')}`
  const tiny = await sharp(pngFile)
    .resize(24, undefined, { kernel: 'lanczos3' })
    .webp({ quality: 40 })
    .toBuffer()
  return { color: hex, lqip: `data:image/webp;base64,${tiny.toString('base64')}` }
}

function loadManifest(path) {
  if (!existsSync(path)) return { version: 1, assets: {} }
  return JSON.parse(readFileSync(path, 'utf8'))
}

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

function runCandidates({ master, probeInfo, start, frames, fps, list, tmpDir }) {
  const video = probeInfo.streams.find(s => s.codec_type === 'video')
  const rows = []
  for (const crf of list) {
    for (const name of ['desktop', 'mobile']) {
      const target = { ...TARGETS[name] }
      const file = join(tmpDir, `cand-${name}-crf${crf}.mp4`)
      const geo = encodePreview({
        master,
        probeInfo,
        start,
        frames,
        fps,
        target,
        outFile: file,
        crf,
      })
      const bytes = statSync(file).size
      const dur = frames / fps
      const cropFilter =
        geo.crop.w !== video.width || geo.crop.h !== video.height
          ? `crop=${geo.crop.w}:${geo.crop.h}:${geo.crop.x}:${geo.crop.y},`
          : ''
      const refScale = geo.scaled ? `scale=${geo.out.w}:${geo.out.h}:flags=lanczos,` : ''
      const trimStart =
        start > 0
          ? `trim=start=${start}:end_frame=${Math.round(start * fps) + frames},setpts=PTS-STARTPTS,`
          : `trim=end_frame=${frames},setpts=PTS-STARTPTS,`
      const res = run(
        'ffmpeg',
        [
          '-hide_banner',
          '-nostats',
          '-i',
          file,
          '-i',
          master,
          '-lavfi',
          `[0:v]setpts=PTS-STARTPTS[a];[1:v]${trimStart}${cropFilter}${refScale}setpts=PTS-STARTPTS[b];[a][b]ssim`,
          '-f',
          'null',
          '-',
        ],
        { allowFail: true }
      )
      const ssim = /All:([0-9.]+)/.exec(res.stderr || '')?.[1]
      rows.push({
        target: name,
        crf,
        mb: (bytes / 1e6).toFixed(2),
        mbps: ((bytes * 8) / dur / 1e6).toFixed(2),
        ssim: ssim ?? '?',
      })
    }
  }
  console.table(rows)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || args.h || !args.master) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0] + '*/')
    process.exit(args.master ? 0 : 1)
  }

  checkTools()
  const master = String(args.master)
  if (!/^https?:\/\//.test(master) && !existsSync(master)) fail(`Мастер не найден: ${master}`)

  const probeInfo = probe(master)
  const video = probeInfo.streams.find(s => s.codec_type === 'video')
  if (!video) fail('В мастере нет видеодорожки.')
  const srcFps = parseRate(video.avg_frame_rate || video.r_frame_rate)
  const srcDuration = parseFloat(video.duration || probeInfo.format.duration)

  if (args['detect-cuts']) {
    const from = Number(args.from ?? 0)
    const to = Number(args.to ?? Math.min(srcDuration, from + 30))
    const cuts = detectCuts(master, from, to)
    console.log(
      `Склейки в ${from}–${to} с (подходящие концы превью — точно на склейке, тогда петля бесшовная):`
    )
    console.log(cuts.map(c => c.toFixed(2)).join(', ') || '(не найдены)')
    return
  }

  const start = Number(args.start ?? 0)
  const end = Number(args.end ?? Math.min(srcDuration, 8))
  if (!(end > start)) fail('--end должен быть больше --start.')
  if (end > srcDuration + 0.001)
    fail(`--end ${end} больше длины мастера ${srcDuration.toFixed(2)} с.`)
  // Частоту оставляем исходной: пересчёт 25 → 24 даёт рывки, а выигрыша в размере нет
  const fps = args.fps ? Number(args.fps) : Number(srcFps.toFixed(3))
  const frames = Math.round((end - start) * fps)

  const tmpDir = resolve(String(args.tmp ?? join(ROOT, 'media-build', '.tmp')))
  mkdirSync(tmpDir, { recursive: true })

  if (args.candidates) {
    const list = String(args.candidates).split(',').map(Number).filter(Boolean)
    runCandidates({ master, probeInfo, start, frames, fps, list, tmpDir })
    return
  }

  const key = String(args.key ?? '')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(key))
    fail('Нужен --key (латиница, цифры, дефис), например showreel или project-wellery.')
  const outDir = resolve(String(args.out ?? join(ROOT, 'media-build')))
  mkdirSync(outDir, { recursive: true })
  const manifestPath = resolve(String(args.manifest ?? join(ROOT, 'lib', 'media', 'manifest.json')))
  const sharp = await loadSharp()

  const entry = {
    master: String(
      args['master-label'] ??
        (/^https?:\/\//.test(master) ? master : `file:${master.split('/').pop()}`)
    ),
    preview: { start, end, fps, frames },
    poster: {},
  }
  if (args.hls) entry.stream = { hls: String(args.hls) }

  for (const name of ['desktop', 'mobile']) {
    const target = { ...TARGETS[name] }
    if (args[`crf-${name}`]) target.crf = Number(args[`crf-${name}`])
    console.log(`▶ ${name}: кодирую ${frames} кадров (${start}–${end} с), CRF ${target.crf}`)
    const tmpVideo = join(tmpDir, `${key}-${name}.mp4`)
    const geo = encodePreview({
      master,
      probeInfo,
      start,
      frames,
      fps,
      target,
      outFile: tmpVideo,
      crf: target.crf,
    })
    const verified = verifyPreview(tmpVideo, geo.out)
    if (verified.frames && verified.frames !== frames) {
      fail(`${name}: в файле ${verified.frames} кадров, ожидалось ${frames}`)
    }
    const hash = sha8(tmpVideo)
    const file = `${key}-preview-${name}.${hash}.mp4`
    renameSync(tmpVideo, join(outDir, file))
    entry.preview[name] = { file, ...verified, crf: target.crf }
    console.log(
      `  ✓ ${file}  ${(verified.bytes / 1e6).toFixed(2)} МБ, ${(verified.bitrate / 1e6).toFixed(2)} Мбит/с, ${verified.width}×${verified.height}`
    )

    // Постер строго из кадра 0 только что собранного файла
    const png = join(tmpDir, `${key}-${name}-frame0.png`)
    extractFrameZero(join(outDir, file), png)
    entry.poster[name] = await buildPosters({
      sharp,
      pngFile: png,
      key,
      targetName: name,
      outDir,
      tmpDir,
    })
    if (name === 'desktop') Object.assign(entry, await buildPlaceholder(sharp, png))
    const sizes = [...entry.poster[name].avif, ...entry.poster[name].webp, entry.poster[name].jpeg]
      .map(p => `${p.file.split('.').slice(-1)[0]}:${p.w}=${(p.bytes / 1024).toFixed(0)}КБ`)
      .join(' ')
    console.log(`  ✓ постеры ${name}: ${sizes}`)
  }

  const manifest = loadManifest(manifestPath)
  manifest.assets[key] = entry
  mkdirSync(dirname(manifestPath), { recursive: true })
  writeFileSync(manifestPath, JSON.stringify(sortKeys(manifest), null, 2) + '\n')
  console.log(`✓ manifest обновлён: ${manifestPath}`)
  console.log(`  Файлы лежат в ${outDir}. Имена содержат хэш — отдавать можно с immutable-кэшем.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => fail(error?.stack || String(error)))
}
