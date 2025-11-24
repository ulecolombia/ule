/**
 * CALCULADORA DE PROYECCIÓN PILA
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { proyectarAportesPILA } from '@/lib/services/calculadoras-service'
import { formatearMoneda } from '@/lib/utils/format'
import { toast } from 'sonner'

export function CalculadoraPILA() {
  const [ingresoMensual, setIngresoMensual] = useState('')
  const [nivelRiesgo, setNivelRiesgo] = useState<
    'I' | 'II' | 'III' | 'IV' | 'V'
  >('I')
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

    setTimeout(() => {
      const proyeccion = proyectarAportesPILA(ingreso, nivelRiesgo)
      setResultado(proyeccion)
      setIsCalculating(false)
    }, 300)
  }

  const handleReset = () => {
    setIngresoMensual('')
    setNivelRiesgo('I')
    setResultado(null)
    setError('')
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
        <h2 className="text-dark flex items-center text-2xl font-bold">
          <span className="material-symbols-outlined mr-2 text-primary">
            savings
          </span>
          Proyección de Aportes PILA
        </h2>
        <p className="text-dark-100 mt-1 text-sm">
          Calcula los aportes mensuales y anuales a seguridad social
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-dark mb-2 block text-sm font-medium">
              Ingreso Mensual *
            </label>
            <Input
              type="text"
              placeholder="Ej: 3000000"
              value={ingresoMensual}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setIngresoMensual(
                  val ? parseInt(val).toLocaleString('es-CO') : ''
                )
                if (error) setError('')
              }}
              className={error ? 'border-error' : ''}
            />
            {error && <p className="text-error mt-1 text-xs">{error}</p>}
          </div>

          <div>
            <Select
              label="Nivel de Riesgo ARL"
              value={nivelRiesgo}
              onChange={(e) => setNivelRiesgo(e.target.value as any)}
            >
              <option value="I">Nivel I (0.522%)</option>
              <option value="II">Nivel II (1.044%)</option>
              <option value="III">Nivel III (2.436%)</option>
              <option value="IV">Nivel IV (4.35%)</option>
              <option value="V">Nivel V (6.96%)</option>
            </Select>
          </div>
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
                Calcular Proyección
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
            {/* IBC */}
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-dark-100 text-sm">
                Ingreso Base de Cotización (IBC)
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {formatearMoneda(resultado.ibc)}
              </p>
              <p className="text-dark-100 mt-1 text-xs">
                {resultado.ibc < resultado.ingresoMensual &&
                  'Ajustado al mínimo (1 SMMLV)'}
                {resultado.ibc > resultado.ingresoMensual &&
                  'Ajustado al máximo (25 SMMLV)'}
              </p>
            </div>

            {/* Aportes Mensuales */}
            <div>
              <h3 className="text-dark mb-2 font-semibold">
                Aportes Mensuales
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-dark-100 text-xs">Salud</p>
                  <p className="font-bold text-green-600">
                    {formatearMoneda(resultado.aportes.mensual.salud)}
                  </p>
                  <p className="text-dark-100 text-xs">
                    {(resultado.porcentajes.salud * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-lg bg-purple-50 p-3">
                  <p className="text-dark-100 text-xs">Pensión</p>
                  <p className="font-bold text-purple-600">
                    {formatearMoneda(resultado.aportes.mensual.pension)}
                  </p>
                  <p className="text-dark-100 text-xs">
                    {(resultado.porcentajes.pension * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-dark-100 text-xs">ARL</p>
                  <p className="font-bold text-orange-600">
                    {formatearMoneda(resultado.aportes.mensual.arl)}
                  </p>
                  <p className="text-dark-100 text-xs">
                    {(resultado.porcentajes.arl * 100).toFixed(3)}%
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-dark-100 text-xs">Total</p>
                  <p className="font-bold text-primary">
                    {formatearMoneda(resultado.aportes.mensual.total)}
                  </p>
                </div>
              </div>
            </div>

            {/* Aportes Anuales */}
            <div>
              <h3 className="text-dark mb-2 font-semibold">Proyección Anual</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-dark-100 text-xs">Salud</p>
                  <p className="font-bold text-green-600">
                    {formatearMoneda(resultado.aportes.anual.salud)}
                  </p>
                </div>

                <div className="rounded-lg bg-purple-50 p-3">
                  <p className="text-dark-100 text-xs">Pensión</p>
                  <p className="font-bold text-purple-600">
                    {formatearMoneda(resultado.aportes.anual.pension)}
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 p-3">
                  <p className="text-dark-100 text-xs">ARL</p>
                  <p className="font-bold text-orange-600">
                    {formatearMoneda(resultado.aportes.anual.arl)}
                  </p>
                </div>

                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-dark-100 text-xs">Total Anual</p>
                  <p className="text-lg font-bold text-primary">
                    {formatearMoneda(resultado.aportes.anual.total)}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGuardar}
              className="w-full"
            >
              <span className="material-symbols-outlined mr-2">bookmark</span>
              Guardar Proyección
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
