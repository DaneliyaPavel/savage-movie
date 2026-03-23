'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

interface TocItem {
  id: string
  text: string
  level: number
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\wа-яё\s-]/gi, '')
    .replace(/\s+/g, '-')
}

function extractHeadings(content: string): TocItem[] {
  const headings: TocItem[] = []
  const regex = /^(#{2,3})\s+(.+)$/gm
  let match
  while ((match = regex.exec(content)) !== null) {
    const level = match[1]!.length
    const text = match[2]!.trim()
    const id = slugifyHeading(text)
    headings.push({ id, text, level })
  }
  return headings
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const headings = extractHeadings(content)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' },
    )

    headings.forEach(heading => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 3) return null

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <motion.nav
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
      className="hidden xl:block sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto pr-4"
    >
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">
        Содержание
      </p>
      <ul className="space-y-2">
        {headings.map(heading => (
          <li key={heading.id}>
            <button
              onClick={() => handleClick(heading.id)}
              className={`
                text-left text-sm leading-snug transition-colors duration-300 block w-full
                ${heading.level === 3 ? 'pl-4' : ''}
                ${activeId === heading.id
                  ? 'text-[#ff2936]'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </motion.nav>
  )
}

export { extractHeadings, slugifyHeading }
