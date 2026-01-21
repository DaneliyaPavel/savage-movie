import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Logger } from '../logger'

describe('Logger', () => {
  let logger: Logger
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>
    info: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    logger = new Logger()
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should log info messages', () => {
    logger.info('Test message')
    expect(consoleSpy.info).toHaveBeenCalled()
  })

  it('should log error messages', () => {
    const error = new Error('Test error')
    logger.error('Test error message', error)
    expect(consoleSpy.error).toHaveBeenCalled()
  })

  it('should include context in logs', () => {
    logger.info('Test message', { key: 'value' })
    const call = consoleSpy.info.mock.calls[0]?.[0]
    expect(call).toContain('Test message')
    expect(call).toContain('value')
  })
})
