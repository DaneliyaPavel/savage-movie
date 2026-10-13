/**
 * Хук синхронного воспроизведения пары «до / после»: старт, подтяжка «до» к «после»,
 * остановка вне экрана и поведение без движения. Видео в jsdom нет, поэтому у элементов
 * подменяются play/pause/load и поля готовности — проверяется логика хука, а не декодер.
 */
import { act, cleanup, render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { usePairPlayback } from '../use-pair-playback'

interface FakeVideo extends HTMLVideoElement {
  __time: number
}

/** early — адрес уже поставил ранний скрипт из HTML (lib/media/pair-early.ts) до гидратации */
function Pair({ eager = true, early = false }: { eager?: boolean; early?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  usePairPlayback(ref, { eager })
  return (
    <div ref={ref} data-testid="root">
      {(['before', 'after'] as const).map(side => (
        <video
          key={side}
          ref={node => {
            if (early && node && !node.getAttribute('src')) {
              node.setAttribute('src', `/media/${side}-d.mp4`)
            }
          }}
          data-pair-side={side}
          data-src-d={`/media/${side}-d.mp4`}
          data-src-m={`/media/${side}-m.mp4`}
          muted
          preload="none"
        />
      ))}
    </div>
  )
}

function stubVideo(video: HTMLVideoElement): FakeVideo {
  const fake = video as FakeVideo
  let time = 0
  let paused = true
  Object.defineProperty(fake, 'currentTime', {
    get: () => time,
    set: (value: number) => {
      time = value
    },
    configurable: true,
  })
  Object.defineProperty(fake, 'paused', { get: () => paused, configurable: true })
  Object.defineProperty(fake, 'duration', { get: () => 8, configurable: true })
  Object.defineProperty(fake, 'readyState', { value: 4, writable: true, configurable: true })
  fake.play = vi.fn(() => {
    paused = false
    return Promise.resolve()
  })
  fake.pause = vi.fn(() => {
    paused = true
  })
  fake.load = vi.fn()
  return fake
}

function mockMatchMedia(reduced: boolean, mobile = false) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('reduced-motion') ? reduced : query.includes('max-width') && mobile,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

class FakeObserver {
  static last: FakeObserver | null = null
  constructor(public callback: IntersectionObserverCallback) {
    FakeObserver.last = this
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

describe('usePairPlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'readyState', { value: 'complete', configurable: true })
    vi.stubGlobal('IntersectionObserver', FakeObserver)
    // jsdom не реализует медиа-методы: хук вызывает load() ещё до того, как тест подменит элементы
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
  })

  afterEach(() => {
    // размонтирование вызывает load(): снимаем подмены уже после него
    cleanup()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('при reduced-motion остаётся постером: источник не назначается', () => {
    mockMatchMedia(true)
    const { getByTestId } = render(<Pair />)
    const root = getByTestId('root')
    expect(root.dataset.pairState).toBe('poster')
    for (const video of root.querySelectorAll('video')) {
      expect(video.getAttribute('src')).toBeNull()
    }
  })

  it('на десктопе берёт data-src-d, на мобильном data-src-m', () => {
    mockMatchMedia(false, false)
    const desktop = render(<Pair />)
    const sources = [...desktop.getByTestId('root').querySelectorAll('video')].map(v =>
      v.getAttribute('src')
    )
    expect(sources).toEqual(['/media/before-d.mp4', '/media/after-d.mp4'])
    desktop.unmount()

    mockMatchMedia(false, true)
    const mobile = render(<Pair />)
    const phone = [...mobile.getByTestId('root').querySelectorAll('video')].map(v =>
      v.getAttribute('src')
    )
    expect(phone).toEqual(['/media/before-m.mp4', '/media/after-m.mp4'])
  })

  it('берёт адрес, который уже поставил ранний скрипт, и не перезапускает загрузку', () => {
    mockMatchMedia(false)
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load')
    const { getByTestId } = render(<Pair early />)
    const root = getByTestId('root')
    expect(root.dataset.pairState).toBe('loading')
    expect(load).not.toHaveBeenCalled()
    const sources = [...root.querySelectorAll('video')].map(v => v.getAttribute('src'))
    expect(sources).toEqual(['/media/before-d.mp4', '/media/after-d.mp4'])
  })

  it('первый экран стартует сразу после монтирования, без события load', () => {
    mockMatchMedia(false)
    Object.defineProperty(document, 'readyState', { value: 'loading', configurable: true })
    const { getByTestId } = render(<Pair />)
    expect(getByTestId('root').dataset.pairState).toBe('loading')
  })

  it('открывает видео, только когда обе стороны играют вровень', async () => {
    mockMatchMedia(false)
    const { getByTestId } = render(<Pair />)
    const root = getByTestId('root')
    const [before, after] = (['before', 'after'] as const).map(side =>
      stubVideo(root.querySelector(`video[data-pair-side="${side}"]`) as HTMLVideoElement)
    ) as [FakeVideo, FakeVideo]
    expect(root.dataset.pairState).toBe('loading')

    // «до» ушло вперёд на полсекунды: пара не открывается, «до» подтягивается
    before.currentTime = 0.5
    after.currentTime = 0.2
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(before.play).toHaveBeenCalled()
    expect(after.play).toHaveBeenCalled()
    expect(before.currentTime).toBeCloseTo(after.currentTime, 3)

    after.currentTime = 0.3
    before.currentTime = 0.3
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(root.dataset.pairState).toBe('live')
  })

  it('большой разбег лечится перемоткой «до» к «после»', async () => {
    mockMatchMedia(false)
    const { getByTestId } = render(<Pair />)
    const root = getByTestId('root')
    const [before, after] = (['before', 'after'] as const).map(side =>
      stubVideo(root.querySelector(`video[data-pair-side="${side}"]`) as HTMLVideoElement)
    ) as [FakeVideo, FakeVideo]
    after.currentTime = 1
    before.currentTime = 1
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    // оба уже играют; «до» убежало на 0,4 с
    before.currentTime = 1.4
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(before.currentTime).toBeCloseTo(after.currentTime, 3)
  })

  it('граница петли не считается разрывом: 7,98 с и 0,02 с — это отставание на 0,04 с', async () => {
    mockMatchMedia(false)
    const { getByTestId } = render(<Pair />)
    const root = getByTestId('root')
    const [before, after] = (['before', 'after'] as const).map(side =>
      stubVideo(root.querySelector(`video[data-pair-side="${side}"]`) as HTMLVideoElement)
    ) as [FakeVideo, FakeVideo]
    after.currentTime = 1
    before.currentTime = 1
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    before.currentTime = 7.98
    after.currentTime = 0.02
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    // перемотки не было: «до» отстало на 0,04 с и догоняет скоростью, а не прыжком на начало
    expect(before.currentTime).toBeCloseTo(7.98, 2)
    expect(before.playbackRate).toBeGreaterThan(1)
  })

  it('вне экрана оба видео стоят', async () => {
    mockMatchMedia(false)
    const { getByTestId } = render(<Pair />)
    const root = getByTestId('root')
    const [before, after] = (['before', 'after'] as const).map(side =>
      stubVideo(root.querySelector(`video[data-pair-side="${side}"]`) as HTMLVideoElement)
    ) as [FakeVideo, FakeVideo]
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(before.paused).toBe(false)
    act(() => {
      FakeObserver.last?.callback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        FakeObserver.last as unknown as IntersectionObserver
      )
    })
    expect(before.paused).toBe(true)
    expect(after.paused).toBe(true)
  })

  it('отказ автозапуска оставляет постер', async () => {
    mockMatchMedia(false)
    const { getByTestId } = render(<Pair />)
    const root = getByTestId('root')
    const [before, after] = (['before', 'after'] as const).map(side =>
      stubVideo(root.querySelector(`video[data-pair-side="${side}"]`) as HTMLVideoElement)
    ) as [FakeVideo, FakeVideo]
    before.play = vi.fn(() => Promise.reject(new Error('NotAllowedError')))
    after.play = vi.fn(() => Promise.reject(new Error('NotAllowedError')))
    await act(async () => {
      vi.advanceTimersByTime(250)
    })
    expect(root.dataset.pairState).toBe('failed')
  })
})
