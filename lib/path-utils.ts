import fs from 'fs'
import path from 'path'

/**
 * Возвращает абсолютный путь к файлу внутри baseDir или null,
 * если segments пытаются выйти за пределы baseDir (path traversal).
 */
export function resolveSafeChildPath(baseDir: string, segments: string[]): string | null {
  const baseResolved = fs.realpathSync(path.resolve(baseDir))
  const candidate = path.resolve(baseResolved, ...segments)
  const relativePath = path.relative(baseResolved, candidate)

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null
  }

  if (fs.existsSync(candidate)) {
    const realCandidate = fs.realpathSync(candidate)
    const realRelative = path.relative(baseResolved, realCandidate)
    if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
      return null
    }
  } else {
    const parentDir = path.dirname(candidate)
    if (fs.existsSync(parentDir)) {
      const realParent = fs.realpathSync(parentDir)
      const realParentRelative = path.relative(baseResolved, realParent)
      if (realParentRelative.startsWith('..') || path.isAbsolute(realParentRelative)) {
        return null
      }
    }
  }

  return candidate
}
