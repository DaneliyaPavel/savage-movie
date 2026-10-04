/**
 * Чтение JSON-тела публичных форм с жёстким потолком по размеру.
 *
 * Next.js не ограничивает тело в route handler, а nginx на части маршрутов
 * пропускает до 100 МБ: `request.json()` целиком буферизует такое тело и
 * парсит его синхронно в единственном процессе Node, то есть один запрос
 * подвешивает весь сайт. Поэтому размер проверяется до разбора:
 * по Content-Length (без чтения ни байта) и по счётчику при чтении потока —
 * заголовка может не быть (chunked) или он может врать.
 */

export type ReadJsonBodyResult =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: 400 | 413; error: string }

const TOO_LARGE: ReadJsonBodyResult = {
  ok: false,
  status: 413,
  error: 'Слишком большой запрос',
}

const INVALID: ReadJsonBodyResult = {
  ok: false,
  status: 400,
  error: 'Некорректный запрос',
}

function declaredLength(header: string | null): number | null {
  if (header === null) return null
  const trimmed = header.trim()
  // Мусор в заголовке игнорируем: размер всё равно считается при чтении
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null
}

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged
}

export async function readJsonBody(
  request: Request,
  maxBytes: number
): Promise<ReadJsonBodyResult> {
  const declared = declaredLength(request.headers.get('content-length'))
  if (declared !== null && declared > maxBytes) return TOO_LARGE

  if (!request.body) return INVALID

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > maxBytes) {
        // Остаток тела не нужен; не ждём завершения отмены, чтобы не зависнуть на медленном клиенте
        void reader.cancel().catch(() => undefined)
        return TOO_LARGE
      }
      chunks.push(value)
    }
  } catch {
    // Клиент оборвал соединение посреди тела
    return INVALID
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(concat(chunks, received)))
  } catch {
    return INVALID
  }

  // Формам нужен объект: null, число или массив раньше падали TypeError'ом в обработчике
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return INVALID

  return { ok: true, body: parsed as Record<string, unknown> }
}
