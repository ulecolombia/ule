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

  const handleSimular = () => {
    const ingreso = parseFloat(ingresoAnual.replace(/[^0-9]/g, ''))
    const gastos = parseFloat(gastosDeducibles.replace(/[^0-9]/g, '') || '0')

    if (isNaN(ingreso) || ingreso <= 0) {
      toast.error('Ingresa un ingreso válido')
      return
    }

    const simulacion = simularRegimenes(ingreso, gastos)
    setResultado(simulacion)
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
        <h2 className="flex items-center text-2xl font-bold text-dark">
          <span className="material-symbols-outlined mr-2 text-primary">compare</span>
          Simulador Régimen Simple vs Ordinario
        </h2>
        <p className="mt-1 text-sm text-dark-100">
          Compara cuál régimen tributario te conviene más
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-dark">
              Ingreso Anual *
            </label>
            <Input
              type="text"
              placeholder="Ej: 80000000"
              value={ingresoAnual}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setIngresoAnual(val ? parseInt(val).toLocaleString('es-CO') : '')
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark">
              Gastos Deducibles (Ordinario)
            </label>
            <Input
              type="text"
              placeholder="Ej: 20000000"
              value={gastosDeducibles}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setGastosDeducibles(val ? parseInt(val).toLocaleString('es-CO') : '')
              }}
            />
          </div>
        </div>

        <Button onClick={handleSimular} size="lg" className="w-full">
          <span className="material-symbols-outlined mr-2">analytics</span>
          Simular Comparación
        </Button>

        {resultado && (
          <div className="space-y-6 border-t pt-4">
            {/* Tabla comparativa */}
            <div className="overflow-x-auto">
              <table className="w-full">
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
                {resultado.regimenMasConveniente === 'SIMPLE' ? 'Simple' : 'Ordinario'}
              </h4>
              <p className="text-sm">{resultado.recomendacion}</p>
              {Math.abs(resultado.diferencia) > 0 && (
                <p className="mt-2 text-sm font-semibold">
                  Ahorro: {formatearMoneda(Math.abs(resultado.diferencia))} al año
                </p>
              )}
            </div>

            {/* Gráfico visual */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-center text-sm font-medium">Régimen Simple</p>
                <div className="relative h-40 rounded-lg bg-purple-100 p-4">
                  <div
                    className="rounded bg-purple-500"
                    style={{
                      height: `${
                        (resultado.regimenSimple.impuesto / resultado.ingresoAnual) * 100
                      }%`,
                    }}
                  />
                  <p className="mt-2 text-center text-xs">
                    Impuesto: {((resultado.regimenSimple.impuesto / resultado.ingresoAnual) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-center text-sm font-medium">Régimen Ordinario</p>
                <div className="relative h-40 rounded-lg bg-blue-100 p-4">
                  <div
                    className="rounded bg-blue-500"
                    style={{
                      height: `${
                        (resultado.regimenOrdinario.impuesto / resultado.ingresoAnual) * 100
                      }%`,
                    }}
                  />
                  <p className="mt-2 text-center text-xs">
                    Impuesto: {((resultado.regimenOrdinario.impuesto / resultado.ingresoAnual) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={handleGuardar} className="w-full">
              <span className="material-symbols-outlined mr-2">bookmark</span>
              Guardar Simulación
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
