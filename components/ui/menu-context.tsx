'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

interface MenuContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
  headerDark: boolean
  setHeaderDark: (dark: boolean) => void
  /** Кнопка «Меню» в шапке: на неё возвращается фокус после закрытия */
  triggerRef: RefObject<HTMLButtonElement | null>
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpenState] = useState(false)
  const [headerDark, setHeaderDark] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  /*
   * Фокус возвращаем только если меню действительно открывали. Без флага
   * первый же рендер утащил бы фокус на кнопку меню с того элемента, где он
   * стоял (например, после перехода по ссылке из формы).
   */
  const wasOpenRef = useRef(false)

  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open)
  }, [])

  const toggle = useCallback(() => setIsOpenState(prev => !prev), [])

  // Escape закрывает слой — базовое ожидание от любого полноэкранного оверлея
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setIsOpenState(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  /*
   * Блокировка прокрутки фона.
   *
   * overflow:hidden убирает полосу прокрутки, и без компенсации её ширины
   * содержимое дёргается вбок в момент открытия и закрытия. Ширину считаем
   * фактическую: у сайта свой скроллбар в 6px, но на macOS с overlay-полосой
   * она равна нулю, и жёсткая константа сдвинула бы вёрстку на ровном месте.
   *
   * Позиция прокрутки при этом не теряется: overflow:hidden, в отличие от
   * position:fixed, не сбрасывает scrollTop, поэтому после закрытия страница
   * остаётся ровно там же.
   */
  useEffect(() => {
    if (!isOpen) return

    const root = document.documentElement
    const scrollbarWidth = window.innerWidth - root.clientWidth
    const previousOverflow = root.style.overflow
    const previousPaddingRight = root.style.paddingRight

    root.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      root.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      root.style.overflow = previousOverflow
      root.style.paddingRight = previousPaddingRight
    }
  }, [isOpen])

  // Закрыли меню — фокус возвращается туда, откуда его открыли
  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    wasOpenRef.current = false
    triggerRef.current?.focus()
  }, [isOpen])

  return (
    <MenuContext.Provider
      value={{ isOpen, setIsOpen, toggle, headerDark, setHeaderDark, triggerRef }}
    >
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider')
  }
  return context
}
