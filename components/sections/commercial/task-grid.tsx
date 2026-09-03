/**
 * «Начинаем не с камеры. Начинаем с задачи.»
 *
 * Классификация не по услугам, а по бизнес-задаче: человек из поиска думает
 * «нам надо запустить продукт», а не «нам нужен ролик длительностью 30 секунд».
 * Клик по задаче ведёт в форму с уже выбранным типом проекта — и сразу
 * отправляет estimate_project_type, потому что выбор здесь равносилен
 * выбору в первом шаге формы.
 *
 * Когда у задачи появится собственная intent-страница (video-dlya-vystavki,
 * video-o-kompanii), в CMS у неё проставляется href — и карточка становится
 * ссылкой без правок кода.
 */
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import type { TasksContent, TaskItem } from '@/lib/commercial-landing/content'

interface TaskGridProps {
  content: TasksContent
  onTaskSelect: (task: TaskItem) => void
}

const cardClassName =
  'group flex h-full flex-col justify-between gap-6 border border-[#1A1A1A] bg-[#050505] p-6 text-left transition-colors duration-300 hover:border-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:p-8'

function CardBody({ task, index }: { task: TaskItem; index: number }) {
  return (
    <>
      <div>
        <span className="font-mono text-[0.65rem] tracking-[0.2em] text-white/25">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="mt-4 text-xl font-light tracking-tight text-white md:text-2xl">
          {task.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/55">{task.description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-white/30 transition-[color,translate] duration-200 group-hover:translate-x-1 group-hover:text-accent" />
    </>
  )
}

export function TaskGrid({ content, onTaskSelect }: TaskGridProps) {
  return (
    <section className="border-t border-[#1A1A1A] bg-[#000000] px-6 py-20 md:px-10 md:py-28 lg:px-20">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-light leading-tight tracking-tight text-white md:text-5xl">
          {content.title}
        </h2>
        <p className="mt-4 text-base text-white/50 md:text-lg">{content.subtitle}</p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-px bg-[#1A1A1A] sm:grid-cols-2 lg:grid-cols-3">
        {content.items.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: Math.min(index, 3) * 0.06 }}
            className="h-full"
          >
            {task.href ? (
              <Link
                href={task.href}
                onClick={() => onTaskSelect(task)}
                className={cardClassName}
              >
                <CardBody task={task} index={index} />
              </Link>
            ) : (
              <button type="button" onClick={() => onTaskSelect(task)} className={`w-full ${cardClassName}`}>
                <CardBody task={task} index={index} />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}
