'use client'

import { createContext, useContext } from 'react'

import type { ServiceDirectionId } from '@/lib/services/directions'

/**
 * Что страница направления даёт своим сценам: открыть бриф и отметить работу.
 * Сцены не знают про форму, Метрику и атрибуцию — только про эти два действия.
 */
export interface DirectionPageApi {
  id: ServiceDirectionId
  /** Проскроллить к брифу; location — откуда нажали, для estimate_cta_click */
  openBrief: (location: string) => void
  /** Открыта работа-доказательство */
  openCase: (slug: string) => void
}

export const DirectionPageContext = createContext<DirectionPageApi | null>(null)

export function useDirectionPage(): DirectionPageApi {
  const value = useContext(DirectionPageContext)
  if (!value) throw new Error('useDirectionPage вызван вне DirectionShell')
  return value
}
