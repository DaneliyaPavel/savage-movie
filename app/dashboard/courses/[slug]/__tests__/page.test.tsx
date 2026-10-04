/**
 * Кабинет студента: ссылки на видео берутся из закрытого /content, а не из публичного GET.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const COOKIES = { get: () => ({ value: 'student-jwt' }) }

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))
vi.mock('next/headers', () => ({ cookies: async () => COOKIES }))
vi.mock('@/lib/api/auth', () => ({ getCurrentUserServer: vi.fn() }))
vi.mock('@/features/courses/api', () => ({
  getCourseBySlugServer: vi.fn(),
  getCourseContentServer: vi.fn(),
}))
vi.mock('@/lib/api/enrollments', () => ({ getEnrollmentByCourseServer: vi.fn() }))
vi.mock('@/lib/api/course-materials', () => ({ getCourseMaterialsServer: vi.fn() }))
vi.mock('@/features/courses/components/CourseCover', () => ({ CourseCover: () => null }))
vi.mock('@/components/ui/breadcrumbs', () => ({ Breadcrumbs: () => null }))
vi.mock('@/components/ui/back-button', () => ({ BackButton: () => null }))
vi.mock('@/features/courses/components/DashboardCoursePlayer', () => ({
  DashboardCoursePlayer: ({
    course,
  }: {
    course: { modules: { lessons: { video_url?: string | null }[] }[] }
  }) => (
    <ul>
      {course.modules
        .flatMap(m => m.lessons)
        .map((l, i) => (
          <li key={i} data-testid="lesson-video">
            {l.video_url ?? 'NO_VIDEO'}
          </li>
        ))}
    </ul>
  ),
}))

import { getCurrentUserServer } from '@/lib/api/auth'
import { getCourseBySlugServer, getCourseContentServer } from '@/features/courses/api'
import { getEnrollmentByCourseServer } from '@/lib/api/enrollments'
import { getCourseMaterialsServer } from '@/lib/api/course-materials'
import DashboardCoursePage from '../page'

const GUID = 'b62f1303-b123-4da2-acb9-4f6bf7a1f84d'

// Публичная выдача: уроки без video_url
const publicCourse = {
  id: 'course-1',
  title: 'Платный курс',
  slug: 'paid',
  card_cover: null,
  cover_image: null,
  video_promo_url: null,
  format: null,
  modules: [{ id: 'm1', order: 1, title: 'M1', lessons: [{ id: 'l1', order: 1, title: 'L1' }] }],
}
const fullCourse = {
  ...publicCourse,
  modules: [
    {
      id: 'm1',
      order: 1,
      title: 'M1',
      lessons: [{ id: 'l1', order: 1, title: 'L1', video_url: GUID }],
    },
  ],
}

async function renderPage() {
  const ui = await DashboardCoursePage({ params: Promise.resolve({ slug: 'paid' }) })
  render(ui)
}

describe('DashboardCoursePage: уроки только из /content', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUserServer).mockResolvedValue({ id: 'u1', role: 'user' } as never)
    vi.mocked(getCourseBySlugServer).mockResolvedValue(publicCourse as never)
    vi.mocked(getCourseContentServer)
      .mockReset()
      .mockResolvedValue(fullCourse as never)
    vi.mocked(getEnrollmentByCourseServer)
      .mockReset()
      .mockResolvedValue({ id: 'e1', progress: 0 } as never)
    vi.mocked(getCourseMaterialsServer).mockResolvedValue([])
  })

  it('записанный студент: плеер получает video_url из /content', async () => {
    await renderPage()

    expect(getCourseContentServer).toHaveBeenCalledWith('course-1', COOKIES)
    expect(screen.getByTestId('lesson-video')).toHaveTextContent(GUID)
  })

  it('не записан: редирект на страницу курса, /content не запрашивается', async () => {
    vi.mocked(getEnrollmentByCourseServer).mockRejectedValue(new Error('404'))

    await expect(renderPage()).rejects.toThrow('NEXT_REDIRECT:/courses/paid')
    expect(getCourseContentServer).not.toHaveBeenCalled()
  })

  it('/content ответил 403: редирект, а не плеер без видео', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    vi.mocked(getCourseContentServer).mockRejectedValue(new Error('Нет доступа к урокам курса'))

    await expect(renderPage()).rejects.toThrow('NEXT_REDIRECT:/courses/paid')
  })
})
