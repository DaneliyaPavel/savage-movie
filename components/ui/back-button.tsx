/**
 * BackButton - кнопка для возврата на предыдущую страницу
 */
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface BackButtonProps {
  href?: string
  className?: string
  label?: string
}

export function BackButton({ href, className, label = 'Назад' }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  if (href) {
    return (
      <Link href={href}>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', className)}
        >
          <ArrowLeft className="h-4 w-4" />
          {label}
        </Button>
      </Link>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn('gap-2', className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
