/**
 * Ссылка mailto: для адреса из публичной формы.
 *
 * Общий EMAIL_PATTERN форм пропускает «?», «&», «#» и «%»: адрес вида
 * `x@y.zz?bcc=attacker%40evil.example` проходит проверку, а в href превращается
 * в письмо с чужими bcc, темой и текстом. На приёме адрес не ужесточаем
 * (в локальной части бывают «'», «&», «%», и это настоящие клиенты), а вот
 * ссылку строим только для безопасного адреса; остальные выводятся обычным
 * текстом. Reply-To это не затрагивает.
 *
 * Шаблон совпадает с LINK_EMAIL_PATTERN из ai-course.ts.
 */
const LINK_EMAIL_PATTERN = /^[^\s@?&#%<>"']+@[^\s@?&#%<>"']+\.[^\s@?&#%<>"']+$/

/** Адрес для href или null, если адрес нельзя безопасно вставлять в mailto: */
export function mailtoHref(email: string): string | null {
  return LINK_EMAIL_PATTERN.test(email) ? `mailto:${email}` : null
}
