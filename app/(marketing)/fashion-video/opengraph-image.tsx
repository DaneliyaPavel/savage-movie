import { directionOgImage } from '@/lib/services/pages/og'

export const runtime = 'edge'

export const alt = 'Fashion-видео — Savage Movie'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return directionOgImage('Fashion Video', 'Fashion-видео', 'Съёмка коллекций, кампаний и дропов')
}
