'use client'

import { useState } from 'react'
import Image from 'next/image'

import { canOptimizePoster } from '@/lib/commercial-landing/poster-url'
import { cn } from '@/lib/utils'

/**
 * Кадр работы.
 *
 * Через оптимизатор Next, если адрес ему знаком (кадры галерей лежат в CMS
 * исходниками на мегабайты), иначе обычный <img>. Если файл не приехал —
 * остаётся поверхность сцены без значка битой картинки: геометрия не
 * меняется, имя работы уходит скринридеру.
 */
export interface StillProps {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
  imgClassName?: string
  objectPosition?: string
  quality?: 50 | 65 | 75
}

export function Still({
  src,
  alt,
  sizes = '100vw',
  priority = false,
  className,
  imgClassName,
  objectPosition,
  quality = 75,
}: StillProps) {
  const [failed, setFailed] = useState(false)
  const style = objectPosition ? { objectPosition } : undefined

  return (
    <div className={cn('relative overflow-hidden bg-[#0D0D0D]', className)}>
      {failed ? (
        <span className="sr-only">{alt}</span>
      ) : canOptimizePoster(src) ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          onError={() => setFailed(true)}
          style={style}
          className={cn('object-cover', imgClassName)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          style={style}
          className={cn('absolute inset-0 h-full w-full object-cover', imgClassName)}
        />
      )}
    </div>
  )
}
