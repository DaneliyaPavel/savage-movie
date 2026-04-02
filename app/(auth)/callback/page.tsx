/**
 * Callback page для обработки OAuth.
 * Токены теперь приходят через HttpOnly cookies, не через URL params.
 */
import { AuthCallbackClient } from './client'

export default function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>
}) {
  return <AuthCallbackClient searchParams={searchParams} />
}
