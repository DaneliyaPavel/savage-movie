/**
 * Конверсия production_lead_success должна отправляться только тогда,
 * когда сервер действительно принял заявку — и ровно один раз.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nProvider } from '@/lib/i18n-context'
import { MenuProvider } from '@/components/ui/menu-context'
import ContactPage from '../page'

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

/** framer-motion useInView опирается на IntersectionObserver, в jsdom его нет */
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

function renderContactPage() {
  return render(
    <I18nProvider>
      <MenuProvider>
        <ContactPage />
      </MenuProvider>
    </I18nProvider>
  )
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Иван Тестовый' } })
  fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+79990000000' } })
  fireEvent.change(screen.getByLabelText('Расскажите о вашем проекте'), {
    target: { value: 'Нужен рекламный ролик, бюджет обсудим' },
  })
}

function fillValidLead() {
  fillRequiredFields()
  fireEvent.click(screen.getByRole('checkbox'))
}

const submitButton = () => screen.getByRole('button', { name: /Отправить запрос/ })

describe('/contact — цель production_lead_success', () => {
  let ym: ReturnType<typeof vi.fn>
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
    ym = vi.fn()
    window.ym = ym
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    delete window.ym
    vi.unstubAllGlobals()
  })

  it('TEST 1 — успешная заявка: цель уходит ровно один раз', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) })

    renderContactPage()
    fillValidLead()
    fireEvent.click(submitButton())

    await screen.findByText(/Заявка отправлена/)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/contact')
    expect(ym).toHaveBeenCalledTimes(1)
    expect(ym).toHaveBeenCalledWith(108213944, 'reachGoal', 'production_lead_success')
  })

  it('TEST 2 — нет согласия на обработку ПД: запрос не уходит, цели нет', async () => {

    renderContactPage()
    fillRequiredFields()
    fireEvent.click(submitButton())

    await screen.findByText(/Необходимо дать согласие/)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(ym).not.toHaveBeenCalled()
  })

  it('TEST 3 — сервер ответил ошибкой: показываем ошибку, цели нет', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Ошибка отправки заявки' }),
    })

    renderContactPage()
    fillValidLead()
    fireEvent.click(submitButton())

    await screen.findByText(/Не удалось отправить заявку/)

    expect(screen.queryByText(/Заявка отправлена/)).not.toBeInTheDocument()
    expect(ym).not.toHaveBeenCalled()
  })

  it('TEST 3b — сеть недоступна: цели нет, приложение не падает', async () => {
    fetchMock.mockRejectedValue(new Error('Failed to fetch'))

    renderContactPage()
    fillValidLead()
    fireEvent.click(submitButton())

    await screen.findByText(/Не удалось отправить заявку/)
    expect(ym).not.toHaveBeenCalled()
  })

  it('TEST 4 — двойной клик: одна заявка и одна конверсия', async () => {
    let resolveRequest: (value: unknown) => void = () => {}
    fetchMock.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveRequest = resolve
        })
    )

    renderContactPage()
    fillValidLead()

    const button = submitButton()
    const form = button.closest('form') as HTMLFormElement

    fireEvent.click(button)
    // Кнопка уже disabled, но Enter в поле шлёт submit мимо неё — это и проверяем
    fireEvent.click(button)
    fireEvent.submit(form)

    resolveRequest({ ok: true, status: 200, json: async () => ({ success: true }) })
    await screen.findByText(/Заявка отправлена/)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(ym).toHaveBeenCalledTimes(1)
  })

  it('TEST 5 — Метрика не загрузилась: заявка всё равно отправляется', async () => {
    delete window.ym
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) })

    renderContactPage()
    fillValidLead()
    fireEvent.click(submitButton())

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await screen.findByText(/Заявка отправлена/)
  })
})
