/**
 * ULE - ERROR BOUNDARY
 * Componente para capturar errores de React
 */

'use client'

import React from 'react'

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
    console.error('[Ule Error Boundary] Error capturado:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
            <h2 className="mb-4 text-2xl font-bold text-red-600">
              Ocurrió un error
            </h2>
            <p className="mb-4 text-gray-700">
              Lo sentimos, algo salió mal. Por favor recarga la página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-dark"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
