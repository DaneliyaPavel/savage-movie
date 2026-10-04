/**
 * Адрес клиента для лимитов по IP.
 *
 * Приложение стоит за nginx, и только он знает настоящий адрес: X-Real-IP он
 * выставляет сам ($remote_addr, значение клиента затирается), а в
 * X-Forwarded-For дописывает адрес соединения в конец цепочки. Всё, что стоит
 * левее, прислал сам клиент, поэтому первый элемент (как раньше) брать нельзя:
 * подставив произвольный адрес, можно получить новую корзину лимита на каждый
 * запрос.
 *
 * Значение, которое не является IP-адресом, не используется: оно становится
 * ключом в памяти лимитера, и заголовок на несколько килобайт раздувал бы его.
 */
import { isIP } from 'net'

/** Общая корзина для запросов без читаемого адреса (прямой запрос в обход nginx) */
export const UNKNOWN_CLIENT_IP = 'unknown'

/** Самый длинный текстовый IPv6 с вложенным IPv4 — 45 символов */
const MAX_IP_LENGTH = 45

function asIp(value: string | null | undefined): string | null {
  const candidate = value?.trim()
  if (!candidate || candidate.length > MAX_IP_LENGTH) return null
  return isIP(candidate) ? candidate.toLowerCase() : null
}

export function getClientIp(headers: Pick<Headers, 'get'>): string {
  const real = asIp(headers.get('x-real-ip'))
  if (real) return real

  // Запасной путь: последний элемент дописал доверенный прокси. Если он не
  // похож на адрес, предыдущие элементы всё равно клиентские — не берём их.
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const last = asIp(forwarded.split(',').pop())
    if (last) return last
  }

  return UNKNOWN_CLIENT_IP
}
