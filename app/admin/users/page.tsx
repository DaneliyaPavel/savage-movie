/**
 * Список пользователей (админ)
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { Button } from '@/components/ui/button'
import { getAdminUsers, getAdminUserEnrollments, type AdminUser } from '@/lib/api/admin'
import React from 'react'
import { Users, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [enrollmentsMap, setEnrollmentsMap] = useState<Record<string, Awaited<ReturnType<typeof getAdminUserEnrollments>>>>({})

  useEffect(() => {
    getAdminUsers({ limit: 200 })
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const loadEnrollments = async (userId: string) => {
    if (enrollmentsMap[userId]) return
    try {
      const data = await getAdminUserEnrollments(userId)
      setEnrollmentsMap(prev => ({ ...prev, [userId]: data }))
    } catch {
      setEnrollmentsMap(prev => ({ ...prev, [userId]: [] }))
    }
  }

  const toggleExpand = (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null)
      return
    }
    setExpandedId(userId)
    loadEnrollments(userId)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Breadcrumbs items={[{ label: 'Админ-панель', href: '/admin' }, { label: 'Пользователи' }]} />
        </div>
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Админ-панель', href: '/admin' }, { label: 'Пользователи' }]} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Пользователи
          </CardTitle>
          <CardDescription>Список зарегистрированных пользователей и их записей на курсы</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 w-8" />
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Имя</th>
                  <th className="text-left p-3">Роль</th>
                  <th className="text-left p-3">Регистрация</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <React.Fragment key={user.id}>
                    <tr
                      key={user.id}
                      className="border-b hover:bg-muted/30"
                    >
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleExpand(user.id)}
                        >
                          {expandedId === user.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </td>
                      <td className="p-3 font-medium">{user.email}</td>
                      <td className="p-3 text-muted-foreground">{user.full_name ?? '—'}</td>
                      <td className="p-3">
                        <span className={user.role === 'admin' ? 'text-primary font-medium' : ''}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                    {expandedId === user.id && (
                      <tr key={`${user.id}-enrollments`} className="bg-muted/20">
                        <td colSpan={5} className="p-4">
                          <div className="pl-6 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Записи на курсы
                            </p>
                            {(() => {
                              const enrollments = enrollmentsMap[user.id]
                              if (enrollments === undefined) {
                                return <p className="text-sm text-muted-foreground">Загрузка...</p>
                              }
                              if (enrollments.length === 0) {
                                return <p className="text-sm text-muted-foreground">Нет записей</p>
                              }
                              return (
                              <ul className="space-y-1">
                                {enrollments.map(e => (
                                  <li key={e.id} className="flex items-center gap-3 text-sm">
                                    <Link
                                      href={`/admin/courses`}
                                      className="font-medium hover:underline"
                                    >
                                      {e.course.title}
                                    </Link>
                                    <span className="text-muted-foreground">
                                      Прогресс: {e.progress}%
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {new Date(e.enrolled_at).toLocaleDateString('ru-RU')}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              )
                            })()}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">Пользователей пока нет</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
