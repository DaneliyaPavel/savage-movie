'use client'

/**
 * Подключает HLS к поверхности, у которой нет MP4-превью.
 *
 * Решение «пора грузить» принимает загрузчик из <head> (лимит одновременных
 * превью, видимость, наведение): он выставляет data-sm-want="1" и шлёт на
 * корень поверхности событие sm:load, а при выгрузке — sm:unload. Драйвер
 * только исполняет: создаёт и уничтожает hls.js через единую фабрику.
 * Стейт-машина показа (poster → … → visible) живёт в загрузчике и одинакова
 * для MP4 и HLS.
 */
import { useEffect, useRef } from 'react'

import { streamPlaylistUrl } from '@/lib/media/config'
import { createHlsController, type HlsController } from '@/lib/media/hls-controller'

interface StreamDriverProps {
  videoId: string
}

export function StreamDriver({ videoId }: StreamDriverProps) {
  const anchorRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const root = anchorRef.current?.parentElement
    const video = root?.querySelector('video')
    if (!root || !video) return

    let controller: HlsController | null = null
    let token = 0

    const stop = () => {
      token++
      controller?.destroy()
      controller = null
      video.removeAttribute('src')
    }

    const start = () => {
      if (controller) return
      const src = streamPlaylistUrl(videoId)
      if (!src) return
      const mine = ++token
      void createHlsController(video, {
        src,
        useCase: 'background',
        containerSize: () => ({ width: root.clientWidth, height: root.clientHeight }),
        onFatal: () => {
          // загрузчик увидит ошибку <video> или остановку; постер остаётся
          video.dispatchEvent(new Event('error'))
        },
      })
        .then(created => {
          if (mine !== token) {
            created.destroy()
            return
          }
          controller = created
          // нативный HLS (Safari/iOS) игнорирует preload: загрузчику нужен прогрев
          root.setAttribute('data-sm-native', created.strategy === 'native' ? '1' : '0')
        })
        .catch(() => video.dispatchEvent(new Event('error')))
    }

    root.addEventListener('sm:load', start)
    root.addEventListener('sm:unload', stop)
    // загрузчик мог решить загрузить поверхность до гидратации
    if (root.getAttribute('data-sm-want') === '1') start()

    return () => {
      root.removeEventListener('sm:load', start)
      root.removeEventListener('sm:unload', stop)
      stop()
    }
  }, [videoId])

  return <span ref={anchorRef} hidden data-sm-driver="" />
}
