/**
 * ERROR FALLBACK COMPONENT
 * Componente reutilizable para mostrar estados de error
 * Úsalo con SWR, react-query, o cualquier caso donde necesites UI de error
 */

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorFallbackProps {
  error: Error | string
  resetErrorBoundary?: () => void
  refetch?: () => void
  title?: string
  description?: string
  showDetails?: boolean
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  refetch,
  title = 'Error al cargar datos',
  description,
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorFallbackProps) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? undefined : error.stack

  return (
    <Card className="p-6 bg-red-50 border-red-200">
      <div className="flex items-start space-x-3">
        <span className="material-symbols-outlined text-red-500 text-3xl flex-shrink-0">
          error
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-red-900 mb-2">{title}</h3>

          {description && (
            <p className="text-sm text-red-700 mb-4">{description}</p>
          )}

          {showDetails && errorMessage && (
            <div className="mb-4">
              <p className="text-sm font-medium text-red-800 mb-1">
                Mensaje de error:
              </p>
              <p className="text-sm text-red-700 bg-white p-2 rounded font-mono">
                {errorMessage}
              </p>
            </div>
          )}

          {showDetails && errorStack && (
            <details className="mb-4">
              <summary className="text-sm font-medium text-red-800 cursor-pointer hover:text-red-900">
                Stack trace (click para expandir)
              </summary>
              <pre className="mt-2 text-xs text-red-700 bg-white p-2 rounded overflow-auto max-h-40">
                {errorStack}
              </pre>
            </details>
          )}

          <div className="flex space-x-2 flex-wrap gap-2">
            {refetch && (
              <Button
                onClick={refetch}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <span className="material-symbols-outlined text-sm mr-1">
                  refresh
                </span>
                Reintentar
              </Button>
            )}

            {resetErrorBoundary && (
              <Button
                onClick={resetErrorBoundary}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                Resetear
              </Button>
            )}

            {!refetch && !resetErrorBoundary && (
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <span className="material-symbols-outlined text-sm mr-1">
                  refresh
                </span>
                Recargar página
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

/**
 * Error Fallback compacto para usar en listas o cards pequeñas
 */
export function ErrorFallbackCompact({
  error,
  refetch,
}: {
  error: Error | string
  refetch?: () => void
}) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <span className="material-symbols-outlined text-red-500 text-lg">
          error
        </span>
        <p className="text-sm text-red-700">{errorMessage}</p>
      </div>

      {refetch && (
        <Button
          onClick={refetch}
          size="sm"
          variant="ghost"
          className="text-red-600 hover:bg-red-100"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
        </Button>
      )}
    </div>
  )
}
