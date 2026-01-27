'use client'

import type { ReactNode, Ref } from 'react'
import { cn } from '@/lib/utils'
import type { ProjectOrientation } from '../utils'

interface ProjectMediaCardProps {
  orientation: ProjectOrientation
  className?: string
  innerRef?: Ref<HTMLDivElement>
  aspectClassName?: string
  children: ReactNode
}

const ORIENTATION_ASPECT: Record<ProjectOrientation, string> = {
  horizontal: 'aspect-[16/9.2]',
  vertical: 'aspect-[9/16]',
}

export function ProjectMediaCard({
  orientation,
  className,
  innerRef,
  aspectClassName,
  children,
}: ProjectMediaCardProps) {
  const resolvedAspectClassName = aspectClassName ?? ORIENTATION_ASPECT[orientation]
  return (
    <div
      ref={innerRef}
      className={cn('relative overflow-hidden bg-black', resolvedAspectClassName, className)}
    >
      {children}
    </div>
  )
}

export function HorizontalProjectMediaCard(props: Omit<ProjectMediaCardProps, 'orientation'>) {
  return <ProjectMediaCard {...props} orientation="horizontal" />
}

export function VerticalProjectMediaCard(props: Omit<ProjectMediaCardProps, 'orientation'>) {
  return <ProjectMediaCard {...props} orientation="vertical" />
}
