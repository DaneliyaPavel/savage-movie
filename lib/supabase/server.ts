/**
 * Supabase клиент для использования на сервере
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Операция setAll была вызвана из Server Component.
            // Это можно игнорировать, так как это просто предварительная установка cookie
            // для SSR, и они не будут применены до тех пор, пока не будет вызван Response
          }
        },
      },
    }
  )
}
