import path from 'path'

/**
 * Возвращает абсолютный путь к файлу внутри baseDir или null,
 * если segments пытаются выйти за пределы baseDir (path traversal).
 */
export function resolveSafeChildPath(baseDir: string, segments: string[]): string | null {
  const baseResolved = path.resolve(baseDir)
  const candidate = path.resolve(baseResolved, ...segments)
  const relativePath = path.relative(baseResolved, candidate)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null
  }

  return candidate
}

