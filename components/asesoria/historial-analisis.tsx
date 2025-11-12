'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'

interface HistorialAnalisisProps {
  onClose: () => void
}

interface AnalisisHistorico {
  id: string
  regimenRecomendado: string
  confianza: string
  ingresoAnalizado: number
  createdAt: string
}

export function HistorialAnalisis({ onClose }: HistorialAnalisisProps) {
  const [historial, setHistorial] = useState<AnalisisHistorico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await fetch('/api/asesoria/analisis-tributario?accion=historial')

        if (!response.ok) {
          throw new Error('Error al cargar historial')
        }

        const data = await response.json()
        setHistorial(data.historial)
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    cargarHistorial()
  }, [])

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <span className="material-symbols-outlined text-primary mr-2">
            history
          </span>
          Historial de Análisis
        </h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Cargando historial...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          <p className="mt-2 text-red-600">{error}</p>
        </div>
      )}

      {!isLoading && !error && historial.length === 0 && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-gray-400">
            history_toggle_off
          </span>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            No hay análisis anteriores
          </p>
        </div>
      )}

      {!isLoading && !error && historial.length > 0 && (
        <div className="space-y-3">
          {historial.map((analisis) => (
            <div
              key={analisis.id}
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge
                      variant={
                        analisis.regimenRecomendado === 'SIMPLE'
                          ? 'success'
                          : analisis.regimenRecomendado === 'ORDINARIO'
                          ? 'info'
                          : 'secondary'
                      }
                    >
                      {analisis.regimenRecomendado}
                    </Badge>
                    <Badge
                      variant={
                        analisis.confianza === 'ALTA'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {analisis.confianza}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Ingreso analizado:</span>{' '}
                    {formatCurrency(Number(analisis.ingresoAnalizado))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(analisis.createdAt).toLocaleDateString('es-CO', {
                      dateStyle: 'long',
                      timeStyle: 'short'
                    } as any)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
