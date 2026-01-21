import { NextRequest, NextResponse } from 'next/server'

const maxAge = 7 * 24 * 60 * 60

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (
    !body ||
    typeof body.access_token !== 'string' ||
    typeof body.refresh_token !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Invalid token payload' },
      { status: 400 }
    )
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('access_token', body.access_token, {
    ...cookieOptions,
    maxAge,
  })
  response.cookies.set('refresh_token', body.refresh_token, {
    ...cookieOptions,
    maxAge,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('access_token', '', { ...cookieOptions, maxAge: 0 })
  response.cookies.set('refresh_token', '', { ...cookieOptions, maxAge: 0 })
  return response
}
