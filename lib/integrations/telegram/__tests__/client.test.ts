import { describe, expect, it, vi, beforeEach } from 'vitest'

describe('telegram client', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.TELEGRAM_BOT_TOKEN = 'token-123'
    process.env.TELEGRAM_CHAT_ID = 'chat-456'
    process.env.TELEGRAM_API_BASE = 'https://relay.example.com/'
  })

  it('шлёт сообщение через реле и экранирует HTML', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    const { sendTelegramMessage, escapeTelegram, isTelegramConfigured } = await import('../client')

    expect(isTelegramConfigured()).toBe(true)
    expect(escapeTelegram('a & b <c> "d"')).toBe('a &amp; b &lt;c&gt; "d"')

    await sendTelegramMessage('привет')

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('https://relay.example.com/bottoken-123/sendMessage')
    expect(JSON.parse(options.body as string)).toEqual({
      chat_id: 'chat-456',
      text: 'привет',
      parse_mode: 'HTML',
    })
  })

  it('падает с ошибкой, когда Bot API отвечает не 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502, text: async () => 'bad gateway' }))
    const { sendTelegramMessage } = await import('../client')
    await expect(sendTelegramMessage('x')).rejects.toThrow('Telegram API error: 502')
  })
})
