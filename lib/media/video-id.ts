/**
 * Id Bunny-видео из чего угодно, что его содержит. Отдельный модуль без
 * зависимостей: им пользуются клиентские компоненты, и тащить за ним весь
 * манифест (lqip-заглушки) в клиентский бандл не нужно.
 */
const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/**
 * Голый id или ссылка вида https://player.mediadelivery.net/play/<library>/<id>
 * (так хранит видео админка). Не нашли UUID — возвращаем исходную строку:
 * ключом манифеста может быть и имя.
 */
export function extractVideoId(value: string): string {
  return UUID_IN_TEXT.exec(value)?.[0] ?? value
}

/** Все id внутри строки: для обхода произвольного контента */
export function findVideoIds(value: string): string[] {
  return value.match(new RegExp(UUID_IN_TEXT.source, 'gi')) ?? []
}
