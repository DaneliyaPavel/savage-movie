/**
 * Направление production в заявке.
 *
 * Поле service_direction — то, по чему продажи понимают, с какой территории
 * пришёл человек, а маркетинг сводит воронки направлений. Оно не спрашивается
 * у клиента отдельным вопросом: страница знает направление по нажатому CTA,
 * бриф направлений знает его по первому ответу, а коммерческая посадочная —
 * по самому факту, что заявка пришла с неё.
 *
 * Отсюда три источника и строгий порядок между ними, который и проверяется.
 */
import { describe, expect, it } from 'vitest'

import { resolveServiceDirection } from '@/app/api/estimate/route'
import { COMMERCIAL_LANDING_PATH } from '@/lib/commercial-landing/content'
import { SERVICES_PATH } from '@/lib/services/directions'

describe('resolveServiceDirection', () => {
  it('явное значение со страницы выигрывает у всего остального', () => {
    expect(resolveServiceDirection('fashion', 'ad', COMMERCIAL_LANDING_PATH)).toBe('fashion')
  })

  it('подставное значение игнорируется: направления с таким id не существует', () => {
    expect(resolveServiceDirection('что-угодно', null, SERVICES_PATH)).toBeNull()
  })

  it('ответ на первый вопрос брифа направлений и есть направление', () => {
    expect(resolveServiceDirection('', 'beauty', SERVICES_PATH)).toBe('beauty')
  })

  it('тип проекта коммерческой формы направлением не считается', () => {
    // «ad» — формат ролика, а не территория: направление здесь даёт лендинг
    expect(resolveServiceDirection('', 'ad', COMMERCIAL_LANDING_PATH)).toBe('commercial')
  })

  it('коммерческая посадочная размечает заявку даже без ответов', () => {
    expect(resolveServiceDirection('', null, COMMERCIAL_LANDING_PATH)).toBe('commercial')
  })

  /**
   * Заявка с произвольной страницы остаётся без направления. Выдумать его
   * за клиента значит завести в отчётах территорию, которую он не выбирал.
   */
  it('с прочих страниц направление остаётся пустым, а не угадывается', () => {
    expect(resolveServiceDirection('', null, '/contact')).toBeNull()
  })
})
