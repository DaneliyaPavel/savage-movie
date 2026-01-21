/**
 * Централизованная утилита для логирования
 * Заменяет console.log/error/warn на структурированное логирование
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment: boolean
  private isProduction: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage(level, message, context)

    // В production логируем только ошибки и предупреждения
    if (this.isProduction && (level === 'debug' || level === 'info')) {
      return
    }

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage)
        }
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'warn':
        console.warn(formattedMessage)
        break
      case 'error':
        console.error(formattedMessage)
        break
    }
  }

  /**
   * Логирование отладочной информации (только в development)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Логирование информационных сообщений
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Логирование предупреждений
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Логирование ошибок
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
    }

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else if (error) {
      errorContext.error = error
    }

    this.log('error', message, errorContext)
  }
}

// Экспортируем singleton экземпляр
export const logger = new Logger()

// Экспортируем класс для тестирования
export { Logger }
