/**
 * Callback page для обработки OAuth токенов
 * OAuth провайдеры редиректят сюда с токенами в query параметрах
 */
import { AuthCallbackClient } from './client'

export default function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ access_token?: string; refresh_token?: string }>
}) {
  // В Next.js 15 searchParams может быть Promise
  return <AuthCallbackClient searchParams={searchParams} />
}
