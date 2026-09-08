/**
 * Стереж canonical-архитектуры.
 *
 * История, из-за которой этот файл существует: в корневом app/layout.tsx стоял
 * alternates.canonical = '/'. В Next.js относительный canonical наследуется
 * всеми маршрутами, которые его не переопределили, и /projects/[slug],
 * /blog/[slug] и /courses/[slug] отдавали в продакшене
 * <link rel="canonical" href="https://savagemovie.ru">. Около 32 страниц —
 * всё портфолио и весь блог — объявляли себя дублями главной, будучи при этом
 * перечисленными в sitemap.xml.
 *
 * Тесты читают исходники, а не импортируют модули: generateMetadata тянет
 * серверные API-клиенты и next/font, поэтому статический разбор здесь надёжнее
 * и не требует моков всего дерева зависимостей.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const APP_DIR = path.resolve(__dirname, '..')
const MARKETING_DIR = path.join(APP_DIR, '(marketing)')

function read(relative: string): string {
  return readFileSync(path.join(APP_DIR, relative), 'utf-8')
}

/** Все page.tsx внутри (marketing), маршрутами вида "/", "/projects/[slug]". */
function marketingRoutes(): string[] {
  const routes: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
      } else if (entry === 'page.tsx') {
        const rel = path.relative(MARKETING_DIR, path.dirname(full))
        routes.push(rel === '' ? '/' : `/${rel.split(path.sep).join('/')}`)
      }
    }
  }
  walk(MARKETING_DIR)
  return routes.sort()
}

/** Исходник маршрута: сам page.tsx плюс соседний layout.tsx, если он есть. */
function routeSource(route: string): string {
  const dir = route === '/' ? MARKETING_DIR : path.join(MARKETING_DIR, route.slice(1))
  let source = readFileSync(path.join(dir, 'page.tsx'), 'utf-8')
  try {
    source += readFileSync(path.join(dir, 'layout.tsx'), 'utf-8')
  } catch {
    // соседнего layout нет — это нормально
  }
  return source
}

describe('корневой layout не задаёт глобальный canonical', () => {
  const rootLayout = read('layout.tsx')

  it('в app/layout.tsx нет alternates.canonical', () => {
    // Именно эта строка канонизировала весь сайт на главную.
    expect(rootLayout).not.toMatch(/alternates:\s*\{[^}]*canonical/s)
  })

  it('metadataBase сохранён — относительные canonical без него не резолвятся', () => {
    expect(rootLayout).toContain('metadataBase: new URL(baseUrl)')
  })
})

describe('каждый индексируемый marketing-маршрут задаёт собственный canonical', () => {
  const routes = marketingRoutes()

  it('маршруты вообще найдены (иначе тест молча зелёный)', () => {
    expect(routes.length).toBeGreaterThanOrEqual(13)
    expect(routes).toContain('/')
    expect(routes).toContain('/projects/[slug]')
    expect(routes).toContain('/blog/[slug]')
    expect(routes).toContain('/courses/[slug]')
  })

  it.each(routes)('%s определяет alternates.canonical', route => {
    expect(routeSource(route)).toMatch(/alternates:\s*\{[\s\S]*?canonical:/)
  })
})

describe('динамические маршруты не могут снова получить canonical главной', () => {
  const dynamicRoutes: ReadonlyArray<[string, string]> = [
    ['/projects/[slug]', 'projects'],
    ['/blog/[slug]', 'blog'],
    ['/courses/[slug]', 'courses'],
  ]

  it.each(dynamicRoutes)('%s строит canonical из slug', (route, segment) => {
    const source = routeSource(route)
    const canonical = source.match(/canonical:\s*(.+)/)?.[1] ?? ''

    // Шаблонная строка с подстановкой slug, а не константа.
    expect(canonical).toContain('${slug}')
    expect(canonical).toContain(`/${segment}/`)
  })

  it.each(dynamicRoutes)('%s не канонизируется на "/" ни в каком виде', route => {
    const source = routeSource(route)
    expect(source).not.toMatch(/canonical:\s*['"`]\/['"`]/)
    expect(source).not.toMatch(/canonical:\s*['"`]https?:\/\/[^/]+\/?['"`]/)
  })
})

describe('главная канонизируется на себя', () => {
  it('/ задаёт canonical "/"', () => {
    expect(routeSource('/')).toMatch(/canonical:\s*'\/'/)
  })
})
