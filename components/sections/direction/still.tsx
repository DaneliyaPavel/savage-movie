'use client'

import { useState, type CSSProperties } from 'react'
import Image, { getImageProps } from 'next/image'

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

/** Слот выше, чем шире: телефон и планшет «стоя». Тот же запрос читают <source> и CSS. */
export const PORTRAIT_QUERY = '(max-aspect-ratio: 4/5)'

/**
 * sizes для горизонтального кадра в полноэкранном слоте, который на телефоне
 * высокий: cover подгоняет кадр по высоте, поэтому он шире экрана раза в три-четыре.
 * С `100vw` оптимизатор отдаёт файл по ширине экрана и браузер растягивает его
 * втрое — «мыло». Здесь просим файл с запасом: кадры библиотеки лежат шириной 1920.
 */
export const COVER_SIZES = `${PORTRAIT_QUERY} 360vw, 100vw`

/** sizes для вертикального кадра (3:4) в высоком слоте: по высоте он шире экрана примерно в 1,5 раза */
export const PORTRAIT_SIZES = '165vw'

/** Вертикальная версия кадра для высокого слота (телефон) */
export interface StillPortrait {
  src: string
  objectPosition?: string
}

export interface StillProps {
  src: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
  imgClassName?: string
  objectPosition?: string
  quality?: 50 | 65 | 75
  /**
   * Другой кадр для высокого слота (`PORTRAIT_QUERY`). Горизонтальный кадр в
   * вертикальном экране режется до трети ширины и выглядит дёшево, поэтому
   * там, где есть вертикальный кадр сцены, показываем его. Браузер берёт
   * только один из двух файлов (<picture>), второй не качается.
   */
  portrait?: StillPortrait
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
  portrait,
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
      ) : portrait && canOptimizePoster(src) && canOptimizePoster(portrait.src) ? (
        <ArtDirected
          src={src}
          alt={alt}
          sizes={sizes}
          priority={priority}
          quality={quality}
          imgClassName={imgClassName}
          objectPosition={objectPosition}
          portrait={portrait}
          imgRef={checkEarlyFail}
          onError={markFailed}
        />
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

interface ArtDirectedProps {
  src: string
  alt: string
  sizes: string
  priority: boolean
  quality: 50 | 65 | 75
  imgClassName?: string
  objectPosition?: string
  portrait: StillPortrait
  imgRef: (node: HTMLImageElement | null) => void
  onError: () => void
}

/**
 * <picture> с двумя кадрами. Оптимизатор Next сам собирает srcset для каждого,
 * а точка кропа переключается CSS-переменной в том же запросе, что и файл.
 */
function ArtDirected({
  src,
  alt,
  sizes,
  priority,
  quality,
  imgClassName,
  objectPosition,
  portrait,
  imgRef,
  onError,
}: ArtDirectedProps) {
  const wide = getImageProps({ src, alt, fill: true, sizes, priority, quality }).props
  const tall = getImageProps({
    src: portrait.src,
    alt,
    fill: true,
    sizes: PORTRAIT_SIZES,
    quality,
  }).props
  const position = objectPosition ?? '50% 50%'
  const style = {
    ...wide.style,
    '--still-pos': position,
    '--still-pos-portrait': portrait.objectPosition ?? position,
  } as CSSProperties

  return (
    <picture>
      <source media={PORTRAIT_QUERY} srcSet={tall.srcSet} sizes={tall.sizes} />
      {/* getImageProps отдаёт готовые атрибуты <img>: тот же next/image, но внутри <picture> */}
      <img
        {...wide}
        alt={alt}
        ref={imgRef}
        onError={onError}
        style={style}
        className={cn(
          'object-cover [object-position:var(--still-pos)]',
          '[@media(max-aspect-ratio:4/5)]:[object-position:var(--still-pos-portrait)]',
          imgClassName
        )}
      />
    </picture>
  )
}
