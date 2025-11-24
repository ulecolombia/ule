/**
 * SIMULADOR RÉGIMEN SIMPLE VS ORDINARIO
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { simularRegimenes } from '@/lib/services/calculadoras-service'
import { formatearMoneda } from '@/lib/utils/format'
import { toast } from 'sonner'

export function SimuladorRegimen() {
  const [ingresoAnual, setIngresoAnual] = useState('')
  const [gastosDeducibles, setGastosDeducibles] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState('')

  const handleSimular = () => {
    const ingreso = parseFloat(ingresoAnual.replace(/[^0-9]/g, ''))
    const gastos = parseFloat(gastosDeducibles.replace(/[^0-9]/g, '') || '0')

    if (isNaN(ingreso) || ingreso <= 0) {
      setError('Ingresa un ingreso anual válido mayor a 0')
      toast.error('Ingresa un ingreso válido')
      return
    }

    setError('')
    setIsCalculating(true)

    setTimeout(() => {
      const simulacion = simularRegimenes(ingreso, gastos)
      setResultado(simulacion)
      setIsCalculating(false)
    }, 300)
  }

  const handleReset = () => {
    setIngresoAnual('')
    setGastosDeducibles('')
    setResultado(null)
    setError('')
  }

  const handleGuardar = async () => {
    try {
      await fetch('/api/calculadoras/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoCalculadora: 'SIMULADOR_REGIMEN',
          inputs: { ingresoAnual, gastosDeducibles },
          resultados: resultado,
        }),
      })
      toast.success('Simulación guardada')
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-dark flex items-center text-2xl font-bold">
          <span className="material-symbols-outlined mr-2 text-primary">
            compare
          </span>
          Simulador Régimen Simple vs Ordinario
        </h2>
        <p className="text-dark-100 mt-1 text-sm">
          Compara cuál régimen tributario te conviene más
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-dark mb-2 block text-sm font-medium">
              Ingreso Anual *
            </label>
            <Input
              type="text"
              placeholder="Ej: 80000000"
              value={ingresoAnual}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setIngresoAnual(
                  val ? parseInt(val).toLocaleString('es-CO') : ''
                )
                if (error) setError('')
              }}
              className={error ? 'border-error' : ''}
            />
            {error && <p className="text-error mt-1 text-xs">{error}</p>}
          </div>

          <div>
            <label className="text-dark mb-2 block text-sm font-medium">
              Gastos Deducibles (Ordinario)
            </label>
            <Input
              type="text"
              placeholder="Ej: 20000000"
              value={gastosDeducibles}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setGastosDeducibles(
                  val ? parseInt(val).toLocaleString('es-CO') : ''
                )
              }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSimular}
            size="lg"
            className="flex-1"
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Simulando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2">
                  analytics
                </span>
                Simular Comparación
              </>
            )}
          </Button>
          {(ingresoAnual || resultado) && !isCalculating && (
            <Button onClick={handleReset} size="lg" variant="outline">
              <span className="material-symbols-outlined">restart_alt</span>
            </Button>
          )}
        </div>

        {resultado && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 border-t pt-4 duration-500">
            {/* Tabla comparativa */}
            <div className="border-light-200 overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b-2">
                    <th className="p-3 text-left">Concepto</th>
                    <th className="p-3 text-right">Régimen Simple</th>
                    <th className="p-3 text-right">Régimen Ordinario</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">Base Gravable</td>
                    <td className="p-3 text-right">
                      {formatearMoneda(resultado.ingresoAnual)}
                    </td>
                    <td className="p-3 text-right">
                      {formatearMoneda(resultado.regimenOrdinario.rentaLiquida)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">Tarifa Efectiva</td>
                    <td className="p-3 text-right">
                      {(resultado.regimenSimple.tarifa * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 text-right">
                      {(resultado.regimenOrdinario.tarifa * 100).toFixed(2)}%
                    </td>
                  </tr>
                  <tr className="border-b bg-red-50">
                    <td className="p-3 font-semibold">Impuesto a Pagar</td>
                    <td className="p-3 text-right font-bold text-red-600">
                      {formatearMoneda(resultado.regimenSimple.impuesto)}
                    </td>
                    <td className="p-3 text-right font-bold text-red-600">
                      {formatearMoneda(resultado.regimenOrdinario.impuesto)}
                    </td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="p-3 font-semibold">Ingreso Neto</td>
                    <td className="p-3 text-right font-bold text-green-600">
                      {formatearMoneda(resultado.regimenSimple.ingresoNeto)}
                    </td>
                    <td className="p-3 text-right font-bold text-green-600">
                      {formatearMoneda(resultado.regimenOrdinario.ingresoNeto)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Recomendación */}
            <div
              className={`rounded-lg border p-4 ${
                resultado.regimenMasConveniente === 'SIMPLE'
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <h4 className="mb-2 font-semibold">
                ✅ Régimen más conveniente:{' '}
                {resultado.regimenMasConveniente === 'SIMPLE'
                  ? 'Simple'
                  : 'Ordinario'}
              </h4>
              <p className="text-sm">{resultado.recomendacion}</p>
              {Math.abs(resultado.diferencia) > 0 && (
                <p className="mt-2 text-sm font-semibold">
                  Ahorro: {formatearMoneda(Math.abs(resultado.diferencia))} al
                  año
                </p>
              )}
            </div>

            {/* Gráfico visual mejorado */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
                <p className="mb-3 text-center text-sm font-semibold text-purple-900">
                  Régimen Simple
                </p>
                <div className="relative flex h-48 flex-col justify-end">
                  <div
                    className="rounded-t-lg bg-gradient-to-t from-purple-600 to-purple-500 shadow-lg transition-all duration-700"
                    style={{
                      height: `${Math.max(
                        (resultado.regimenSimple.impuesto /
                          resultado.ingresoAnual) *
                          100 *
                          3,
                        10
                      )}%`,
                    }}
                  >
                    <div className="flex h-full items-end justify-center pb-2">
                      <span className="text-xs font-bold text-white">
                        {(
                          (resultado.regimenSimple.impuesto /
                            resultado.ingresoAnual) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs font-medium text-purple-800">
                  Impuesto: {formatearMoneda(resultado.regimenSimple.impuesto)}
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <p className="mb-3 text-center text-sm font-semibold text-blue-900">
                  Régimen Ordinario
                </p>
                <div className="relative flex h-48 flex-col justify-end">
                  <div
                    className="rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-500 shadow-lg transition-all duration-700"
                    style={{
                      height: `${Math.max(
                        (resultado.regimenOrdinario.impuesto /
                          resultado.ingresoAnual) *
                          100 *
                          3,
                        10
                      )}%`,
                    }}
                  >
                    <div className="flex h-full items-end justify-center pb-2">
                      <span className="text-xs font-bold text-white">
                        {(
                          (resultado.regimenOrdinario.impuesto /
                            resultado.ingresoAnual) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs font-medium text-blue-800">
                  Impuesto:{' '}
                  {formatearMoneda(resultado.regimenOrdinario.impuesto)}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGuardar}
              className="w-full"
            >
              <span className="material-symbols-outlined mr-2">bookmark</span>
              Guardar Simulación
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
