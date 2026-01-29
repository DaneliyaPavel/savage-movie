/**
 * React Error Boundary для обработки ошибок в компонентах
 */
'use client'

import React, { Component, type ReactNode } from 'react'
import { logger } from '@/lib/utils/logger'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Логируем ошибку
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Что-то пошло не так</h2>
          <p className="text-muted-foreground mb-4">Произошла ошибка при загрузке компонента.</p>
          {this.state.error && process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-muted rounded-lg max-w-2xl">
              <summary className="cursor-pointer font-medium mb-2">Детали ошибки</summary>
              <pre className="text-sm overflow-auto">
                {this.state.error.message}
                {this.state.error.stack && (
                  <>
                    {'\n\n'}
                    {this.state.error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Перезагрузить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
