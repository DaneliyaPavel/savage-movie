/**
 * Утилиты для проектов
 */
export type ProjectOrientation = 'horizontal' | 'vertical'

export type ProjectOrientationFilter = 'all' | ProjectOrientation

export function normalizeProjectOrientation(value?: string | null): ProjectOrientation {
  return value === 'vertical' ? 'vertical' : 'horizontal'
}

export function getProjectOrientation(project: {
  orientation?: ProjectOrientation | string | null
}): ProjectOrientation {
  return normalizeProjectOrientation(project.orientation)
}

export function filterProjectsByOrientation<
  T extends { orientation?: ProjectOrientation | string | null },
>(projects: T[], filter: ProjectOrientationFilter): T[] {
  if (filter === 'all') return projects
  return projects.filter(project => normalizeProjectOrientation(project.orientation) === filter)
}
