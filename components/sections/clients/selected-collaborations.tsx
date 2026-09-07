/**
 * «Что стояло за кадром» — развёрнутые коммерческие коллаборации.
 *
 * Композиция меняется от кейса к кейсу (см. layout в features/clients/content.ts):
 * четыре одинаковых блока подряд читались бы как каталог, а не как разбор работы.
 * Текст кейса — пересказ описания проекта из CMS, без метрик, которых у нас нет.
 */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import type { Collaboration } from '@/features/clients/content'
import type { Project } from '@/features/projects/api'

export interface CollaborationItem {
  collaboration: Collaboration
  project: Project
  still: string | null
}

/* Появление кейса при прокрутке. Под prefers-reduced-motion блок просто есть
   на месте: initial={false} отключает и сдвиг, и проявление. */
const reveal = (reduceMotion: boolean) => ({
  initial: reduceMotion ? (false as const) : { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] as const },
})

function CaseHeading({ item }: { item: CollaborationItem }) {
  const { collaboration, project } = item
  return (
    <div>
      <h3 className="font-brand-hero text-[clamp(2rem,6vw,4.5rem)] uppercase leading-[0.92] tracking-tighter text-white">
        {project.client}
      </h3>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.24em] text-white/55">
        <span>{collaboration.field}</span>
        {project.year && <span>{project.year}</span>}
      </p>
      <p className="mt-4 text-lg font-light text-white/75 md:text-xl">«{project.title}»</p>
    </div>
  )
}

function CaseFacts({ item }: { item: CollaborationItem }) {
  return (
    <dl className="mt-8 space-y-6">
      {item.collaboration.facts.map(fact => (
        <div key={fact.label}>
          <dt className="text-[10px] uppercase tracking-[0.28em] text-white/55">{fact.label}</dt>
          <dd className="mt-2 max-w-[54ch] text-[15px] font-light leading-relaxed text-white/80 md:text-base">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function CaseLink({ item }: { item: CollaborationItem }) {
  return (
    <Link
      href={`/projects/${item.project.slug}`}
      onClick={() =>
        trackMetrikaGoal('clients_collaboration_click', {
          client: item.project.client ?? '',
          project_slug: item.project.slug,
          source: 'collaboration',
        })
      }
      /* min-h-11 держит тач-цель в 44px: ссылка из одной строки капса была
         вдвое ниже нормы. Обводка фокуса — настоящая, а не смена цвета
         подчёркивания: разница в 2.8:1 не проходит порог видимости. */
      className="group mt-6 inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff2936]"
    >
      <span className="inline-flex items-center gap-3 border-b border-white/25 pb-1 text-[11px] uppercase tracking-[0.24em] text-white transition-colors duration-200 group-hover:border-[#ff2936] group-active:border-[#ff2936] md:text-xs">
        Смотреть проект
        <span
          aria-hidden="true"
          className="transition-transform duration-300 ease-out group-hover:translate-x-1 group-active:translate-x-1.5"
        >
          →
        </span>
      </span>
    </Link>
  )
}

function CaseImage({
  item,
  sizes,
  aspect,
  priorityHint,
}: {
  item: CollaborationItem
  sizes: string
  aspect: string
  priorityHint?: boolean
}) {
  if (!item.still) {
    /* Кадра нет — оставляем поле пустым, а не заглушку с иконкой */
    return <div className={`${aspect} w-full border border-white/10 bg-white/[0.02]`} />
  }
  return (
    <div className={`group relative w-full overflow-hidden ${aspect}`}>
      <Image
        src={item.still}
        alt={`Кадр из проекта «${item.project.title}» для ${item.project.client ?? 'клиента'}`}
        fill
        sizes={sizes}
        quality={75}
        loading={priorityHint ? 'eager' : 'lazy'}
        className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover:scale-[1.02]"
      />
    </div>
  )
}

function CaseBlock({ item, reduceMotion }: { item: CollaborationItem; reduceMotion: boolean }) {
  const layout = item.collaboration.layout
  const REVEAL = reveal(reduceMotion)

  if (layout === 'image-left') {
    return (
      <motion.article {...REVEAL} className="grid gap-8 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-6 lg:col-span-7">
          <CaseImage
            item={item}
            sizes="(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw"
            aspect="aspect-[16/10]"
          />
        </div>
        <div className="md:col-span-6 md:pt-4 lg:col-span-5">
          <CaseHeading item={item} />
          <CaseFacts item={item} />
          <CaseLink item={item} />
        </div>
      </motion.article>
    )
  }

  if (layout === 'image-right-offset') {
    return (
      <motion.article {...REVEAL} className="grid gap-8 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-6 lg:col-span-5">
          <CaseHeading item={item} />
          <CaseFacts item={item} />
          <CaseLink item={item} />
        </div>
        <div className="md:col-span-5 md:col-start-8 md:mt-24 lg:col-span-6 lg:col-start-7">
          <CaseImage item={item} sizes="(min-width: 768px) 50vw, 100vw" aspect="aspect-[4/5]" />
        </div>
      </motion.article>
    )
  }

  if (layout === 'band') {
    return (
      <motion.article {...REVEAL}>
        <CaseImage item={item} sizes="100vw" aspect="aspect-[16/9] md:aspect-[21/9]" />
        <div className="mt-8 grid gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <CaseHeading item={item} />
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <CaseFacts item={item} />
            <CaseLink item={item} />
          </div>
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article {...REVEAL} className="grid gap-8 md:grid-cols-12 md:gap-10">
      <div className="md:col-span-7">
        <CaseHeading item={item} />
        <CaseFacts item={item} />
        <CaseLink item={item} />
      </div>
      <div className="md:col-span-4 md:col-start-9 lg:col-span-4 lg:col-start-9">
        <CaseImage item={item} sizes="(min-width: 768px) 34vw, 100vw" aspect="aspect-[3/4]" />
      </div>
    </motion.article>
  )
}

export function SelectedCollaborations({ items }: { items: CollaborationItem[] }) {
  const reduceMotion = useReducedMotion() ?? false
  if (items.length === 0) return null

  return (
    <section
      id="cases"
      className="scroll-mt-24 border-t border-white/10 px-5 py-20 sm:px-8 md:px-10 md:py-28 lg:px-16"
    >
      <motion.h2
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="max-w-[18ch] font-brand-hero text-[clamp(1.9rem,6vw,4rem)] uppercase leading-[0.95] tracking-tighter text-white"
      >
        Что стояло за кадром
      </motion.h2>

      <div className="mt-16 space-y-24 md:mt-24 md:space-y-40">
        {items.map(item => (
          <CaseBlock key={item.project.slug} item={item} reduceMotion={reduceMotion} />
        ))}
      </div>
    </section>
  )
}
