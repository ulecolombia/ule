/**
 * ULE - COMPONENTE HISTORIAL DE ENVÍOS
 * Muestra el historial completo de envíos de emails de una factura
 * MEJORADO: Con cleanup de useEffect y formatters centralizados
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { formatDate, formatTime } from '@/lib/utils/format'

interface EnvioFactura {
  id: string
  destinatario: string
  cc: string | null
  asunto: string
  mensaje: string | null
  adjuntoPdf: boolean
  adjuntoXml: boolean
  exitoso: boolean
  error: string | null
  fechaEnvio: Date | string
}

interface HistorialEnviosProps {
  facturaId: string
}

export function HistorialEnvios({ facturaId }: HistorialEnviosProps) {
  const [envios, setEnvios] = useState<EnvioFactura[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // FIX: Agregar cleanup para prevenir memory leaks
  useEffect(() => {
    let isMounted = true

    const fetchHistorial = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/facturacion/enviar-email?facturaId=${facturaId}`
        )

        if (!response.ok) {
          throw new Error('Error al cargar historial')
        }

        const data = await response.json()

        // Solo actualizar estado si el componente sigue montado
        if (isMounted) {
          setEnvios(data.envios || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    if (facturaId) {
      fetchHistorial()
    }

    // Cleanup
    return () => {
      isMounted = false
    }
  }, [facturaId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Historial de Envíos
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">
              progress_activity
            </span>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Historial de Envíos
          </h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-red-300 mb-2">
              error
            </span>
            <p className="text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (envios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Historial de Envíos
          </h3>
        </CardHeader>
        <CardBody>
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2 text-slate-300">
              mail_outline
            </span>
            <p>No se ha enviado esta factura por email todavía</p>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Historial de Envíos
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {envios.length} {envios.length === 1 ? 'envío' : 'envíos'}{' '}
            realizados
          </p>
        </div>
        <span className="material-symbols-outlined text-slate-400">email</span>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          {envios.map((envio) => (
            <div
              key={envio.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">
                    email
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {envio.destinatario}
                  </span>
                  {envio.exitoso ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded text-xs font-medium text-teal-700 dark:text-teal-300">
                      <span className="material-symbols-outlined text-xs">
                        check_circle
                      </span>
                      Enviado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs font-medium text-red-700 dark:text-red-300">
                      <span className="material-symbols-outlined text-xs">
                        error
                      </span>
                      Error
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(envio.fechaEnvio)} • {formatTime(envio.fechaEnvio)}
                </span>
              </div>

              {/* CC */}
              {envio.cc && (
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  <span className="font-medium">CC:</span> {envio.cc}
                </div>
              )}

              {/* Asunto */}
              <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                <span className="font-medium">Asunto:</span> {envio.asunto}
                </div>

              {/* Adjuntos */}
              {(envio.adjuntoPdf || envio.adjuntoXml) && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Adjuntos:
                  </span>
                  {envio.adjuntoPdf && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                      <span className="material-symbols-outlined text-xs">
                        picture_as_pdf
                      </span>
                      PDF
                    </span>
                  )}
                  {envio.adjuntoXml && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <span className="material-symbols-outlined text-xs">
                        code
                      </span>
                      XML
                    </span>
                  )}
                </div>
              )}

              {/* Error message */}
              {!envio.exitoso && envio.error && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                  <span className="font-medium">Error:</span> {envio.error}
                </div>
              )}

              {/* Mensaje preview (colapsable) */}
              {envio.mensaje && (
                <details className="mt-2">
                  <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                    Ver mensaje completo
                  </summary>
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                    {envio.mensaje}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
