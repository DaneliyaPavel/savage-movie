/**
 * Ссылка на бриф из публичной формы.
 *
 * Принимаются только http(s)-ссылки без логина и пароля. Остальное осознанно
 * не режем: клиенты вставляют любые облака (Яндекс.Диск, Google Drive,
 * Dropbox, WeTransfer, корпоративные серверы), поэтому белый список хостов или
 * принудительный https отсекали бы настоящие брифы. В отличие от них userinfo
 * в брифе не нужен никому: `https://savagemovie.ru@evil.example/` в письме
 * выглядит как адрес студии, хотя ведёт на evil.example.
 *
 * Хост виден в самом начале ссылки: URL.toString() выводит IDN в punycode, так
 * что подмена похожими буквами видна в письме и в Telegram без доп. подписей.
 */
export function normalizeBriefUrl(raw: string): string {
  if (!raw) return ''

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return ''
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
  if (url.username || url.password) return ''

  return url.toString()
}
