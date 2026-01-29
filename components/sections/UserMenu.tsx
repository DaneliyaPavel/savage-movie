/**
 * UserMenu - Dropdown меню для залогиненных пользователей
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, LayoutDashboard, Settings, ChevronDown } from 'lucide-react'
import { logout } from '@/lib/api/auth'
import type { User as UserType } from '@/lib/api/auth'
import { motion, AnimatePresence } from 'framer-motion'

interface UserMenuProps {
  user: UserType
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Закрываем меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  const userInitials = user.full_name
    ? user.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user.email[0]?.toUpperCase() ?? '?')

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 h-9 px-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-7 w-7">
          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
          <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
        </Avatar>
        <span className="hidden md:inline text-sm font-medium">
          {user.full_name || user.email.split('@')[0]}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 rounded-md border bg-background shadow-lg z-50"
          >
            <div className="p-1">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">{user.full_name || 'Пользователь'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>

              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                Личный кабинет
              </Link>

              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Админ-панель
                </Link>
              )}

              <div className="border-t my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
