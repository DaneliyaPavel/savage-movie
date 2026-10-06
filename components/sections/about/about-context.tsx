'use client'

import { createContext, useContext } from 'react'

/** Что страница /about даёт своим блокам: перейти к брифу из любого места */
export interface AboutPageApi {
  /** Проскроллить к брифу; location — откуда нажали, для estimate_cta_click */
  openBrief: (location: string) => void
}

export const AboutPageContext = createContext<AboutPageApi | null>(null)

export function useAboutPage(): AboutPageApi {
  const value = useContext(AboutPageContext)
  if (!value) throw new Error('useAboutPage вызван вне AboutShell')
  return value
}
