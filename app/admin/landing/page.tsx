/**
 * Редактор коммерческого лендинга /reklamny-rolik.
 *
 * Правит один ключ настроек — commercial_landing. Отдельной таблицы под это
 * не заводим: структура контента ещё будет меняться вместе со страницей,
 * а миграция ради каждого нового поля дороже, чем JSON в существующем KV.
 *
 * Форма всегда стартует от дефолтов из кода и накладывает сохранённое сверху,
 * поэтому новое поле появляется в редакторе сразу после деплоя — без ручного
 * досоздания записи в базе.
 */
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BackButton } from '@/components/ui/back-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSettings, updateSettings, type JsonValue } from '@/lib/api/settings'
import { revalidateAdminPaths } from '@/lib/api/admin-revalidate'
import { getProjects, type Project } from '@/features/projects/api'
import {
  COMMERCIAL_LANDING_PATH,
  COMMERCIAL_LANDING_SETTINGS_KEY,
  DEFAULT_COMMERCIAL_LANDING,
  type CommercialLandingContent,
} from '@/lib/commercial-landing/content'
import { mergeCommercialLandingContent } from '@/lib/commercial-landing/merge'

type Updater = (draft: CommercialLandingContent) => void

/**
 * Элемент списка по индексу.
 *
 * Индекс всегда приходит из map по этому же списку, поэтому элемент на месте —
 * но при включённом noUncheckedIndexedAccess типам нужна явная проверка,
 * а молчаливый `?.` спрятал бы настоящую рассинхронизацию состояния.
 */
function at<T>(list: T[], index: number): T {
  const item = list[index]
  if (!item) throw new Error(`Нет элемента списка с индексом ${index}`)
  return item
}

function Field({
  label,
  value,
  onChange,
  hint,
  rows,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  rows?: number
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {rows ? (
        <Textarea
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
        />
      ) : (
        <Input
          value={value}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
        />
      )}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

/** Списки коротких пунктов правим построчно — так быстрее, чем полем на пункт */
function LinesField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  hint?: string
}) {
  return (
    <Field
      label={label}
      rows={Math.max(3, value.length + 1)}
      value={value.join('\n')}
      hint={hint ?? 'По одному пункту в строке'}
      onChange={raw =>
        onChange(
          raw
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
        )
      }
    />
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  )
}

export default function AdminLandingPage() {
  const [content, setContent] = useState<CommercialLandingContent>(DEFAULT_COMMERCIAL_LANDING)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [settings, projectList] = await Promise.all([
          getSettings().catch(() => ({})),
          getProjects().catch(() => [] as Project[]),
        ])

        const stored = (settings as Record<string, unknown>)[COMMERCIAL_LANDING_SETTINGS_KEY]
        if (stored) {
          const parsed: unknown = typeof stored === 'string' ? JSON.parse(stored) : stored
          setContent(mergeCommercialLandingContent(DEFAULT_COMMERCIAL_LANDING, parsed))
        }
        setProjects(projectList)
      } catch (error) {
        console.error('Ошибка загрузки контента лендинга:', error)
        setStatus('Не удалось загрузить сохранённый контент — показаны значения по умолчанию')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /** Точечная правка вложенного поля без ручного расписывания спредов */
  const update = (mutate: Updater) => {
    setContent(current => {
      const draft: CommercialLandingContent = JSON.parse(JSON.stringify(current))
      mutate(draft)
      return draft
    })
  }

  const commercialProjects = useMemo(
    () => projects.filter(project => project.category === 'commercial'),
    [projects]
  )

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      await updateSettings({
        [COMMERCIAL_LANDING_SETTINGS_KEY]: JSON.parse(
          JSON.stringify(content)
        ) as JsonValue,
      })
      await revalidateAdminPaths([COMMERCIAL_LANDING_PATH])
      setStatus('Сохранено. Страница обновится в течение минуты.')
    } catch (error) {
      console.error('Ошибка сохранения контента лендинга:', error)
      setStatus('Не удалось сохранить. Проверьте соединение и попробуйте ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!window.confirm('Вернуть весь контент лендинга к значениям по умолчанию?')) return
    setContent(DEFAULT_COMMERCIAL_LANDING)
    setStatus('Значения сброшены. Нажмите «Сохранить», чтобы применить.')
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Загрузка...</div>
  }

  return (
    <div className="admin-scope min-h-screen px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        <BackButton />
        <Breadcrumbs
          items={[{ label: 'Админ-панель', href: '/admin' }, { label: 'Коммерческий лендинг' }]}
          className="mb-4 mt-4"
        />

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading mb-2 text-3xl font-bold md:text-4xl">
              Коммерческий лендинг
            </h1>
            <p className="text-muted-foreground">
              Тексты, кейсы, цены и SEO страницы «Рекламные ролики»
            </p>
          </div>
          <Link
            href={COMMERCIAL_LANDING_PATH}
            target="_blank"
            className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
          >
            Открыть страницу
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <Section
          title="Первый экран"
          description="То, что человек видит первым: что продаём, кому и какого порядка бюджет."
        >
          <Field
            label="Надзаголовок"
            value={content.hero.eyebrow}
            onChange={value => update(draft => void (draft.hero.eyebrow = value))}
          />
          <Field
            label="География"
            value={content.hero.geo}
            onChange={value => update(draft => void (draft.hero.geo = value))}
          />
          <Field
            label="Заголовок H1"
            value={content.hero.h1}
            hint="На странице ровно один H1. Он же основной SEO-сигнал."
            onChange={value => update(draft => void (draft.hero.h1 = value))}
          />
          <Field
            label="Лид"
            rows={3}
            value={content.hero.lead}
            onChange={value => update(draft => void (draft.hero.lead = value))}
          />
          <Field
            label="Ориентир бюджета"
            value={content.hero.budgetQualifier}
            hint="Держите в согласии с блоком стоимости и статьёй о бюджете."
            onChange={value => update(draft => void (draft.hero.budgetQualifier = value))}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Главная кнопка"
              value={content.hero.ctaPrimary}
              onChange={value => update(draft => void (draft.hero.ctaPrimary = value))}
            />
            <Field
              label="Вторая кнопка"
              value={content.hero.ctaSecondary}
              onChange={value => update(draft => void (draft.hero.ctaSecondary = value))}
            />
          </div>
          <Field
            label="Подпись под кнопками"
            rows={2}
            value={content.hero.ctaNote}
            onChange={value => update(draft => void (draft.hero.ctaNote = value))}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Bunny ID фонового видео"
              value={content.hero.videoPlaybackId ?? ''}
              hint="Пусто — фон остаётся постером."
              onChange={value =>
                update(draft => void (draft.hero.videoPlaybackId = value.trim() || null))
              }
            />
            <Field
              label="Постер (URL)"
              value={content.hero.posterUrl ?? ''}
              hint="Кадр первого экрана. Грузится первым — от него зависит LCP."
              onChange={value => update(draft => void (draft.hero.posterUrl = value.trim() || null))}
            />
          </div>
        </Section>

        <Section
          title="Обещание срока (SLA)"
          description="Включайте только после того, как срок ответа реально согласован внутри студии. Публичное обещание, которое не выполняется, дороже, чем его отсутствие."
        >
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={content.sla.enabled}
              onChange={event => update(draft => void (draft.sla.enabled = event.target.checked))}
              className="h-4 w-4"
            />
            <span className="text-sm">Показывать обещание срока вместо обычной подписи</span>
          </label>
          <Field
            label="Текст обещания"
            value={content.sla.text}
            onChange={value => update(draft => void (draft.sla.text = value))}
          />
        </Section>

        <Section
          title="Коммерческие кейсы"
          description="Слаги проектов в нужном порядке. Недостающие места добираются автоматически из коммерческой категории."
        >
          <Field
            label="Заголовок"
            value={content.cases.title}
            onChange={value => update(draft => void (draft.cases.title = value))}
          />
          <Field
            label="Подзаголовок"
            value={content.cases.subtitle}
            onChange={value => update(draft => void (draft.cases.subtitle = value))}
          />
          <Field
            label="Вводный абзац"
            rows={3}
            value={content.cases.intro}
            onChange={value => update(draft => void (draft.cases.intro = value))}
          />
          <LinesField
            label="Слаги приоритетных кейсов"
            value={content.cases.featuredSlugs}
            hint={`Доступны: ${commercialProjects
              .slice(0, 12)
              .map(project => project.slug)
              .join(', ')}`}
            onChange={value => update(draft => void (draft.cases.featuredSlugs = value))}
          />

          <div className="space-y-4">
            <p className="text-sm font-medium">Бизнес-контекст карточек</p>
            {content.cases.contexts.map((context, index) => (
              <div key={index} className="space-y-3 rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <Field
                    label="Слаг проекта"
                    value={context.slug}
                    onChange={value =>
                      update(draft => void (at(draft.cases.contexts, index).slug = value))
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Удалить контекст"
                    onClick={() =>
                      update(draft => void draft.cases.contexts.splice(index, 1))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Field
                  label="Отрасль и формат"
                  value={context.kind}
                  placeholder="HoReCa / рекламный ролик"
                  onChange={value => update(draft => void (at(draft.cases.contexts, index).kind = value))}
                />
                <Field
                  label="Площадки и особенности"
                  value={context.meta}
                  placeholder="Digital · выставки · AI + live action"
                  onChange={value => update(draft => void (at(draft.cases.contexts, index).meta = value))}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                update(draft =>
                  void draft.cases.contexts.push({ slug: '', kind: '', meta: '' })
                )
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить контекст
            </Button>
          </div>
        </Section>

        <Section
          title="Задачи клиента"
          description="Классификация не по услугам, а по бизнес-задаче. Клик ведёт в форму с выбранным типом проекта или на отдельную страницу, если она уже есть."
        >
          <Field
            label="Заголовок"
            value={content.tasks.title}
            onChange={value => update(draft => void (draft.tasks.title = value))}
          />
          <Field
            label="Подзаголовок"
            value={content.tasks.subtitle}
            onChange={value => update(draft => void (draft.tasks.subtitle = value))}
          />
          {content.tasks.items.map((task, index) => (
            <div key={task.id} className="space-y-3 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <Field
                  label="Заголовок задачи"
                  value={task.title}
                  onChange={value => update(draft => void (at(draft.tasks.items, index).title = value))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить задачу"
                  onClick={() => update(draft => void draft.tasks.items.splice(index, 1))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Field
                label="Описание"
                rows={2}
                value={task.description}
                onChange={value =>
                  update(draft => void (at(draft.tasks.items, index).description = value))
                }
              />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field
                  label="Тип проекта для формы"
                  value={task.projectType}
                  hint={`Допустимо: ${content.estimate.projectTypes
                    .map(option => option.value)
                    .join(', ')}`}
                  onChange={value =>
                    update(draft => void (at(draft.tasks.items, index).projectType = value))
                  }
                />
                <Field
                  label="Своя страница (необязательно)"
                  value={task.href ?? ''}
                  placeholder="/video-dlya-vystavki"
                  onChange={value =>
                    update(draft => void (at(draft.tasks.items, index).href = value.trim() || null))
                  }
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              update(draft =>
                void draft.tasks.items.push({
                  id: `task-${Date.now()}`,
                  title: '',
                  description: '',
                  projectType: 'ad',
                  href: null,
                })
              )
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить задачу
          </Button>
        </Section>

        <Section
          title="Commercial reel"
          description="Отдельный коммерческий cut на 30–45 секунд. Пока поле пустое, блок на странице не показывается — общий шоурил сюда не подходит."
        >
          <Field
            label="Bunny ID"
            value={content.showreel.playbackId ?? ''}
            onChange={value =>
              update(draft => void (draft.showreel.playbackId = value.trim() || null))
            }
          />
          <Field
            label="Заголовок"
            value={content.showreel.title}
            onChange={value => update(draft => void (draft.showreel.title = value))}
          />
          <Field
            label="Подпись"
            value={content.showreel.caption}
            onChange={value => update(draft => void (draft.showreel.caption = value))}
          />
        </Section>

        <Section title="Процесс производства" description="Этапы от задачи до адаптаций.">
          <Field
            label="Заголовок"
            value={content.process.title}
            onChange={value => update(draft => void (draft.process.title = value))}
          />
          <Field
            label="Подзаголовок"
            value={content.process.subtitle}
            onChange={value => update(draft => void (draft.process.subtitle = value))}
          />
          {content.process.steps.map((step, index) => (
            <div key={index} className="space-y-3 rounded-md border p-4">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[6rem_1fr]">
                <Field
                  label="Номер"
                  value={step.number}
                  onChange={value =>
                    update(draft => void (at(draft.process.steps, index).number = value))
                  }
                />
                <Field
                  label="Название этапа"
                  value={step.title}
                  onChange={value => update(draft => void (at(draft.process.steps, index).title = value))}
                />
              </div>
              <Field
                label="Пояснение к этапу"
                rows={3}
                value={step.summary}
                onChange={value => update(draft => void (at(draft.process.steps, index).summary = value))}
              />
              <LinesField
                label="Что входит"
                value={step.items}
                onChange={value => update(draft => void (at(draft.process.steps, index).items = value))}
              />
            </div>
          ))}
        </Section>

        <Section
          title="Стоимость"
          description="Три диапазона. Цифры должны совпадать со статьёй о бюджете — иначе сайт противоречит сам себе."
        >
          <Field
            label="Заголовок"
            value={content.pricing.title}
            onChange={value => update(draft => void (draft.pricing.title = value))}
          />
          <Field
            label="Подзаголовок"
            rows={2}
            value={content.pricing.subtitle}
            onChange={value => update(draft => void (draft.pricing.subtitle = value))}
          />
          {content.pricing.tiers.map((tier, index) => (
            <div key={tier.id} className="space-y-3 rounded-md border p-4">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field
                  label="Название"
                  value={tier.name}
                  onChange={value => update(draft => void (at(draft.pricing.tiers, index).name = value))}
                />
                <Field
                  label="Диапазон"
                  value={tier.range}
                  onChange={value => update(draft => void (at(draft.pricing.tiers, index).range = value))}
                />
              </div>
              <Field
                label="Когда подходит этот диапазон"
                rows={3}
                value={tier.summary}
                onChange={value => update(draft => void (at(draft.pricing.tiers, index).summary = value))}
              />
              <LinesField
                label="Что входит"
                value={tier.items}
                onChange={value => update(draft => void (at(draft.pricing.tiers, index).items = value))}
              />
              <Field
                label="Пояснение (необязательно)"
                value={tier.note ?? ''}
                rows={2}
                onChange={value =>
                  update(draft => void (at(draft.pricing.tiers, index).note = value.trim() || null))
                }
              />
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={tier.highlight}
                  onChange={event =>
                    update(draft => void (at(draft.pricing.tiers, index).highlight = event.target.checked))
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">Выделить как основной сегмент</span>
              </label>
            </div>
          ))}
          <Field
            label="Что сдвигает смету"
            rows={3}
            value={content.pricing.footnote}
            onChange={value => update(draft => void (draft.pricing.footnote = value))}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Кнопка"
              value={content.pricing.ctaLabel}
              onChange={value => update(draft => void (draft.pricing.ctaLabel = value))}
            />
            <Field
              label="Ссылка на статью о бюджете"
              value={content.pricing.articleHref}
              onChange={value => update(draft => void (draft.pricing.articleHref = value))}
            />
          </div>
        </Section>

        <Section
          title="Почему Savage"
          description="Каждый тезис должен опираться на кейс. Тезис без доказательства лучше удалить."
        >
          <Field
            label="Заголовок"
            value={content.why.title}
            onChange={value => update(draft => void (draft.why.title = value))}
          />
          {content.why.items.map((item, index) => (
            <div key={index} className="space-y-3 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <Field
                  label="Тезис"
                  value={item.title}
                  onChange={value => update(draft => void (at(draft.why.items, index).title = value))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить тезис"
                  onClick={() => update(draft => void draft.why.items.splice(index, 1))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Field
                label="Пояснение"
                rows={2}
                value={item.description}
                onChange={value =>
                  update(draft => void (at(draft.why.items, index).description = value))
                }
              />
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field
                  label="Слаг кейса-доказательства"
                  value={item.caseSlug ?? ''}
                  onChange={value =>
                    update(draft => void (at(draft.why.items, index).caseSlug = value.trim() || null))
                  }
                />
                <Field
                  label="Подпись ссылки"
                  value={item.caseLabel ?? ''}
                  onChange={value =>
                    update(draft => void (at(draft.why.items, index).caseLabel = value.trim() || null))
                  }
                />
              </div>
            </div>
          ))}
        </Section>

        <Section title="Форма сметы" description="Заголовки и подписи двух шагов формы.">
          <Field
            label="Заголовок"
            value={content.estimate.title}
            onChange={value => update(draft => void (draft.estimate.title = value))}
          />
          <Field
            label="Подзаголовок"
            rows={2}
            value={content.estimate.subtitle}
            onChange={value => update(draft => void (draft.estimate.subtitle = value))}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Кнопка «Дальше»"
              value={content.estimate.nextLabel}
              onChange={value => update(draft => void (draft.estimate.nextLabel = value))}
            />
            <Field
              label="Кнопка отправки"
              value={content.estimate.submitLabel}
              onChange={value => update(draft => void (draft.estimate.submitLabel = value))}
            />
          </div>
          <Field
            label="Заголовок успеха"
            value={content.success.title}
            onChange={value => update(draft => void (draft.success.title = value))}
          />
          <Field
            label="Текст успеха"
            rows={3}
            value={content.success.text}
            onChange={value => update(draft => void (draft.success.text = value))}
          />
        </Section>

        <Section title="Вопросы и ответы" description="Обычный текст, без подгонки под сниппеты.">
          <Field
            label="Заголовок"
            value={content.faq.title}
            onChange={value => update(draft => void (draft.faq.title = value))}
          />
          {content.faq.items.map((item, index) => (
            <div key={index} className="space-y-3 rounded-md border p-4">
              <div className="flex items-start justify-between gap-3">
                <Field
                  label="Вопрос"
                  value={item.question}
                  onChange={value => update(draft => void (at(draft.faq.items, index).question = value))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Удалить вопрос"
                  onClick={() => update(draft => void draft.faq.items.splice(index, 1))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Field
                label="Ответ"
                rows={4}
                value={item.answer}
                onChange={value => update(draft => void (at(draft.faq.items, index).answer = value))}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              update(draft => void draft.faq.items.push({ question: '', answer: '' }))
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить вопрос
          </Button>
        </Section>

        <Section title="Финальный экран" description="Последняя точка входа в смету.">
          <Field
            label="Заголовок"
            value={content.finalCta.title}
            onChange={value => update(draft => void (draft.finalCta.title = value))}
          />
          <Field
            label="Текст"
            rows={2}
            value={content.finalCta.text}
            onChange={value => update(draft => void (draft.finalCta.text = value))}
          />
          <Field
            label="Кнопка"
            value={content.finalCta.ctaLabel}
            onChange={value => update(draft => void (draft.finalCta.ctaLabel = value))}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field
              label="Bunny ID фона"
              value={content.finalCta.playbackId ?? ''}
              onChange={value =>
                update(draft => void (draft.finalCta.playbackId = value.trim() || null))
              }
            />
            <Field
              label="Постер фона (URL)"
              value={content.finalCta.posterUrl ?? ''}
              onChange={value =>
                update(draft => void (draft.finalCta.posterUrl = value.trim() || null))
              }
            />
          </div>
        </Section>

        <Section
          title="SEO и Open Graph"
          description="Title и description уникальны для этой страницы: поиск использует их для сниппета."
        >
          <Field
            label="Title"
            value={content.seo.title}
            hint="До 70 символов — иначе Яндекс обрежет."
            onChange={value => update(draft => void (draft.seo.title = value))}
          />
          <Field
            label="Description"
            rows={3}
            value={content.seo.description}
            onChange={value => update(draft => void (draft.seo.description = value))}
          />
          <Field
            label="og:title"
            value={content.seo.ogTitle}
            onChange={value => update(draft => void (draft.seo.ogTitle = value))}
          />
          <Field
            label="og:description"
            rows={2}
            value={content.seo.ogDescription}
            onChange={value => update(draft => void (draft.seo.ogDescription = value))}
          />
          <Field
            label="og:image (URL)"
            value={content.seo.ogImageUrl ?? ''}
            hint="Пусто — используется сгенерированная коммерческая картинка."
            onChange={value => update(draft => void (draft.seo.ogImageUrl = value.trim() || null))}
          />
        </Section>

        <div className="sticky bottom-4 flex flex-wrap items-center gap-4 rounded-md border bg-background/95 p-4 backdrop-blur">
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Сохранить
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={saving}>
            Сбросить к значениям по умолчанию
          </Button>
          {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
        </div>
      </div>
    </div>
  )
}
