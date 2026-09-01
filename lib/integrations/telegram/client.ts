/**
 * Отправка уведомлений в Telegram.
 * Общий модуль для всех форм сайта: заявки, подписка на рассылку.
 */

/**
 * Базовый адрес Bot API. Переопределяется на реле, когда прямой доступ
 * к api.telegram.org закрыт (типично для российского хостинга).
 */
const TELEGRAM_API_BASE = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(
  /\/$/,
  ''
)

/**
 * Жёсткий таймаут на Telegram. Без него недоступный Bot API держит запрос
 * до системного таймаута соединения (~10 с), и человек столько ждёт кнопку,
 * хотя письмо уже ушло.
 */
const TELEGRAM_TIMEOUT_MS = 5000

/** Telegram настроен, только если заданы токен бота и чат */
export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

/**
 * Экранирование для Telegram parse_mode=HTML.
 * Telegram требует экранировать только &, < и >; кавычки трогать нельзя,
 * иначе в сообщении вместо « " » видно « &quot; ».
 */
export function escapeTelegram(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const url = `${TELEGRAM_API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
    }),
    signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Telegram API error: ${response.status} ${error}`)
  }
}
