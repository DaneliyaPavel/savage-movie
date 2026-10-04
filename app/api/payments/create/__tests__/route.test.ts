/**
 * Создание платежа: цену и название курса определяет сервер по данным backend.
 * Раньше сумма бралась из тела запроса, и любой мог оплатить курс за 1 рубль.
 */
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const COURSE_ID = '3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b'
const OTHER_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'

const createPayment = vi.fn()
const apiGet = vi.fn()
const loggerWarn = vi.fn()
const loggerError = vi.fn()
const fetchMock = vi.fn()

vi.mock('@/lib/payments/yookassa', () => ({
  createPayment: (...args: unknown[]) => createPayment(...args),
}))

vi.mock('@/lib/api/server', () => ({
  apiGet: (...args: unknown[]) => apiGet(...args),
}))

vi.mock('@/lib/env.server', () => ({
  // Слэш в конце: маршрут не должен дублировать его в пути запроса
  serverEnv: { API_URL: 'http://backend:8000/' },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: (...args: unknown[]) => loggerError(...args),
    warn: (...args: unknown[]) => loggerWarn(...args),
    info: vi.fn(),
  },
}))

import { POST } from '../route'

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/payments/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function backendCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: COURSE_ID,
    title: 'Монтаж с нуля',
    // Pydantic отдаёт Decimal строкой
    price: '5000.00',
    lessons: [],
    ...overrides,
  }
}

function backendReturns(body: unknown, status = 200) {
  // Тело Response читается один раз, поэтому на каждый вызов отдаём новый
  fetchMock.mockImplementation(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      })
  )
}

const guest = { name: 'Иван', email: 'ivan@example.com', phone: '+79990000000' }

beforeEach(() => {
  createPayment.mockReset()
  apiGet.mockReset()
  loggerWarn.mockReset()
  loggerError.mockReset()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)

  createPayment.mockResolvedValue({
    id: 'pay-1',
    status: 'pending',
    confirmation: { confirmation_url: 'https://yoomoney.ru/checkout/pay-1' },
  })
  // По умолчанию пользователь не авторизован, платит гостем
  apiGet.mockRejectedValue(new Error('HTTP 401: Unauthorized'))
  backendReturns(backendCourse())
})

describe('POST /api/payments/create: цена только с сервера', () => {
  it('сумма клиента в 1 рубль игнорируется: платёж на цену курса', async () => {
    const response = await POST(
      makeRequest({ courseId: COURSE_ID, courseTitle: 'EVIL', amount: 1, guest })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      paymentId: 'pay-1',
      paymentUrl: 'https://yoomoney.ru/checkout/pay-1',
    })

    expect(createPayment).toHaveBeenCalledTimes(1)
    const [amount, description, returnUrl, metadata] = createPayment.mock.calls[0]
    expect(amount).toBe(5000)
    expect(description).toBe('Оплата курса: Монтаж с нуля')
    expect(new URL(returnUrl as string).searchParams.get('courseId')).toBe(COURSE_ID)
    expect(metadata).toMatchObject({
      courseId: COURSE_ID,
      courseTitle: 'Монтаж с нуля',
      userEmail: guest.email,
    })
    expect(JSON.stringify(metadata)).not.toContain('EVIL')
  })

  it('курс запрашивается у backend без кук и без кеша', async () => {
    await POST(makeRequest({ courseId: COURSE_ID, amount: 5000, guest }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`http://backend:8000/api/courses/${COURSE_ID}`)
    expect(init.method).toBe('GET')
    expect(init.cache).toBe('no-store')
    expect(JSON.stringify(init.headers)).not.toMatch(/cookie|authorization/i)
  })

  it('старый клиент с amount и courseTitle и новый без них работают одинаково', async () => {
    await POST(
      makeRequest({ courseId: COURSE_ID, courseTitle: 'Монтаж с нуля', amount: 5000, guest })
    )
    await POST(makeRequest({ courseId: COURSE_ID, guest }))
    await POST(makeRequest({ courseId: COURSE_ID, amount: '5000', guest }))

    expect(createPayment).toHaveBeenCalledTimes(3)
    for (const call of createPayment.mock.calls) {
      expect(call[0]).toBe(5000)
      expect(call[1]).toBe('Оплата курса: Монтаж с нуля')
    }
    expect(loggerWarn).not.toHaveBeenCalled()
  })

  it('расхождение цены клиента логируется, платёж идёт по цене курса', async () => {
    const response = await POST(makeRequest({ courseId: COURSE_ID, amount: 1, guest }))

    expect(response.status).toBe(200)
    expect(createPayment.mock.calls[0][0]).toBe(5000)
    expect(loggerWarn).toHaveBeenCalledTimes(1)
  })

  it('цена-число и дробная цена с backend', async () => {
    backendReturns(backendCourse({ price: 1990.5 }))
    await POST(makeRequest({ courseId: COURSE_ID, guest }))
    expect(createPayment.mock.calls[0][0]).toBe(1990.5)
  })

  it('название и id берутся из ответа backend, а не из запроса', async () => {
    backendReturns(backendCourse({ id: COURSE_ID.toUpperCase(), title: 'Настоящее название' }))
    await POST(makeRequest({ courseId: COURSE_ID, courseTitle: 'Подделка', guest }))

    const [, description, , metadata] = createPayment.mock.calls[0]
    expect(description).toBe('Оплата курса: Настоящее название')
    expect(metadata.courseTitle).toBe('Настоящее название')
    expect(metadata.courseId).toBe(COURSE_ID.toUpperCase())
  })

  it('авторизованный пользователь: userId и email из сессии, сумма с сервера', async () => {
    apiGet.mockResolvedValue({ id: 'user-1', email: 'user@example.com' })

    const response = await POST(makeRequest({ courseId: COURSE_ID, amount: 1 }))

    expect(response.status).toBe(200)
    expect(createPayment.mock.calls[0][0]).toBe(5000)
    expect(createPayment.mock.calls[0][3]).toMatchObject({
      courseId: COURSE_ID,
      userId: 'user-1',
      userEmail: 'user@example.com',
    })
  })
})

describe('POST /api/payments/create: отказы', () => {
  it('неизвестный курс: 404, платёж не создаётся', async () => {
    backendReturns({ detail: 'Курс не найден' }, 404)

    const response = await POST(makeRequest({ courseId: OTHER_ID, amount: 1, guest }))

    expect(response.status).toBe(404)
    expect(createPayment).not.toHaveBeenCalled()
  })

  it.each([0, '0.00', null, -100])(
    'бесплатный курс (price=%j): 400, платёж не создаётся',
    async price => {
      backendReturns(backendCourse({ price }))

      const response = await POST(makeRequest({ courseId: COURSE_ID, amount: 100, guest }))

      expect(response.status).toBe(400)
      expect(createPayment).not.toHaveBeenCalled()
    }
  )

  it('курс без поля price считается бесплатным', async () => {
    backendReturns({ id: COURSE_ID, title: 'Без цены' })

    const response = await POST(makeRequest({ courseId: COURSE_ID, amount: 100, guest }))

    expect(response.status).toBe(400)
    expect(createPayment).not.toHaveBeenCalled()
  })

  it.each([
    ['backend отвечает 500', () => backendReturns({ detail: 'boom' }, 500)],
    ['backend недоступен', () => fetchMock.mockRejectedValue(new TypeError('fetch failed'))],
    ['ответ не по схеме', () => backendReturns({ unexpected: true })],
    ['цена не число', () => backendReturns(backendCourse({ price: 'abc' }))],
  ])('%s: 502, платёж не создаётся', async (_name, arrange) => {
    arrange()

    const response = await POST(makeRequest({ courseId: COURSE_ID, amount: 5000, guest }))

    expect(response.status).toBe(502)
    expect(createPayment).not.toHaveBeenCalled()
    expect(loggerError).toHaveBeenCalled()
  })

  it.each([
    'abc',
    '../auth/me',
    `${COURSE_ID}/../../auth/me`,
    `${COURSE_ID}?x=1`,
    `${COURSE_ID}#x`,
    'my-course-slug',
    '',
  ])('courseId %j не UUID: 400 и запроса к backend нет', async courseId => {
    const response = await POST(makeRequest({ courseId, amount: 5000, guest }))

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(createPayment).not.toHaveBeenCalled()
  })

  it.each([
    ['не JSON', 'не json'],
    ['пустое тело', {}],
    ['сумма не число', { courseId: COURSE_ID, amount: 'nope', guest }],
    ['сумма отрицательная', { courseId: COURSE_ID, amount: -5, guest }],
    [
      'гость без телефона',
      { courseId: COURSE_ID, guest: { name: 'Иван', email: 'a@b.co', phone: '' } },
    ],
  ])('%s: 400', async (_name, body) => {
    const response = await POST(makeRequest(body))

    expect(response.status).toBe(400)
    expect(createPayment).not.toHaveBeenCalled()
  })

  it('без сессии и без данных гостя: 401', async () => {
    const response = await POST(makeRequest({ courseId: COURSE_ID, amount: 5000 }))

    expect(response.status).toBe(401)
    expect(createPayment).not.toHaveBeenCalled()
  })

  it('ЮKassa не настроена: 503 как раньше', async () => {
    createPayment.mockRejectedValue(new Error('ЮKassa credentials не настроены'))

    const response = await POST(makeRequest({ courseId: COURSE_ID, amount: 5000, guest }))

    expect(response.status).toBe(503)
  })
})
