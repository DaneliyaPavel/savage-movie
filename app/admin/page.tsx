/**
 * Админ dashboard
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Film, GraduationCap, Calendar, Mail, Users, MessageSquare, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getProjects } from '@/lib/api/projects'
import { getCourses } from '@/lib/api/courses'
import { getClients } from '@/lib/api/clients'
import { getTestimonials } from '@/lib/api/testimonials'

export default function AdminPage() {
  const [stats, setStats] = useState([
    { title: 'Проекты', value: 0, icon: Film, href: '/admin/projects' },
    { title: 'Курсы', value: 0, icon: GraduationCap, href: '/admin/courses' },
    { title: 'Клиенты', value: 0, icon: Users, href: '/admin/clients' },
    { title: 'Отзывы', value: 0, icon: MessageSquare, href: '/admin/testimonials' },
    { title: 'Бронирования', value: 0, icon: Calendar, href: '/admin/bookings' },
    { title: 'Заявки', value: 0, icon: Mail, href: '/admin/submissions' },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [projects, courses, clients, testimonials] = await Promise.all([
          getProjects().catch(() => []),
          getCourses().catch(() => []),
          getClients().catch(() => []),
          getTestimonials().catch(() => []),
        ])
        setStats([
          { title: 'Проекты', value: projects.length, icon: Film, href: '/admin/projects' },
          { title: 'Курсы', value: courses.length, icon: GraduationCap, href: '/admin/courses' },
          { title: 'Клиенты', value: clients.length, icon: Users, href: '/admin/clients' },
          { title: 'Отзывы', value: testimonials.length, icon: MessageSquare, href: '/admin/testimonials' },
          { title: 'Бронирования', value: 0, icon: Calendar, href: '/admin/bookings' },
          { title: 'Заявки', value: 0, icon: Mail, href: '/admin/submissions' },
        ])
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return <div className="min-h-screen py-12 px-4 flex items-center justify-center">Загрузка...</div>
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-4xl md:text-5xl mb-2">
            Админ-панель
          </h1>
          <p className="text-muted-foreground">
            Управление контентом и заявками
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.title} href={stat.href}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
          <Link href="/admin/settings">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Настройки
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
              </CardContent>
            </Card>
          </Link>
        </div>

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
                <Button className="w-full">Добавить проект</Button>
              </Link>
              <Link href="/admin/courses/new">
                <Button className="w-full">Добавить курс</Button>
              </Link>
              <Link href="/admin/clients/new">
                <Button className="w-full">Добавить клиента</Button>
              </Link>
              <Link href="/admin/testimonials/new">
                <Button className="w-full">Добавить отзыв</Button>
              </Link>
              <Link href="/admin/settings">
                <Button className="w-full" variant="outline">Настройки сайта</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
