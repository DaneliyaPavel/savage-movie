/**
 * Восстановление фабрики HLS после сетевых ошибок. hls.js подменён: нам важно,
 * какие методы фабрика дёргает и когда сдаётся, а не как работает сам плеер.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Handler = (event: string, data: unknown) => void

const instances: FakeHls[] = []

class FakeHls {
  static Events = {
    MANIFEST_PARSED: 'hlsManifestParsed',
    FRAG_BUFFERED: 'hlsFragBuffered',
    LEVEL_SWITCHED: 'hlsLevelSwitched',
    ERROR: 'hlsError',
  }
  static ErrorTypes = { NETWORK_ERROR: 'networkError', MEDIA_ERROR: 'mediaError' }
  static isSupported() {
    return true
  }

  handlers = new Map<string, Handler[]>()
  levels = [{ height: 360 }, { height: 720 }, { height: 1080 }]
  startLevel = -1
  autoLevelCapping = -1
  loadSource = vi.fn()
  attachMedia = vi.fn()
  startLoad = vi.fn()
  stopLoad = vi.fn()
  destroy = vi.fn()
  recoverMediaError = vi.fn()
  swapAudioCodec = vi.fn()

  constructor() {
    instances.push(this)
  }
  on(event: string, fn: Handler) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), fn])
  }
  emit(event: string, data?: unknown) {
    ;(this.handlers.get(event) ?? []).forEach(fn => fn(event, data))
  }
}

vi.mock('hls.js', () => ({ default: FakeHls }))

import { createHlsController } from '../hls-controller'

const networkFatal = (details: string) => ({
  fatal: true,
  type: 'networkError',
  details,
})

describe('createHlsController: восстановление', () => {
  beforeEach(() => {
    instances.length = 0
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  async function make(onFatal = vi.fn()) {
    const video = document.createElement('video')
    const controller = await createHlsController(video, {
      src: 'https://example.test/v/playlist.m3u8',
      useCase: 'background',
      onFatal,
    })
    return { controller, onFatal, hls: instances[0]! }
  }

  it('манифест не загрузился: повторяет loadSource, а не startLoad', async () => {
    const { hls } = await make()
    expect(hls.loadSource).toHaveBeenCalledTimes(1)

    hls.emit(FakeHls.Events.ERROR, networkFatal('manifestLoadError'))
    vi.advanceTimersByTime(1000)

    expect(hls.loadSource).toHaveBeenCalledTimes(2)
    expect(hls.loadSource).toHaveBeenLastCalledWith('https://example.test/v/playlist.m3u8')
    expect(hls.startLoad).not.toHaveBeenCalled()
  })

  it('после разбора манифеста сетевая ошибка продолжает загрузку через startLoad', async () => {
    const { hls } = await make()
    hls.emit(FakeHls.Events.MANIFEST_PARSED)
    hls.startLoad.mockClear()

    hls.emit(FakeHls.Events.ERROR, networkFatal('fragLoadError'))
    vi.advanceTimersByTime(1000)

    expect(hls.startLoad).toHaveBeenCalledTimes(1)
    expect(hls.loadSource).toHaveBeenCalledTimes(1)
  })

  it('три попытки с растущей паузой, затем сдаётся и сообщает наверх', async () => {
    const { hls, onFatal } = await make()

    for (const delay of [1000, 2000, 4000]) {
      hls.emit(FakeHls.Events.ERROR, networkFatal('manifestLoadTimeOut'))
      vi.advanceTimersByTime(delay - 1)
      const before = hls.loadSource.mock.calls.length
      vi.advanceTimersByTime(1)
      expect(hls.loadSource.mock.calls.length).toBe(before + 1)
    }
    expect(onFatal).not.toHaveBeenCalled()

    hls.emit(FakeHls.Events.ERROR, networkFatal('manifestLoadTimeOut'))
    expect(hls.destroy).toHaveBeenCalledTimes(1)
    expect(onFatal).toHaveBeenCalledWith('networkError:manifestLoadTimeOut')
  })

  it('уничтоженный контроллер не повторяет запрос', async () => {
    const { hls, controller } = await make()
    hls.emit(FakeHls.Events.ERROR, networkFatal('manifestLoadError'))
    controller.destroy()
    vi.advanceTimersByTime(5000)
    expect(hls.loadSource).toHaveBeenCalledTimes(1)
  })

  it('нефатальная ошибка ничего не запускает', async () => {
    const { hls, onFatal } = await make()
    hls.emit(FakeHls.Events.ERROR, { fatal: false, type: 'networkError', details: 'fragLoadError' })
    vi.advanceTimersByTime(10000)
    expect(hls.loadSource).toHaveBeenCalledTimes(1)
    expect(onFatal).not.toHaveBeenCalled()
  })
})
