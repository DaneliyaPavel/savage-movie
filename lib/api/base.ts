/**
 * Базовая логика для API клиентов (client и server)
 * Вынесена для устранения дублирования кода
 */

export interface ApiError {
  detail: string
}

export interface ApiRequestOptions extends RequestInit {
  token?: string | null
}

/**
 * Базовая функция для выполнения HTTP запросов
 */
export async function baseApiRequest<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options

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
    
    try {
      const error: ApiError = await response.json()
      errorMessage = error.detail || errorMessage
    } catch {
      // Если ответ не JSON, используем текст ответа
      try {
        const text = await response.text()
        if (text) errorMessage = text
      } catch {
        // Оставляем дефолтное сообщение
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

  return response.json()
}
