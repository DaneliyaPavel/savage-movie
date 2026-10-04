import { describe, expect, it } from 'vitest'

import { mailtoHref } from '../mailto'

describe('mailtoHref', () => {
  it.each(['client@example.com', 'ivan.petrov+brief@mail.ru', 'a_b-c@sub.domain.example.org'])(
    'делает ссылку для обычного адреса %s',
    email => {
      expect(mailtoHref(email)).toBe(`mailto:${email}`)
    }
  )

  it.each([
    ['bcc через процентное кодирование', 'x@y.zz?bcc=attacker%40evil.example&subject=hi&body=call'],
    ['только параметры', 'x@y.zz?subject=hi'],
    ['амперсанд', 'x@y.zz&cc=attacker@evil.example'],
    ['решётка', 'x@y.zz#frag'],
    ['процент в локальной части', 'a%40b@example.com'],
    ['кавычка', "o'brien@example.com"],
    ['угловые скобки', '<x@y.zz>'],
    ['пробел', 'x@y.zz foo'],
    ['два адреса', 'a@b.cc,attacker@evil.com'],
  ])('не делает ссылку: %s', (_label, email) => {
    expect(mailtoHref(email)).toBeNull()
  })
})
