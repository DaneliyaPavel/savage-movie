/**
 * Форма сметы: цель production_lead_success должна уходить только тогда,
 * когда сервер действительно принял заявку — и ровно один раз.
 *
 * Это то же требование, что и для /contact, но здесь цена ошибки выше:
 * на лендинг заводится платный трафик, и завышенное число конверсий
 * напрямую искажает расчёт стоимости заявки в Директе.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { DEFAULT_COMMERCIAL_LANDING } from '@/lib/commercial-landing/content'
import { EstimateForm } from '../estimate-form'

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const { content: estimateContent, success } = {
  content: DEFAULT_COMMERCIAL_LANDING.estimate,
  success: DEFAULT_COMMERCIAL_LANDING.success,
}

function renderForm() {
  return render(
    <EstimateForm
      content={estimateContent}
      success={success}
      presetProjectType={null}
      onBookingClick={() => undefined}
    />
  )
}

/**
 * Проходим первый шаг и заполняем контактные поля второго.
 * Между шагами стоит анимированный переход, поэтому поля второго шага
 * появляются не в том же тике — ждём их явно.
 */
async function fillValidLead({ consent = true }: { consent?: boolean } = {}) {
  fireEvent.click(screen.getByRole('button', { name: 'Рекламный ролик' }))
  fireEvent.click(screen.getByRole('button', { name: '400–700 тыс.' }))
  fireEvent.click(screen.getByRole('button', { name: /Дальше/ }))

  fireEvent.change(await screen.findByLabelText('Имя'), { target: { value: 'Иван Тестовый' } })
  fireEvent.change(screen.getByLabelText('Куда написать'), {
    target: { value: '+79990000000' },
  })
  if (consent) {
    fireEvent.click(screen.getByRole('checkbox'))
  }
}

const submitButton = () =>
  screen.getByRole('button', { name: new RegExp(estimateContent.submitLabel) })

describe('Форма предварительной сметы', () => {
  let ym: ReturnType<typeof vi.fn>
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    ym = vi.fn((_id: number, action: string, ...args: unknown[]) => {
      // getClientID отдаёт значение через колбэк
      if (action === 'getClientID') (args[0] as (value: string) => void)('client-1')
    })
    window.ym = ym as unknown as typeof window.ym

    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  afterEach(() => {
    delete window.ym
    vi.unstubAllGlobals()
  })

  const goals = () =>
    ym.mock.calls.filter(call => call[1] === 'reachGoal').map(call => call[2] as string)

  it('успешная заявка: конверсия уходит ровно один раз', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) })

    renderForm()
    await fillValidLead()
    fireEvent.click(submitButton())

    await screen.findByText(success.title)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/estimate')
    expect(goals().filter(goal => goal === 'production_lead_success')).toHaveLength(1)
  })

  it('сервер ответил ошибкой: показываем ошибку, конверсии нет', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Ошибка отправки заявки' }),
    })

    renderForm()
    await fillValidLead()
    fireEvent.click(submitButton())

    await screen.findByRole('alert')

    expect(screen.queryByText(success.title)).not.toBeInTheDocument()
    expect(goals()).not.toContain('production_lead_success')
  })

  it('сеть недоступна: конверсии нет, форма не падает', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))

    renderForm()
    await fillValidLead()
    fireEvent.click(submitButton())

    await screen.findByRole('alert')
    expect(goals()).not.toContain('production_lead_success')
  })

  it('без согласия на обработку ПД запрос не уходит', async () => {
    renderForm()
    await fillValidLead({ consent: false })
    fireEvent.click(submitButton())

    await screen.findByRole('alert')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(goals()).not.toContain('production_lead_success')
  })

  it('двойная отправка: одна заявка и одна конверсия', async () => {
    // Заявке предшествует запрос ClientID, поэтому fetch вызывается не в том же
    // тике, что и клик: promise создаём заранее, иначе резолвить ещё нечего
    let resolveRequest: (value: unknown) => void = () => undefined
    const pendingRequest = new Promise(resolve => {
      resolveRequest = resolve
    })
    fetchMock.mockReturnValue(pendingRequest)

    renderForm()
    await fillValidLead()

    const button = submitButton()
    const form = button.closest('form') as HTMLFormElement

    fireEvent.click(button)
    // Кнопка уже disabled, но Enter в поле шлёт submit мимо неё — это и проверяем
    fireEvent.click(button)
    fireEvent.submit(form)

    resolveRequest({ ok: true, status: 200, json: async () => ({ success: true }) })
    await screen.findByText(success.title)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(goals().filter(goal => goal === 'production_lead_success')).toHaveLength(1)
  })

  it('Метрика заблокирована: заявка всё равно отправляется', async () => {
    delete window.ym
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) })

    renderForm()
    await fillValidLead()
    fireEvent.click(submitButton())

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await screen.findByText(success.title)
  })

  it('шаги воронки размечены: старт, выбор типа и бюджета, конец первого шага', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) })

    renderForm()
    await fillValidLead()

    expect(goals()).toEqual(
      expect.arrayContaining([
        'estimate_form_start',
        'estimate_project_type',
        'estimate_budget_select',
        'estimate_step1_complete',
      ])
    )
  })

  it('estimate_step1_complete несёт реальные тип и бюджет, а не «не выбрано»', async () => {
    renderForm()
    await fillValidLead()

    const step1 = ym.mock.calls.find(call => call[2] === 'estimate_step1_complete')
    expect(step1?.[3]).toEqual({ project_type: 'ad', budget_range: '400-700' })
  })

  it('возврат на первый шаг не удваивает estimate_step1_complete', async () => {
    renderForm()
    await fillValidLead()

    fireEvent.click(screen.getByRole('button', { name: /Назад/ }))
    fireEvent.click(await screen.findByRole('button', { name: /Дальше/ }))
    await screen.findByLabelText('Имя')

    expect(goals().filter(goal => goal === 'estimate_step1_complete')).toHaveLength(1)
  })

  it('в заявку уходят метки Директа и ClientID Метрики', async () => {
    window.history.replaceState({}, '', '/reklamny-rolik?utm_source=yandex&yclid=42')
    const { captureAttribution } = await import('@/lib/analytics/attribution')
    captureAttribution()

    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) })

    renderForm()
    await fillValidLead()
    fireEvent.click(submitButton())

    await screen.findByText(success.title)

    const payload = JSON.parse(fetchMock.mock.calls[0]![1].body as string)
    expect(payload.attribution).toMatchObject({ utm_source: 'yandex', yclid: '42' })
    expect(payload.clientId).toBe('client-1')
    expect(payload.landingPath).toBe('/reklamny-rolik')
  })
})
