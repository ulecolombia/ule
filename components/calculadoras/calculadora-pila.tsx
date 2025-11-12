/**
 * CALCULADORA DE PROYECCIÓN PILA
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { proyectarAportesPILA } from '@/lib/services/calculadoras-service'
import { formatearMoneda } from '@/lib/utils/format'
import { toast } from 'sonner'

export function CalculadoraPILA() {
  const [ingresoMensual, setIngresoMensual] = useState('')
  const [nivelRiesgo, setNivelRiesgo] = useState<'I' | 'II' | 'III' | 'IV' | 'V'>('I')
  const [resultado, setResultado] = useState<any>(null)

  const handleCalcular = () => {
    const ingreso = parseFloat(ingresoMensual.replace(/[^0-9]/g, ''))

    if (isNaN(ingreso) || ingreso <= 0) {
      toast.error('Ingresa un valor válido')
      return
    }

    const proyeccion = proyectarAportesPILA(ingreso, nivelRiesgo)
    setResultado(proyeccion)
  }

  const handleGuardar = async () => {
    try {
      await fetch('/api/calculadoras/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoCalculadora: 'PROYECCION_PILA',
          inputs: { ingresoMensual, nivelRiesgo },
          resultados: resultado,
        }),
      })
      toast.success('Cálculo guardado')
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="flex items-center text-2xl font-bold text-dark">
          <span className="material-symbols-outlined mr-2 text-primary">savings</span>
          Proyección de Aportes PILA
        </h2>
        <p className="mt-1 text-sm text-dark-100">
          Calcula los aportes mensuales y anuales a seguridad social
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-dark">
              Ingreso Mensual *
            </label>
            <Input
              type="text"
              placeholder="Ej: 3000000"
              value={ingresoMensual}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setIngresoMensual(val ? parseInt(val).toLocaleString('es-CO') : '')
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark">
              Nivel de Riesgo ARL
            </label>
            <select
              value={nivelRiesgo}
              onChange={(e) => setNivelRiesgo(e.target.value as any)}
              className="w-full rounded-lg border border-light-200 px-4 py-2 focus:border-primary focus:outline-none"
            >
              <option value="I">Nivel I (0.522%)</option>
              <option value="II">Nivel II (1.044%)</option>
              <option value="III">Nivel III (2.436%)</option>
              <option value="IV">Nivel IV (4.35%)</option>
              <option value="V">Nivel V (6.96%)</option>
            </select>
          </div>
        </div>

        <Button onClick={handleCalcular} size="lg" className="w-full">
          <span className="material-symbols-outlined mr-2">calculate</span>
          Calcular Proyección
        </Button>

        {resultado && (
          <div className="space-y-4 border-t pt-4">
            {/* IBC */}
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-dark-100">Ingreso Base de Cotización (IBC)</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatearMoneda(resultado.ibc)}
              </p>
              <p className="text-xs text-dark-100 mt-1">
                {resultado.ibc < resultado.ingresoMensual && 'Ajustado al mínimo (1 SMMLV)'}
                {resultado.ibc > resultado.ingresoMensual && 'Ajustado al máximo (25 SMMLV)'}
              </p>
            </div>

            {/* Aportes Mensuales */}
            <div>
              <h3 className="mb-2 font-semibold text-dark">Aportes Mensuales</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs text-dark-100">Salud</p>
                  <p className="font-bold text-green-600">
                    {formatearMoneda(resultado.aportes.mensual.salud)}
                  </p>
                  <p className="text-xs text-dark-100">{(resultado.porcentajes.salud * 100).toFixed(1)}%</p>
                </div>

                <div className="rounded-lg bg-purple-50 p-3">
                  <p className="text-xs text-dark-100">Pensión</p>
                  <p className="font-bold text-purple-600">
                    {formatearMoneda(resultado.aportes.mensual.pension)}
                  </p>
                  <p className="text-xs text-dark-100">{(resultado.porcentajes.pension * 100).toFixed(1)}%</p>
                </div>

                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-xs text-dark-100">ARL</p>
                  <p className="font-bold text-orange-600">
                    {formatearMoneda(resultado.aportes.mensual.arl)}
                  </p>
                  <p className="text-xs text-dark-100">{(resultado.porcentajes.arl * 100).toFixed(3)}%</p>
                </div>

                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-xs text-dark-100">Total</p>
                  <p className="font-bold text-primary">
                    {formatearMoneda(resultado.aportes.mensual.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Aportes Anuales */}
            <div>
              <h3 className="mb-2 font-semibold text-dark">Proyección Anual</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs text-dark-100">Salud</p>
                  <p className="font-bold text-green-600">
                    {formatearMoneda(resultado.aportes.anual.salud)}
                  </p>
                </div>

                <div className="rounded-lg bg-purple-50 p-3">
                  <p className="text-xs text-dark-100">Pensión</p>
                  <p className="font-bold text-purple-600">
                    {formatearMoneda(resultado.aportes.anual.pension)}
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-xs text-dark-100">ARL</p>
                  <p className="font-bold text-orange-600">
                    {formatearMoneda(resultado.aportes.anual.arl)}
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-xs text-dark-100">Total Anual</p>
                  <p className="text-lg font-bold text-primary">
                    {formatearMoneda(resultado.aportes.anual.total)}
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={handleGuardar} className="w-full">
              <span className="material-symbols-outlined mr-2">bookmark</span>
              Guardar Proyección
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
