import { directionOgImage } from '@/lib/services/pages/og'

export const runtime = 'edge'

export const alt = 'О студии Savage Movie'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return directionOgImage('О студии', 'Продакшн-студия полного цикла', 'Идея, съёмка и монтаж')
}
