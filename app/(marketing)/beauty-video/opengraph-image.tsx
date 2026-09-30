import { directionOgImage } from '@/lib/services/pages/og'

export const runtime = 'edge'

export const alt = 'Beauty и предметная съёмка — Savage Movie'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return directionOgImage('Beauty Video', 'Beauty-видео', 'Текстура, кожа и свет крупным планом')
}
