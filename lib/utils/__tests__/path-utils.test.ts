import { describe, it, expect } from 'vitest'
import path from 'path'
import { resolveSafeChildPath } from '@/lib/path-utils'

describe('resolveSafeChildPath', () => {
  it('resolves a normal child path', () => {
    const base = '/var/uploads'
    const resolved = resolveSafeChildPath(base, ['images', 'a.jpg'])
    expect(resolved).toBe(path.resolve(base, 'images', 'a.jpg'))
  })

  it('blocks path traversal via ..', () => {
    const base = '/var/uploads'
    expect(resolveSafeChildPath(base, ['..', 'secret.txt'])).toBeNull()
    expect(resolveSafeChildPath(base, ['images', '..', '..', 'secret.txt'])).toBeNull()
  })
})

