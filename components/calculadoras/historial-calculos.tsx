/**
 * HISTORIAL DE CÁLCULOS
 */

'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatearFecha } from '@/lib/utils/format'

interface HistorialCalculosProps {
  tipo?: string
}

export function HistorialCalculos({ tipo }: HistorialCalculosProps) {
  const [calculos, setCalculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarHistorial()
  }, [tipo])

  const cargarHistorial = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (tipo) params.append('tipo', tipo)
      params.append('limite', '10')

      const response = await fetch(`/api/calculadoras/historial?${params}`)
      const data = await response.json()
      setCalculos(data.calculos || [])
    } catch (error) {
      console.error('Error al cargar historial:', error)
    } finally {
      setLoading(false)
    }
  }

  const getNombreTipo = (tipo: string) => {
    const nombres: Record<string, string> = {
      RETENCION_FUENTE: 'Retención',
      IVA: 'IVA',
      PROYECCION_PILA: 'PILA',
      SIMULADOR_REGIMEN: 'Régimen',
      CONVERSOR_UVT: 'UVT',
    }
    return nombres[tipo] || tipo
  }

  const getColorTipo = (tipo: string) => {
    const colores: Record<string, string> = {
      RETENCION_FUENTE: 'bg-blue-100 text-blue-700',
      IVA: 'bg-purple-100 text-purple-700',
      PROYECCION_PILA: 'bg-green-100 text-green-700',
      SIMULADOR_REGIMEN: 'bg-orange-100 text-orange-700',
      CONVERSOR_UVT: 'bg-primary/10 text-primary',
    }
    return colores[tipo] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="mb-4 text-lg font-semibold text-dark">Historial</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark">Historial</h3>
        <Badge variant="outline">{calculos.length}</Badge>
      </div>

      {calculos.length === 0 ? (
        <div className="py-8 text-center">
          <span className="material-symbols-outlined mb-2 text-6xl text-dark-100">
            history
          </span>
          <p className="text-sm text-dark-100">No hay cálculos guardados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {calculos.map((calculo) => (
            <div
              key={calculo.id}
              className="cursor-pointer rounded-lg bg-light-50 p-3 transition-all hover:bg-light-100 hover:shadow-md"
            >
              <div className="mb-2 flex items-center justify-between">
                <Badge className={getColorTipo(calculo.tipoCalculadora)}>
                  {getNombreTipo(calculo.tipoCalculadora)}
                </Badge>
                <p className="text-xs text-dark-100">
                  {formatearFecha(new Date(calculo.createdAt))}
                </p>
              </div>

              {calculo.notas && (
                <p className="text-xs text-dark-100 line-clamp-2">
                  {calculo.notas}
                </p>
              )}

              {/* Preview de resultados según tipo */}
              <div className="mt-2 text-xs text-dark-100">
                {calculo.tipoCalculadora === 'RETENCION_FUENTE' && (
                  <p>
                    Ingreso: $
                    {(calculo.inputs.ingresoMensual as string).replace(/,/g, '')}
                  </p>
                )}
                {calculo.tipoCalculadora === 'IVA' && (
                  <p>
                    Valor: ${(calculo.inputs.valor as string).replace(/,/g, '')}{' '}
                    ({calculo.inputs.modo})
                  </p>
                )}
                {calculo.tipoCalculadora === 'PROYECCION_PILA' && (
                  <p>
                    Ingreso: $
                    {(calculo.inputs.ingresoMensual as string).replace(/,/g, '')}{' '}
                    (Nivel {calculo.inputs.nivelRiesgo})
                  </p>
                )}
                {calculo.tipoCalculadora === 'SIMULADOR_REGIMEN' && (
                  <p>
                    Ingreso anual: $
                    {(calculo.inputs.ingresoAnual as string).replace(/,/g, '')}
                  </p>
                )}
                {calculo.tipoCalculadora === 'CONVERSOR_UVT' && (
                  <p>
                    {calculo.inputs.valor} ({calculo.inputs.modo})
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
