#!/usr/bin/env node
/**
 * Готовит запись commercial_landing с новыми ценовыми якорями.
 *
 * Зачем нужен отдельный скрипт. Блок стоимости на /reklamny-rolik правится в
 * админке, и в настройках сайта лежит полная запись лендинга. Мерж заменяет
 * массивы целиком (см. lib/commercial-landing/merge.ts), поэтому смена цен в
 * коде НЕ меняет живую страницу: сохранённые диапазоны продолжают выигрывать.
 *
 * Скрипт только читает продакшн и кладёт рядом готовый JSON. Он ничего никуда
 * не записывает — публикация остаётся ручным действием человека.
 *
 * Использование:
 *   node scripts/commercial-pricing-patch.mjs [--base https://savagemovie.ru]
 *
 * Дальше есть два пути:
 *   1) открыть /admin/landing и поправить пять полей руками (скрипт печатает,
 *      какие именно и на что) — самый безопасный вариант;
 *   2) отдать получившийся файл тому, кто умеет делать PUT /api/settings с
 *      админским токеном.
 *
 * Поля формы (тип проекта, площадки, сроки, диапазоны бюджета) трогать не
 * нужно: ими владеет код, и мерж возвращает их к текущим значениям сам.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)
const baseIndex = args.indexOf('--base')
const base = baseIndex === -1 ? 'https://savagemovie.ru' : args[baseIndex + 1]

if (!base) {
  console.error('Не указан адрес после --base')
  process.exit(1)
}

/**
 * Новые якоря. Держим здесь текстом, а не импортом из content.ts: это .mjs без
 * сборки, а TypeScript-модуль тянет за собой алиасы и типы. Значения обязаны
 * совпадать с lib/commercial-landing/content.ts — за этим следит
 * lib/commercial-landing/__tests__/pricing-consistency.test.ts.
 */
const TIERS = {
  compact: { name: 'Компактный формат', range: 'до 350 тыс. ₽' },
  core: { name: 'Основной коммерческий сегмент', range: '350–700 тыс. ₽' },
  extended: { name: 'Расширенные кампании', range: 'от 700 тыс. ₽' },
}

const BUDGET_QUALIFIER = 'Большинство коммерческих проектов — 350–700 тыс. ₽'

const FAQ_PRICING_ANSWER =
  'Основной коммерческий сегмент — 350–700 тыс. ₽: в него попадает большинство проектов Savage Movie. ' +
  'Расширенные кампании с несколькими сменами, актёрами и графикой — от 700 тыс. ₽. ' +
  'Компактный формат до 350 тыс. ₽ возможен, когда объём производства сознательно сокращён. ' +
  'Как складывается сумма — разобрали в отдельной статье о бюджете рекламного ролика.'

const changes = []

function note(field, from, to) {
  if (from === to) return
  changes.push({ field, from, to })
}

const response = await fetch(new URL('/api/settings', base))
if (!response.ok) {
  console.error(`Не удалось прочитать настройки: ${response.status} ${response.statusText}`)
  process.exit(1)
}

const payload = await response.json()
const stored = payload?.settings?.commercial_landing

if (!stored) {
  console.log('В настройках нет записи commercial_landing — лендинг живёт на дефолтах из кода.')
  console.log('Ничего делать не нужно: новые цены поедут вместе с деплоем.')
  process.exit(0)
}

const content = typeof stored === 'string' ? JSON.parse(stored) : stored
const patched = structuredClone(content)

for (const tier of patched.pricing?.tiers ?? []) {
  const next = TIERS[tier.id]
  if (!next) continue
  note(`pricing.tiers[${tier.id}].name`, tier.name, next.name)
  note(`pricing.tiers[${tier.id}].range`, tier.range, next.range)
  tier.name = next.name
  tier.range = next.range
}

if (patched.hero) {
  note('hero.budgetQualifier', patched.hero.budgetQualifier, BUDGET_QUALIFIER)
  patched.hero.budgetQualifier = BUDGET_QUALIFIER
}

const pricingQuestion = (patched.faq?.items ?? []).find(item =>
  item.question?.includes('Сколько стоит')
)
if (pricingQuestion) {
  note('faq: «Сколько стоит рекламный ролик?»', pricingQuestion.answer, FAQ_PRICING_ANSWER)
  pricingQuestion.answer = FAQ_PRICING_ANSWER
}

if (changes.length === 0) {
  console.log('Живая запись уже согласована с новой коммерческой позицией. Делать нечего.')
  process.exit(0)
}

const outFile = resolve(process.cwd(), 'commercial-landing.patched.json')
writeFileSync(outFile, JSON.stringify(patched, null, 2), 'utf8')

console.log(`Прочитано с ${base}. Полей к правке: ${changes.length}\n`)
for (const change of changes) {
  console.log(`• ${change.field}`)
  console.log(`    было:  ${String(change.from).slice(0, 160)}`)
  console.log(`    стало: ${String(change.to).slice(0, 160)}\n`)
}
console.log(`Готовая запись целиком: ${outFile}`)
console.log('Ничего не отправлено — публикуйте через /admin/landing или PUT /api/settings.')
