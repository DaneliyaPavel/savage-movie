'use client'

import { useState } from 'react'
import Image from 'next/image'

import { canOptimizePoster } from '@/lib/commercial-landing/poster-url'
import { cn } from '@/lib/utils'

import './direction-kit.css'

/**
 * Кадр работы.
 *
 * Через оптимизатор Next, если адрес ему знаком (кадры галерей лежат в CMS
 * исходниками на мегабайты), иначе обычный <img>. Если файл не приехал —
 * остаётся поверхность сцены с тонкой штриховкой вместо значка битой
 * картинки: геометрия не меняется, имя работы уходит скринридеру.
 *
 * Ошибка загрузки ловится и до гидратации: кадр мог упасть раньше, чем
 * React навесил onError, — тогда событие уже прошло, а `complete` остался.
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
  // Храним адрес, который упал: смена src сама сбрасывает состояние
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = failedSrc === src
  const style = objectPosition ? { objectPosition } : undefined
  const markFailed = () => setFailedSrc(src)
  // У SVG без собственных размеров naturalWidth тоже 0 — их за битые не считаем
  const checkEarlyFail = (node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth === 0 && !/\.svg(\?|$)/i.test(src)) {
      markFailed()
    }
  }

  return (
    <div className={cn('relative overflow-hidden bg-[#0D0D0D]', className)}>
      {failed ? (
        <>
          <span aria-hidden="true" className="dir-kit-still-fallback absolute inset-0" />
          <span className="sr-only">{alt}</span>
        </>
      ) : canOptimizePoster(src) ? (
        <Image
          ref={checkEarlyFail}
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          onError={markFailed}
          style={style}
          className={cn('object-cover', imgClassName)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={checkEarlyFail}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={markFailed}
          style={style}
          className={cn('absolute inset-0 h-full w-full object-cover', imgClassName)}
        />
      )}
    </div>
  )
}
