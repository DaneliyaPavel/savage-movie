/**
 * Почему проект стоит делать с Savage.
 *
 * Каждый тезис ведёт к кейсу, который его подтверждает. Формулировки вроде
 * «индивидуальный подход» и «команда профессионалов» здесь запрещены не из
 * вкуса, а потому что они не проверяемы: тезис без доказательства ничего
 * не продаёт и занимает экран.
 */
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'

import type { WhyContent } from '@/lib/commercial-landing/content'

interface WhySavageProps {
  content: WhyContent
  /** Слаги, которые реально есть в CMS: ссылку на несуществующий кейс не ставим */
  availableCaseSlugs: string[]
  onCaseOpen: (slug: string) => void
}

export function WhySavage({ content, availableCaseSlugs, onCaseOpen }: WhySavageProps) {
  const available = new Set(availableCaseSlugs)

  return (
    <section className="border-t border-[#1A1A1A] bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20">
      <h2 className="max-w-3xl text-3xl font-light leading-tight tracking-tight text-white md:text-5xl">
        {content.title}
      </h2>

      <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 md:mt-16 md:grid-cols-2 lg:gap-x-20">
        {content.items.map((item, index) => {
          const hasProof = Boolean(item.caseSlug && item.caseLabel && available.has(item.caseSlug))

          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: Math.min(index, 3) * 0.06 }}
              className="border-t border-[#1A1A1A] pt-6"
            >
              <h3 className="text-lg font-light tracking-tight text-white md:text-2xl">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55 md:text-base">
                {item.description}
              </p>

              {hasProof ? (
                <Link
                  href={`/projects/${item.caseSlug}`}
                  onClick={() => onCaseOpen(item.caseSlug as string)}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  <span className="border-b border-white/20 pb-0.5">{item.caseLabel}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
