import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { ServicesHero } from '../services-hero'

vi.mock('@/components/sections/commercial/lazy-hls-video', () => ({
  LazyHlsVideo: ({ playbackId }: { playbackId: string }) => (
    <div data-testid="reel" data-id={playbackId} />
  ),
}))

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ??
    ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList)
})

const props = { eyebrow: 'E', title: 'Что будем снимать?', lead: 'L', montage: [] }

describe('ServicesHero', () => {
  it('с шоурилом фоном идёт тот же поток, что в hero главной', () => {
    render(<ServicesHero {...props} showreelId="reel-id" />)
    expect(screen.getByTestId('reel').getAttribute('data-id')).toBe('reel-id')
    expect(screen.getByRole('heading', { name: /Что будем снимать/ })).toBeTruthy()
  })

  it('без шоурила видео нет', () => {
    render(<ServicesHero {...props} />)
    expect(screen.queryByTestId('reel')).toBeNull()
  })
})
