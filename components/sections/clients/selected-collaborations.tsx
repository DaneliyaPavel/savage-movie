/**
 * «Что стояло за кадром» — развёрнутые коммерческие коллаборации.
 *
 * Ритм секции задают кадры, а не чередование сторон: широкий во всю ширину,
 * затем вертикальный, затем широкий со сдвигом, затем тихий на большом
 * воздухе. Зеркальный зигзаг image-left / image-right — лендинговая механика,
 * по нему следующая композиция угадывается до скролла.
 *
 * Кадр здесь главный: это студия видеопродакшна, и работа должна доминировать
 * над версткой, а не помещаться в оставшуюся от текста колонку.
 *
 * Текст кейса — пересказ описания проекта из CMS, без метрик, которых у нас нет.
 */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { trackMetrikaGoal } from '@/lib/analytics/metrika'
import { useReveal } from './use-reveal'
import type { Collaboration } from '@/features/clients/content'
import type { Project } from '@/features/projects/api'

export interface CollaborationItem {
  collaboration: Collaboration
  project: Project
  still: string | null
}

function CaseHeading({
  item,
  size = 'default',
}: {
  item: CollaborationItem
  size?: 'default' | 'lead'
}) {
  const { collaboration, project } = item
  return (
    <div>
      <h3
        className={
          size === 'lead'
            ? 'font-brand-hero text-[clamp(2.4rem,8vw,6.5rem)] uppercase leading-[0.9] tracking-tighter text-white'
            : 'font-brand-hero text-[clamp(2rem,5.5vw,4.25rem)] uppercase leading-[0.92] tracking-tighter text-white'
        }
      >
        {project.client}
      </h3>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[11px] uppercase tracking-[0.24em] text-white/55">
        <span>{collaboration.field}</span>
        {project.year && <span>{project.year}</span>}
        <span className="text-white/75">«{project.title}»</span>
      </p>
    </div>
  )
}

/**
 * Первый факт — премисса кейса, он идёт без подписи и крупнее остального.
 * Остальные становятся подвалом в две колонки. Три подписи на кейс превращали
 * блок в спецификацию: двенадцать серых лейблов на секцию.
 */
function CaseText({ item }: { item: CollaborationItem }) {
  const [lead, ...rest] = item.collaboration.facts
  return (
    <>
      {lead && (
        <p className="mt-6 max-w-[46ch] text-[clamp(1.05rem,1.5vw,1.35rem)] font-light leading-[1.5] text-white/85">
          {lead.value}
        </p>
      )}
      {rest.length > 0 && (
        <dl className="mt-8 grid gap-6 border-t border-white/12 pt-6 sm:grid-cols-2 sm:gap-8">
          {rest.map(fact => (
            <div key={fact.label}>
              <dt className="text-[10px] uppercase tracking-[0.28em] text-white/55">
                {fact.label}
              </dt>
              <dd className="mt-2 max-w-[42ch] text-[15px] font-light leading-relaxed text-white/75">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </>
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
      /* min-h-11 держит тач-цель в 44px; обводка фокуса настоящая, а не смена
         цвета подчёркивания: разница в 2.8:1 не проходит порог видимости */
      className="group mt-8 inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff2936]"
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

function CaseFrame({
  item,
  sizes,
  aspect,
  priority = false,
}: {
  item: CollaborationItem
  sizes: string
  aspect: string
  priority?: boolean
}) {
  if (!item.still) {
    /* Кадра нет — оставляем поле пустым, а не заглушку с иконкой */
    return <div className={`${aspect} w-full border border-white/10 bg-white/[0.02]`} />
  }
  return (
    <div className={`group/frame relative w-full overflow-hidden ${aspect}`}>
      <Image
        src={item.still}
        alt={`Кадр из проекта «${item.project.title}» для ${item.project.client ?? 'клиента'}`}
        fill
        sizes={sizes}
        quality={75}
        priority={priority}
        className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-hover/frame:scale-[1.02]"
      />
    </div>
  )
}

function CaseBlock({ item }: { item: CollaborationItem }) {
  const layout = item.collaboration.layout

  /* Открывающий кейс: кадр во всю ширину секции задаёт масштаб остальным */
  if (layout === 'band') {
    return (
      <article data-reveal="">
        <CaseFrame item={item} sizes="100vw" aspect="aspect-[16/10] md:aspect-[21/9]" priority />
        <div className="mt-10 grid gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-5">
            <CaseHeading item={item} size="lead" />
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <CaseText item={item} />
            <CaseLink item={item} />
          </div>
        </div>
      </article>
    )
  }

  /* Вертикальный кадр после широкого: смена пропорции, а не стороны */
  if (layout === 'tall') {
    return (
      <article data-reveal="" className="grid gap-8 md:grid-cols-12 md:gap-12">
        <div className="md:col-span-6 md:pt-16">
          <CaseHeading item={item} />
          <CaseText item={item} />
          <CaseLink item={item} />
        </div>
        <div className="md:col-span-5 md:col-start-8">
          <CaseFrame item={item} sizes="(min-width: 768px) 42vw, 100vw" aspect="aspect-[4/5]" />
        </div>
      </article>
    )
  }

  /* Широкий кадр со сдвигом влево за поле набора: текст уходит под него вправо */
  if (layout === 'offset') {
    return (
      <article data-reveal="" className="grid gap-8 md:grid-cols-12 md:gap-10">
        <div className="md:col-span-10">
          <CaseFrame item={item} sizes="(min-width: 768px) 82vw, 100vw" aspect="aspect-[16/9]" />
        </div>
        <div className="md:col-span-5 md:col-start-6">
          <CaseHeading item={item} />
          <CaseText item={item} />
          <CaseLink item={item} />
        </div>
      </article>
    )
  }

  /* Тихое закрытие: маленький кадр и много воздуха */
  return (
    <article data-reveal="" className="grid gap-8 md:grid-cols-12 md:gap-12">
      <div className="md:col-span-6 md:col-start-2">
        <CaseHeading item={item} />
        <CaseText item={item} />
        <CaseLink item={item} />
      </div>
      <div className="md:col-span-3 md:col-start-9 md:pt-24">
        <CaseFrame item={item} sizes="(min-width: 768px) 26vw, 100vw" aspect="aspect-[3/4]" />
      </div>
    </article>
  )
}

export function SelectedCollaborations({ items }: { items: CollaborationItem[] }) {
  const rootRef = useReveal<HTMLElement>()
  if (items.length === 0) return null

  return (
    <section
      id="cases"
      ref={rootRef}
      /* Кейсы — самый тяжёлый блок страницы, ему нужен самый большой воздух перед началом */
      className="scroll-mt-24 border-t border-white/10 px-5 pt-20 pb-24 sm:px-8 md:px-10 md:pt-40 md:pb-32 lg:px-16"
    >
      <h2
        data-reveal=""
        className="max-w-[18ch] font-brand-hero text-[clamp(1.9rem,6vw,4rem)] uppercase leading-[0.95] tracking-tighter text-white"
      >
        Что стояло за кадром
      </h2>

      <div className="mt-16 space-y-28 md:mt-24 md:space-y-44">
        {items.map(item => (
          <CaseBlock key={item.project.slug} item={item} />
        ))}
      </div>
    </section>
  )
}
