/**
 * CALCULADORA DE RETENCIÓN EN LA FUENTE
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { calcularRetencionFuente } from '@/lib/services/calculadoras-service'
import { formatearMoneda } from '@/lib/utils/format'
import { toast } from 'sonner'

export function CalculadoraRetencion() {
  const [ingresoMensual, setIngresoMensual] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState('')

  const handleCalcular = () => {
    const ingreso = parseFloat(ingresoMensual.replace(/[^0-9]/g, ''))

    if (isNaN(ingreso) || ingreso <= 0) {
      setError('Ingresa un ingreso mensual válido mayor a 0')
      toast.error('Ingresa un valor válido')
      return
    }

    setError('')
    setIsCalculating(true)

    // Simulate async calculation for better UX
    setTimeout(() => {
      const calculo = calcularRetencionFuente(ingreso)
      setResultado(calculo)
      setIsCalculating(false)
    }, 300)
  }

  const handleReset = () => {
    setIngresoMensual('')
    setResultado(null)
    setError('')
  }

  const handleGuardar = async () => {
    try {
      await fetch('/api/calculadoras/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoCalculadora: 'RETENCION_FUENTE',
          inputs: { ingresoMensual },
          resultados: resultado,
        }),
      })
      toast.success('Cálculo guardado en historial')
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-dark flex items-center text-2xl font-bold">
          <span className="material-symbols-outlined mr-2 text-primary">
            receipt_long
          </span>
          Calculadora de Retención en la Fuente
        </h2>
        <p className="text-dark-100 mt-1 text-sm">
          Calcula la retención según tabla UVT 2025 para personas naturales
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-dark mb-2 block text-sm font-medium">
            Ingreso Mensual *
          </label>
          <Input
            type="text"
            placeholder="Ej: 5000000"
            value={ingresoMensual}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '')
              setIngresoMensual(
                value ? parseInt(value).toLocaleString('es-CO') : ''
              )
              if (error) setError('')
            }}
            className={`text-lg ${error ? 'border-error' : ''}`}
          />
          {error ? (
            <p className="text-error mt-1 text-xs">{error}</p>
          ) : (
            <p className="text-dark-100 mt-1 text-xs">
              Ingresa tu ingreso mensual promedio antes de retención
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleCalcular}
            size="lg"
            className="flex-1"
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Calculando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2">
                  calculate
                </span>
                Calcular Retención
              </>
            )}
          </Button>
          {(ingresoMensual || resultado) && !isCalculating && (
            <Button onClick={handleReset} size="lg" variant="outline">
              <span className="material-symbols-outlined">restart_alt</span>
            </Button>
          )}
        </div>

        {resultado && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 border-t pt-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-dark-100 text-sm">Ingreso Anual</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatearMoneda(resultado.ingresoAnual)}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-dark-100 text-sm">En UVT</p>
                <p className="text-2xl font-bold text-blue-600">
                  {resultado.uvtAnual.toFixed(2)} UVT
                </p>
              </div>

              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-dark-100 text-sm">Retención Anual</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatearMoneda(resultado.retencion)}
                </p>
                <p className="text-dark-100 mt-1 text-xs">
                  Tarifa: {(resultado.tarifa * 100).toFixed(1)}%
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-dark-100 text-sm">Ingreso Neto Anual</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatearMoneda(resultado.ingresoNeto)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <h4 className="mb-2 flex items-center text-sm font-semibold">
                <span className="material-symbols-outlined mr-2 text-sm text-yellow-600">
                  info
                </span>
                ¿Qué significa esto?
              </h4>
              <p className="text-dark text-sm">
                Si ganas{' '}
                <strong>{formatearMoneda(resultado.ingresoMensual)}</strong> al
                mes, tu ingreso anual es{' '}
                <strong>{formatearMoneda(resultado.ingresoAnual)}</strong>.
                Según la tabla de retención 2025, te retendrán aproximadamente{' '}
                <strong>{formatearMoneda(resultado.retencion)}</strong> al año (
                {formatearMoneda(resultado.retencion / 12)} al mes), con una
                tarifa del{' '}
                <strong>{(resultado.tarifa * 100).toFixed(1)}%</strong>.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleGuardar}
              className="w-full"
            >
              <span className="material-symbols-outlined mr-2">bookmark</span>
              Guardar Cálculo
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
