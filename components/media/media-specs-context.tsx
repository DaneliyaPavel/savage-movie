'use client'

/**
 * Манифест веб-медиа для клиентских деревьев, где видео выбирается глубоко
 * внутри (лендинг, направления). Серверная страница собирает карту
 * {id видео → spec} только для видео своего контента и кладёт её в провайдер,
 * поэтому клиентский бандл не тянет весь манифест.
 */
import { createContext, useContext, type ReactNode } from 'react'

import type { MediaSurfaceSpec } from '@/lib/media/manifest'
import { extractVideoId } from '@/lib/media/video-id'

const MediaSpecsContext = createContext<Record<string, MediaSurfaceSpec>>({})

export function MediaSpecsProvider({
  specs,
  children,
}: {
  specs: Record<string, MediaSurfaceSpec>
  children: ReactNode
}) {
  return <MediaSpecsContext.Provider value={specs}>{children}</MediaSpecsContext.Provider>
}

export function useMediaSpec(videoId: string | null | undefined): MediaSurfaceSpec | null {
  const specs = useContext(MediaSpecsContext)
  return videoId ? (specs[extractVideoId(videoId)] ?? null) : null
}
