/**
 * Админ dashboard
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, GraduationCap, Settings, Info, PlusCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { getProjects } from '@/features/projects/api'
import { getCourses } from '@/features/courses/api'
import { getSettings, type JsonValue } from '@/lib/api/settings'
import { getBlogPosts } from '@/lib/api/blog'
import type { LucideIcon } from 'lucide-react'

function isTeamArray(v: JsonValue | undefined): v is JsonValue[] {
  return Array.isArray(v)
}

export default function AdminPage() {
  const [counts, setCounts] = useState({
    projects: 0,
    courses: 0,
    blog: 0,
  })
  const [teamCount, setTeamCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [projects, courses, blogPosts, settings] = await Promise.all([
          getProjects().catch(() => []),
          getCourses().catch(() => []),
          getBlogPosts().catch(() => []),
          getSettings().catch(() => ({})),
        ])
        setCounts({
          projects: projects.length,
          courses: courses.length,
          blog: blogPosts.length,
        })

        const rawTeam = (settings as { about_team?: JsonValue }).about_team
        setTeamCount(isTeamArray(rawTeam) ? rawTeam.length : 0)
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error)
        setTeamCount(0)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return <div className="min-h-screen py-12 px-4 flex items-center justify-center">Загрузка...</div>
  }

  const sectionGroups: Array<{
    title: string
    description: string
    items: Array<{
      title: string
      description: string
      value?: number | string | null
      href: string
      icon: LucideIcon
    }>
  }> = [
    {
      title: 'Контент',
      description: 'Основные разделы сайта, которые видит посетитель.',
      items: [
        {
          title: 'Проекты',
          description: 'Портфолио и кейсы на странице проектов.',
          value: counts.projects,
          href: '/admin/projects',
          icon: Film,
        },
        {
          title: 'Курсы',
          description: 'Обучающие программы и карточки курсов.',
          value: counts.courses,
          href: '/admin/courses',
          icon: GraduationCap,
        },
      ],
    },
    {
      title: 'Блоки сайта',
      description: 'Дополнительные секции, которые поддерживают доверие.',
      items: [
        {
          title: 'Команда',
          description: 'Раздел «О нас» и список команды.',
          value: teamCount ?? '-',
          href: '/admin/about',
          icon: Info,
        },
        {
          title: 'Блог',
          description: 'Публикации и статьи для блога.',
          value: counts.blog,
          href: '/admin/blog',
          icon: FileText,
        },
      ],
    },
    {
      title: 'Настройки сайта',
      description: 'Контакты, статистика и базовые параметры.',
      items: [
        {
          title: 'Настройки',
          description: 'Контакты, соцсети, цифры и тексты.',
          href: '/admin/settings',
          icon: Settings,
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Breadcrumbs items={[{ label: 'Админ-панель' }]} className="mb-4" />
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-2">
            Админ-панель
          </h1>
          <p className="text-muted-foreground">
            Управление контентом и заявками
          </p>
        </div>

        {sectionGroups.map((group) => (
          <div key={group.title} className="mb-10">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.title} href={item.href}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {item.title}
                        </CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {item.value ?? '—'}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>
              Управление контентом сайта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/admin/projects/new">
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Добавить проект
                </Button>
              </Link>
              <Link href="/admin/courses/new">
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Добавить курс
                </Button>
              </Link>
              <Link href="/admin/blog/new">
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Добавить статью
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button className="w-full" variant="outline">Настройки сайта</Button>
              </Link>
              <Link href="/admin/about">
                <Button className="w-full" variant="outline">О нас: команда</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
