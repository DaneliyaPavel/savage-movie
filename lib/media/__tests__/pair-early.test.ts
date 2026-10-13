/**
 * Ранний старт пары (pair-early.ts): скрипт исполняется как инлайн в HTML, поэтому его
 * проверяют в разметке, а не импортом функции.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PAIR_EARLY_SCRIPT } from '../pair-early'

function mount() {
  document.body.innerHTML = `
    <div data-pair-early>
      <video data-pair-side="before" data-src-d="/media/b-d.mp4" data-src-m="/media/b-m.mp4" preload="none"></video>
      <video data-pair-side="after" data-src-d="/media/a-d.mp4" data-src-m="/media/a-m.mp4" preload="none"></video>
    </div>`
  return [...document.querySelectorAll('video')]
}

function run() {
  new Function(PAIR_EARLY_SCRIPT)()
}

function mockMedia(options: { reduced?: boolean; mobile?: boolean }) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('reduced-motion') ? !!options.reduced : !!options.mobile,
    media: query,
  })) as unknown as typeof window.matchMedia
}

describe('PAIR_EARLY_SCRIPT', () => {
  beforeEach(() => {
    mockMedia({})
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('ставит десктопные адреса и preload=auto обеим сторонам', () => {
    const videos = mount()
    run()
    expect(videos.map(v => v.getAttribute('src'))).toEqual(['/media/b-d.mp4', '/media/a-d.mp4'])
    expect(videos.map(v => v.preload)).toEqual(['auto', 'auto'])
  })

  it('на мобильном берёт мобильные файлы', () => {
    mockMedia({ mobile: true })
    const videos = mount()
    run()
    expect(videos.map(v => v.getAttribute('src'))).toEqual(['/media/b-m.mp4', '/media/a-m.mp4'])
  })

  it('при reduced-motion ничего не качает', () => {
    mockMedia({ reduced: true })
    const videos = mount()
    run()
    expect(videos.map(v => v.getAttribute('src'))).toEqual([null, null])
  })

  it('при Save-Data и 2g ничего не качает', () => {
    for (const connection of [{ saveData: true }, { effectiveType: '2g' }]) {
      vi.stubGlobal('navigator', { connection })
      const videos = mount()
      run()
      expect(videos.map(v => v.getAttribute('src'))).toEqual([null, null])
    }
  })

  it('без пары из двух видео или без адреса не делает ничего и не падает', () => {
    document.body.innerHTML = '<div data-pair-early><video data-pair-side="after"></video></div>'
    expect(() => run()).not.toThrow()
    expect(document.querySelector('video')?.getAttribute('src')).toBeNull()

    document.body.innerHTML = '<p>нет корня</p>'
    expect(() => run()).not.toThrow()
  })
})
