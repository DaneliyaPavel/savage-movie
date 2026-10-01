/**
 * Предзапись на следующий поток AI-курса (лендинг ai.savagemovie.ru).
 *
 * Форма на лендинге шлёт обычные поля /api/contact плюс `source: 'ai-course'`
 * и объект `lead` с тарифом, согласиями и метками. Здесь они проверяются и
 * превращаются в письмо, которое удобно читать и переносить в CRM: тема с
 * фиксированным префиксом, карточка с кнопкой связи, таблица полей, блок
 * «для CRM» и текстовая версия того же самого.
 */

export type AiCourseTier = 'basic' | 'advanced' | 'undecided'
export type AiCourseChannel = 'telegram' | 'phone' | 'email'

export interface AiCourseLead {
  tier: AiCourseTier
  channel: AiCourseChannel | null
  announcements: boolean
  consentRev: string
  button: string
  utm: string[]
  referrer: string
  page: string
}

export type AiCourseParse =
  | { kind: 'none' }
  | { kind: 'invalid'; error: string }
  | { kind: 'ok'; lead: AiCourseLead }

export interface AiCourseContact {
  name: string
  email: string | null
  phone: string | null
  telegram: string | null
}

export interface AiCourseMail {
  subject: string
  html: string
  text: string
  leadId: string
}

interface MailRow {
  label: string
  value: string
  href?: string
}

const TIER_LABELS: Record<AiCourseTier, string> = {
  basic: 'Базовый (4 занятия)',
  advanced: 'Продвинутый (6 занятий)',
  undecided: 'Пока не выбран',
}

const TIER_SHORT: Record<AiCourseTier, string> = {
  basic: 'Базовый',
  advanced: 'Продвинутый',
  undecided: 'тариф не выбран',
}

const CHANNEL_LABELS: Record<AiCourseChannel, string> = {
  telegram: 'Telegram',
  phone: 'Телефон',
  email: 'Email',
}

const BUTTON_LABELS: Record<string, string> = {
  hero: 'Большой блок в шапке',
  topbar: 'Кнопка в верхней полосе',
  strip: 'Полоса под шапкой',
  'tier-basic': 'Карточка тарифа «Базовый»',
  'tier-advanced': 'Карточка тарифа «Продвинутый»',
  final: 'Финальный экран',
  sticky: 'Липкая плашка',
  link: 'Ссылка с #enroll',
}

const SUBJECT_PREFIX = '[AI-курс]'

const COLOR = {
  ink: '#08080A',
  ember: '#E2402C',
  bone: '#EDE7DE',
  paper: '#F7F4EF',
  page: '#EFEAE2',
  line: '#E5DFD5',
  text: '#1B1B1F',
  muted: '#7C766C',
}
const FONT = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"

const TELEGRAM_HANDLE_PATTERN = /^@?[a-zA-Z0-9_]{5,32}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** В ссылку mailto: попадает только адрес без «?», «&», «#»: иначе в него можно подмешать bcc или body */
const LINK_EMAIL_PATTERN = /^[^\s@?&#%<>"']+@[^\s@?&#%<>"']+\.[^\s@?&#%<>"']+$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Короткая строка без управляющих символов */
function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/** Проверяет блок `lead` из тела запроса. Без согласия на обработку данных заявку не принимаем. */
export function parseAiCourseLead(body: Record<string, unknown>): AiCourseParse {
  if (body.source !== 'ai-course') return { kind: 'none' }

  const lead = isRecord(body.lead) ? body.lead : {}
  const consent = isRecord(lead.consent) ? lead.consent : {}

  if (consent.personalData !== true) {
    return { kind: 'invalid', error: 'Нужно согласие на обработку персональных данных' }
  }

  const tier: AiCourseTier =
    lead.tier === 'basic' || lead.tier === 'advanced' ? lead.tier : 'undecided'

  const channel: AiCourseChannel | null =
    lead.channel === 'telegram' || lead.channel === 'phone' || lead.channel === 'email'
      ? lead.channel
      : null

  const revRaw = cleanText(consent.rev, 20)
  const consentRev = /^[0-9a-z.-]+$/i.test(revRaw) ? revRaw : ''

  const buttonRaw = cleanText(lead.button, 40)
  const button = /^[a-z0-9-]+$/i.test(buttonRaw) ? buttonRaw : 'unknown'

  const utm: string[] = []
  if (isRecord(lead.utm)) {
    for (const [key, raw] of Object.entries(lead.utm)) {
      if (utm.length >= 6) break
      const value = cleanText(raw, 80)
      if (/^utm_[a-z0-9_]{1,20}$/i.test(key) && value) utm.push(`${key.toLowerCase()}=${value}`)
    }
  }

  const referrerRaw = cleanText(lead.referrer, 100)
  const referrer = /^[a-z0-9.-]+$/i.test(referrerRaw) ? referrerRaw : ''

  const pageRaw = cleanText(lead.page, 200)
  const page = /^https?:\/\/[^\s]+$/i.test(pageRaw) ? pageRaw : ''

  return {
    kind: 'ok',
    lead: {
      tier,
      channel,
      announcements: consent.announcements === true,
      consentRev,
      button,
      utm,
      referrer,
      page,
    },
  }
}

function mskParts(date: Date) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const pick = (type: string) => parts.find(part => part.type === type)?.value ?? '00'
  return {
    yy: pick('year'),
    mm: pick('month'),
    dd: pick('day'),
    hh: pick('hour'),
    mi: pick('minute'),
  }
}

/** Время по Москве, как его читает менеджер */
export function formatMsk(date: Date): string {
  return `${date.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })} (МСК)`
}

/** Номер заявки для CRM и переписки: AI-ггммдд-ччмм-XXXX */
export function makeLeadId(date: Date, random: () => number = Math.random): string {
  const { yy, mm, dd, hh, mi } = mskParts(date)
  const suffix = Math.floor(random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, '0')
  return `AI-${yy}${mm}${dd}-${hh}${mi}-${suffix}`
}

function telegramHandle(value: string): string {
  return value.replace(/^@/, '')
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function buildRows(
  lead: AiCourseLead,
  contact: AiCourseContact,
  leadId: string,
  receivedAt: Date
): MailRow[] {
  const when = formatMsk(receivedAt)
  const preferred = (channel: AiCourseChannel) =>
    lead.channel === channel ? ' · удобнее всего' : ''

  const rows: MailRow[] = [
    { label: 'ID заявки', value: leadId },
    { label: 'Принята', value: when },
    { label: 'Имя', value: contact.name },
  ]

  if (contact.telegram && TELEGRAM_HANDLE_PATTERN.test(contact.telegram)) {
    rows.push({
      label: 'Telegram',
      value: `${contact.telegram}${preferred('telegram')}`,
      href: `https://t.me/${telegramHandle(contact.telegram)}`,
    })
  }
  if (contact.phone && phoneDigits(contact.phone).length >= 5) {
    rows.push({
      label: 'Телефон',
      value: `${contact.phone}${preferred('phone')}`,
      href: `tel:+${phoneDigits(contact.phone)}`,
    })
  }
  if (contact.email && EMAIL_PATTERN.test(contact.email)) {
    rows.push({
      label: 'Email',
      value: `${contact.email}${preferred('email')}`,
      ...(LINK_EMAIL_PATTERN.test(contact.email) ? { href: `mailto:${contact.email}` } : {}),
    })
  }

  rows.push(
    { label: 'Тариф', value: TIER_LABELS[lead.tier] },
    {
      label: 'Согласие на обработку ПДн',
      value: `Да, ${when}${lead.consentRev ? ` · редакция ${lead.consentRev}` : ''}`,
    },
    {
      label: 'Согласие на анонсы',
      value: lead.announcements ? 'Да, можно присылать анонсы и новости' : 'Нет',
    },
    { label: 'Кнопка записи', value: BUTTON_LABELS[lead.button] ?? lead.button }
  )
  if (lead.utm.length) rows.push({ label: 'Метки', value: lead.utm.join(', ') })
  if (lead.referrer) rows.push({ label: 'Пришёл с', value: lead.referrer })
  if (lead.page) rows.push({ label: 'Страница', value: lead.page })

  return rows
}

function buildSubject(lead: AiCourseLead, name: string): string {
  return `${SUBJECT_PREFIX} Предзапись — ${name} · ${TIER_SHORT[lead.tier]}`.replace(/[\r\n]/g, ' ')
}

function contactSummary(contact: AiCourseContact): string {
  return contact.telegram || contact.phone || contact.email || ''
}

function buildText(rows: MailRow[], contact: AiCourseContact): string {
  const lines = rows.map(row => `${row.label}: ${row.value}`)
  return [
    'НОВАЯ ПРЕДЗАПИСЬ НА СЛЕДУЮЩИЙ ПОТОК · обучение AI-контенту',
    `(${contact.name}, ${contactSummary(contact)})`,
    '',
    ...lines,
    '',
    'Письмо сформировано автоматически формой на ai.savagemovie.ru.',
  ].join('\n')
}

function actionButton(label: string, href: string, primary: boolean): string {
  const style = primary
    ? `background:${COLOR.ember};color:#ffffff;border:1px solid ${COLOR.ember};`
    : `background:#ffffff;color:${COLOR.text};border:1px solid ${COLOR.line};`
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;${style}font-family:${FONT};font-size:14px;font-weight:700;line-height:1.2;text-decoration:none;">${escapeHtml(label)}</a>`
}

function chip(text: string, accent: boolean): string {
  const color = accent ? COLOR.ember : COLOR.muted
  return `<span style="display:inline-block;margin:0 6px 6px 0;padding:4px 10px;border:1px solid ${color};color:${color};font-family:${FONT};font-size:12px;letter-spacing:.04em;">${escapeHtml(text)}</span>`
}

function buildHtml(
  lead: AiCourseLead,
  contact: AiCourseContact,
  rows: MailRow[],
  receivedAt: Date
): string {
  const name = escapeHtml(contact.name)

  const actions: string[] = []
  if (contact.telegram && TELEGRAM_HANDLE_PATTERN.test(contact.telegram)) {
    actions.push(
      actionButton(
        'Открыть в Telegram',
        `https://t.me/${telegramHandle(contact.telegram)}`,
        lead.channel === 'telegram' || lead.channel === null
      )
    )
  }
  if (contact.phone && phoneDigits(contact.phone).length >= 5) {
    actions.push(
      actionButton(`Позвонить ${contact.phone}`, `tel:+${phoneDigits(contact.phone)}`, lead.channel === 'phone')
    )
  }
  if (contact.email && LINK_EMAIL_PATTERN.test(contact.email)) {
    actions.push(
      actionButton(
        'Написать на почту',
        `mailto:${contact.email}?subject=${encodeURIComponent('Предзапись на следующий поток')}`,
        lead.channel === 'email'
      )
    )
  }

  const detailRows = rows
    .map(row => {
      const value = row.href
        ? `<a href="${escapeHtml(row.href)}" style="color:${COLOR.ember};text-decoration:none;font-weight:600;">${escapeHtml(row.value)}</a>`
        : escapeHtml(row.value)
      return `<tr>
<td style="width:38%;padding:11px 12px 11px 0;border-bottom:1px solid ${COLOR.line};font-family:${FONT};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${COLOR.muted};vertical-align:top;">${escapeHtml(row.label)}</td>
<td style="padding:11px 0;border-bottom:1px solid ${COLOR.line};font-family:${FONT};font-size:15px;line-height:1.45;color:${COLOR.text};vertical-align:top;word-break:break-word;">${value}</td>
</tr>`
    })
    .join('\n')

  const crmBlock = rows.map(row => `${row.label}: ${row.value}`).join('\n')

  const chips = [
    chip(TIER_SHORT[lead.tier], lead.tier !== 'undecided'),
    ...(lead.channel ? [chip(CHANNEL_LABELS[lead.channel], false)] : []),
    ...(lead.announcements ? [chip('Согласен на анонсы', false)] : []),
  ].join('')

  const noReplyHint = contact.email
    ? 'Кнопка «Ответить» в почтовом клиенте напишет клиенту на указанный email.'
    : 'Клиент не оставил email: «Ответить» уйдёт на общий ящик, связывайтесь через кнопки выше.'

  const preheader = escapeHtml(`${contact.name} · ${contactSummary(contact)} · ${TIER_SHORT[lead.tier]}`)

  return `<!doctype html>
<html lang="ru">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Предзапись на следующий поток</title></head>
<body style="margin:0;padding:0;background:${COLOR.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.page};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${COLOR.line};">
<tr><td style="background:${COLOR.ink};padding:20px 28px;font-family:${FONT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="font-family:${FONT};font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:${COLOR.bone};">Savage Movie · <b>Mari Seven</b></td>
<td align="right" style="font-family:${FONT};font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${COLOR.ember};">Предзапись</td>
</tr></table>
</td></tr>
<tr><td style="height:3px;line-height:3px;font-size:0;background:${COLOR.ember};">&nbsp;</td></tr>
<tr><td style="padding:28px 28px 8px;">
<div style="font-family:${FONT};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${COLOR.muted};">Новая заявка на следующий поток · обучение AI-контенту</div>
<div style="font-family:${FONT};font-size:28px;line-height:1.2;font-weight:700;color:${COLOR.ink};margin:10px 0 14px;">${name}</div>
<div>${chips}</div>
</td></tr>
<tr><td style="padding:12px 28px 4px;">${actions.join('')}</td></tr>
<tr><td style="padding:16px 28px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COLOR.line};">
${detailRows}
</table>
</td></tr>
<tr><td style="padding:16px 28px 28px;">
<div style="font-family:${FONT};font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:${COLOR.muted};margin-bottom:8px;">Для CRM: скопировать целиком</div>
<pre style="margin:0;padding:14px 16px;background:${COLOR.paper};border:1px solid ${COLOR.line};font-family:${MONO};font-size:12px;line-height:1.65;color:${COLOR.text};white-space:pre-wrap;word-break:break-word;">${escapeHtml(crmBlock)}</pre>
</td></tr>
<tr><td style="padding:16px 28px;background:${COLOR.paper};border-top:1px solid ${COLOR.line};font-family:${FONT};font-size:12px;line-height:1.55;color:${COLOR.muted};">
Письмо сформировано автоматически формой на ai.savagemovie.ru, ${escapeHtml(formatMsk(receivedAt))}. ${escapeHtml(noReplyHint)}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

/** Собирает письмо менеджеру: тема, HTML и текстовая версия */
export function buildAiCourseMail(
  lead: AiCourseLead,
  contact: AiCourseContact,
  receivedAt: Date = new Date(),
  random: () => number = Math.random
): AiCourseMail {
  const leadId = makeLeadId(receivedAt, random)
  const rows = buildRows(lead, contact, leadId, receivedAt)
  return {
    subject: buildSubject(lead, contact.name),
    html: buildHtml(lead, contact, rows, receivedAt),
    text: buildText(rows, contact),
    leadId,
  }
}
