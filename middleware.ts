import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 301 redirect /studio → /about (SEO: remove duplicate page)
  if (request.nextUrl.pathname === '/studio') {
    const url = request.nextUrl.clone()
    url.pathname = '/about'
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/studio'],
}
