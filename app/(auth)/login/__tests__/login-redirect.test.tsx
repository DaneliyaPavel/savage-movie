/**
 * Редирект после входа: цель берётся из ?redirect=, но только внутри сайта.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

let redirectParam: string | null = null

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (name: string) => (name === 'redirect' ? redirectParam : null),
  }),
}))

vi.mock('@/lib/api/auth', () => ({
  login: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/components/auth/OAuthButtons', () => ({
  OAuthButtons: () => null,
}))

import LoginPage from '../page'

const assignedHrefs: string[] = []

function submitLogin() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } })
  fireEvent.change(screen.getByLabelText('Пароль'), { target: { value: 'secret-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Войти' }))
}

describe('LoginPage: redirect после входа', () => {
  beforeEach(() => {
    assignedHrefs.length = 0
    redirectParam = null
    // jsdom не умеет навигацию: подменяем location и записываем присвоенный href
    vi.stubGlobal('location', {
      origin: 'https://savagemovie.ru',
      set href(value: string) {
        assignedHrefs.push(value)
      },
      get href() {
        return assignedHrefs.at(-1) ?? 'https://savagemovie.ru/login'
      },
    })
  })

  it.each([
    ['/admin', '/admin'],
    ['/admin/projects?x=1#y', '/admin/projects?x=1#y'],
    ['/dashboard/courses/abc', '/dashboard/courses/abc'],
  ])('ведёт на внутренний путь %s', async (param, expected) => {
    redirectParam = param
    render(<LoginPage />)
    submitLogin()
    await waitFor(() => expect(assignedHrefs).toEqual([expected]))
  })

  it.each([
    '/\t/evil.example',
    '/\n/evil.example',
    '/\r/evil.example',
    '//evil.example',
    '/\\evil.example',
    'https://evil.example',
    'javascript:alert(1)',
  ])('не ведёт на %j, уходит на /admin', async param => {
    redirectParam = param
    render(<LoginPage />)
    submitLogin()
    await waitFor(() => expect(assignedHrefs).toEqual(['/admin']))
  })

  it('без параметра redirect ведёт на /admin', async () => {
    render(<LoginPage />)
    submitLogin()
    await waitFor(() => expect(assignedHrefs).toEqual(['/admin']))
  })
})
