import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { serverEnv } from '@/lib/env.server'

const API_URL = serverEnv.API_URL || 'http://localhost:8001'

const DEFAULT_PATHS = ['/', '/projects']

const ALLOWED_PATH = /^\/[a-zA-Z0-9._\-/[\]]*$/

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let me: { role?: string } | null = null
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (res.ok) {
      me = (await res.json()) as { role?: string }
    }
  } catch {
    return NextResponse.json({ error: 'Auth check failed' }, { status: 502 })
  }

  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json().catch(() => null)) as { paths?: unknown } | null
  const requestedPaths =
    body && Array.isArray(body.paths) ? body.paths.filter((p): p is string => typeof p === 'string') : []

  const paths = (requestedPaths.length > 0 ? requestedPaths : DEFAULT_PATHS).filter(p =>
    ALLOWED_PATH.test(p)
  )

  for (const path of paths) {
    revalidatePath(path)
  }

  return NextResponse.json({ ok: true, revalidated: paths })
}
