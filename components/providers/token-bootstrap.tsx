'use client'

import { useEffect } from 'react'
import { getAccessToken, setAccessToken } from '@/lib/api/token-store'

export function TokenBootstrap() {
  useEffect(() => {
    if (getAccessToken()) return

    let cancelled = false
    fetch('/api/auth/session', { method: 'GET', cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then((data: { access_token?: string | null } | null) => {
        if (cancelled) return
        if (data && typeof data.access_token === 'string' && data.access_token) {
          setAccessToken(data.access_token)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
