/**
 * Админская навигация: быстрый доступ к контенту и настройкам.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/api/auth'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import {
  Film,
  GraduationCap,
  Settings,
  Info,
  LayoutDashboard,
  PlusCircle,
  FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type LinkItem = {
  title: string
  href: string
  icon: LucideIcon
  description?: string
}

const contentLinks: LinkItem[] = [
  {
    title: 'Проекты',
    href: '/admin/projects',
    description: 'Портфолио, кейсы, видео и обложки',
    icon: Film,
  },
  {
    title: 'Новый проект',
    href: '/admin/projects/new',
    description: 'Добавить проект в портфолио',
    icon: PlusCircle,
  },
  {
    title: 'Курсы',
    href: '/admin/courses',
    description: 'Программы обучения и уроки',
    icon: GraduationCap,
  },
  {
    title: 'Новый курс',
    href: '/admin/courses/new',
    description: 'Создать новый курс',
    icon: PlusCircle,
  },
]

const blocksLinks: LinkItem[] = [
  {
    title: 'Команда',
    href: '/admin/about',
    description: 'Блок «О нас» и команда',
    icon: Info,
  },
  {
    title: 'Блог',
    href: '/admin/blog',
    description: 'Статьи, публикации и черновики',
    icon: FileText,
  },
]

const settingsLinks: LinkItem[] = [
  {
    title: 'Настройки сайта',
    href: '/admin/settings',
    description: 'Контакты, статистика, тексты',
    icon: Settings,
  },
]

export function AdminHeader() {
  const [open, setOpen] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const scrolled = useScroll(8)
  const router = useRouter()

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/login')
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-transparent',
        scrolled &&
          'bg-background/95 supports-[backdrop-filter]:bg-background/70 border-border backdrop-blur-lg'
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="rounded-md px-2 py-1 text-sm font-semibold">
            SAVAGE MOVIE · Админка
          </Link>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                  asChild
                >
                  <Link href="/admin">Обзор</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Контент</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1">
                  <ul className="grid w-[560px] grid-cols-2 gap-2 rounded-md border bg-popover p-2 shadow">
                    {contentLinks.map(item => (
                      <li key={item.title}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">
                  Блоки сайта
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1">
                  <ul className="grid w-[520px] grid-cols-2 gap-2 rounded-md border bg-popover p-2 shadow">
                    {blocksLinks.map(item => (
                      <li key={item.title}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent">Настройки</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1">
                  <ul className="grid w-[420px] grid-cols-2 gap-2 rounded-md border bg-popover p-2 shadow">
                    {settingsLinks.map(item => (
                      <li key={item.title}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            На сайт
          </Link>
          <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Выход...' : 'Выйти'}
          </Button>
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
          aria-expanded={open}
          aria-controls="admin-mobile-menu"
          aria-label="Открыть меню"
        >
          <MenuToggleIcon open={open} className="size-5" duration={260} />
        </Button>
      </nav>
      <MobileMenu open={open} onClose={() => setOpen(false)}>
        <div className="flex w-full flex-col gap-y-3">
          <MenuSection title="Контент">
            {contentLinks.map(link => (
              <MobileLink key={link.title} link={link} onNavigate={() => setOpen(false)} />
            ))}
          </MenuSection>
          <MenuSection title="Блоки сайта">
            {blocksLinks.map(link => (
              <MobileLink key={link.title} link={link} onNavigate={() => setOpen(false)} />
            ))}
          </MenuSection>
          <MenuSection title="Настройки">
            {settingsLinks.map(link => (
              <MobileLink key={link.title} link={link} onNavigate={() => setOpen(false)} />
            ))}
          </MenuSection>
          <MenuSection title="Обзор">
            <MobileLink
              link={{ title: 'Главная админки', href: '/admin', icon: LayoutDashboard }}
              onNavigate={() => setOpen(false)}
            />
          </MenuSection>
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/">На сайт</Link>
          </Button>
          <Button className="w-full" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Выход...' : 'Выйти'}
          </Button>
        </div>
      </MobileMenu>
    </header>
  )
}

type MobileMenuProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

function MobileMenu({ open, onClose, children }: MobileMenuProps) {
  if (!open || typeof window === 'undefined') return null

  return createPortal(
    <div
      id="admin-mobile-menu"
      className={cn(
        'fixed inset-0 z-40 flex flex-col border-y bg-background/95 backdrop-blur-lg',
        'top-14 md:hidden'
      )}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex size-full flex-col overflow-y-auto p-4" onClick={onClose}>
        <div className="flex size-full flex-col gap-4" onClick={event => event.stopPropagation()}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function MobileLink({ link, onNavigate }: { link: LinkItem; onNavigate: () => void }) {
  const Icon = link.icon
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-md border p-3 text-sm font-medium transition-colors hover:bg-accent"
    >
      <span className="flex size-9 items-center justify-center rounded-md border bg-background/60">
        <Icon className="size-4" />
      </span>
      <span className="flex flex-col">
        <span>{link.title}</span>
        {link.description && (
          <span className="text-xs text-muted-foreground">{link.description}</span>
        )}
      </span>
    </Link>
  )
}

function ListItem({
  title,
  description,
  icon: Icon,
  className,
  href,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
  return (
    <NavigationMenuLink
      className={cn(
        'flex w-full flex-row gap-x-2 rounded-sm p-2 data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        className
      )}
      {...props}
      asChild
    >
      <Link href={href}>
        <div className="flex size-12 items-center justify-center rounded-md border bg-background/60 shadow-sm">
          <Icon className="size-5 text-foreground" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="font-medium">{title}</span>
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
      </Link>
    </NavigationMenuLink>
  )
}

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false)

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold)
  }, [threshold])

  React.useEffect(() => {
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  React.useEffect(() => {
    onScroll()
  }, [onScroll])

  return scrolled
}
