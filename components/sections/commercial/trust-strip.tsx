/**
 * Полоса доверия сразу после первого экрана.
 *
 * Показывает только реальные логотипы из коллекции клиентов CMS. Пока там
 * пусто — блок не рендерится вовсе: выдуманные логотипы и счётчики вида
 * «500+ проектов» на коммерческой странице недопустимы, а пустая полоса
 * доверия не прибавляет.
 *
 * Без карусели: движущаяся лента отвлекает и мешает прочитать список
 * за те две-три секунды, ради которых блок и стоит.
 */
'use client'

import Image from 'next/image'

import type { Client } from '@/lib/api/clients'
import type { TrustContent } from '@/lib/commercial-landing/content'

interface TrustStripProps {
  trust: TrustContent
  clients: Client[]
}

export function TrustStrip({ trust, clients }: TrustStripProps) {
  const logos = clients
    .filter(client => Boolean(client.logo_url))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, trust.maxLogos)

  if (logos.length === 0) return null

  return (
    <section className="border-t border-[#1A1A1A] bg-[#000000] px-6 py-12 md:px-10 md:py-16 lg:px-20">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-white/55 md:text-xs">
        {trust.title}
      </p>

      <ul className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-8 md:gap-x-14">
        {logos.map(client => (
          <li key={client.id} className="relative h-7 w-24 md:h-8 md:w-28">
            <Image
              src={client.logo_url as string}
              alt={client.name}
              fill
              sizes="(max-width: 768px) 96px, 112px"
              className="object-contain opacity-55 transition-opacity duration-300 hover:opacity-100"
            />
          </li>
        ))}
      </ul>
    </section>
  )
}
