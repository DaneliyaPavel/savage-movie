/**
 * Базовая логика для API клиентов (client и server)
 * Вынесена для устранения дублирования кода
 */

export interface ApiError {
  detail: string
}

export interface ApiRequestOptions extends RequestInit {
  token?: string | null
  allowNoContent?: boolean
}

/**
 * Базовая функция для выполнения HTTP запросов
 */
export async function baseApiRequest<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { token, allowNoContent, ...fetchOptions } = options

  const headers = new Headers(fetchOptions.headers)
  const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null
  const isFormData =
    typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData

  // Content-Type для JSON выставляем только если это не FormData и его ещё не задали явно.
  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    })
  } catch (error) {
    // Обработка сетевых ошибок (CORS, недоступный сервер и т.д.)
    console.error('❌ Ошибка fetch:', error)
    console.error('URL:', url)
    if (error instanceof TypeError) {
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        throw new Error(`Не удалось подключиться к серверу (${url}). Проверьте, что backend запущен и доступен.`)
      }
    }
    throw error
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    const errorText = await response.text()
    if (errorText) {
      try {
        const error: ApiError = JSON.parse(errorText)
        errorMessage = error.detail || errorMessage
      } catch {
        errorMessage = errorText
      }
    }
    
    // Специальная обработка для ошибок авторизации
    if (response.status === 401) {
      // Очищаем токены если они недействительны
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
      // Важно: 401 может означать как "просроченная сессия", так и "неверный логин/пароль".
      // Поэтому сохраняем сообщение от API (если оно есть), чтобы UX был корректным.
      throw new Error(errorMessage || 'Требуется авторизация. Пожалуйста, войдите снова.')
    }
    
    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    if (allowNoContent) {
      return null as T
    }
    throw new Error(`Unexpected empty response (204) from ${url}`)
  }

  const text = await response.text()
  if (!text) {
    if (allowNoContent) {
      return null as T
    }
    throw new Error(`Unexpected empty response from ${url}`)
  }

  try {
    return JSON.parse(text) as T
  } catch {
    const preview = text.length > 100 ? `${text.slice(0, 100)}...` : text
    throw new Error(`Unexpected non-JSON response from ${url}: ${preview}`)
  }
}
