import { directionOgImage } from '@/lib/services/pages/og'

export const runtime = 'edge'

export const alt = 'Музыкальные клипы — Savage Movie'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return directionOgImage(
    'Music Video',
    'Музыкальный клип',
    'Режиссура, сет, съёмка и монтаж под трек'
  )
}
