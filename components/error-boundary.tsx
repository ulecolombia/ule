/**
 * ULE - ERROR BOUNDARY
 * Componente para capturar errores de React
 */

'use client'

import React from 'react'
import { logger } from '@/lib/logger'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Usar logger para error estructurado
    logger.error('[ULE ERROR BOUNDARY] Error capturado', error, {
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    })

    // Enviar a console visible en desarrollo
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.table({
        'Error Type': error.name,
        'Error Message': error.message,
        'Timestamp': new Date().toISOString(),
      })
    }

    // Enviar error al sistema de analytics
    if (typeof window !== 'undefined') {
      this.logErrorToAnalytics(error, errorInfo)

      // Enviar a Sentry si está configurado
      if ((window as any).Sentry) {
        ;(window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        })
      }
    }
  }

  async logErrorToAnalytics(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const sessionId = sessionStorage.getItem('sessionId') || undefined

      await fetch('/api/analytics/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: error.message,
          stack: error.stack,
          tipo: error.name,
          severidad: 'CRITICAL',
          url: window.location.href,
          componente: 'ErrorBoundary',
          accion: 'component_crash',
          sessionId,
          metadata: {
            componentStack: errorInfo.componentStack,
          },
        }),
      })
    } catch (err) {
      console.error('Error logging to analytics:', err)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-3xl rounded-lg bg-white p-8 shadow-md">
            <h2 className="mb-4 text-2xl font-bold text-red-600">
              ⚠️ Algo salió mal
            </h2>
            <p className="mb-4 text-gray-700">
              Ha ocurrido un error inesperado.
            </p>

            {/* SIEMPRE mostrar el error para debugging */}
            {this.state.error && (
              <div className="mb-4 max-h-96 overflow-auto rounded bg-red-50 p-4 text-sm border-2 border-red-300">
                <div className="mb-3">
                  <p className="font-bold text-red-900 mb-1">Error Message:</p>
                  <p className="font-mono text-red-800 bg-white p-2 rounded">{this.state.error.message}</p>
                </div>
                <div>
                  <p className="font-bold text-red-900 mb-1">Stack Trace:</p>
                  <pre className="text-xs text-red-700 bg-white p-2 rounded whitespace-pre-wrap break-words">{this.state.error.stack}</pre>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
              >
                Recargar página
              </button>
              <button
                onClick={() => console.log('Error completo:', this.state.error)}
                className="rounded-lg border-2 border-primary px-4 py-2 text-primary hover:bg-primary/10"
              >
                Ver en consola
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
