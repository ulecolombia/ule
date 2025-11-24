/**
 * CALCULADORA DE IVA
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  calcularIVA,
  calcularBaseDesdeTotal,
} from '@/lib/services/calculadoras-service'
import { formatearMoneda } from '@/lib/utils/format'
import { toast } from 'sonner'

export function CalculadoraIVA() {
  const [modo, setModo] = useState<'base' | 'total'>('base')
  const [valor, setValor] = useState('')
  const [porcentaje, setPorcentaje] = useState('19')
  const [resultado, setResultado] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState('')

  const handleCalcular = () => {
    const val = parseFloat(valor.replace(/[^0-9]/g, ''))
    const porc = parseFloat(porcentaje) / 100

    if (isNaN(val) || val <= 0) {
      setError('Ingresa un valor válido mayor a 0')
      toast.error('Ingresa un valor válido')
      return
    }

    setError('')
    setIsCalculating(true)

    setTimeout(() => {
      const calculo =
        modo === 'base'
          ? calcularIVA(val, porc)
          : calcularBaseDesdeTotal(val, porc)

      setResultado(calculo)
      setIsCalculating(false)
    }, 300)
  }

  const handleReset = () => {
    setValor('')
    setPorcentaje('19')
    setResultado(null)
    setError('')
  }

  const handleGuardar = async () => {
    try {
      await fetch('/api/calculadoras/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoCalculadora: 'IVA',
          inputs: { valor, porcentaje, modo },
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
            calculate
          </span>
          Calculadora de IVA
        </h2>
        <p className="text-dark-100 mt-1 text-sm">
          Calcula el IVA desde el valor base o desde el total
        </p>
      </div>

      <div className="space-y-6">
        {/* Selector de modo */}
        <div className="flex gap-2">
          <Button
            variant={modo === 'base' ? 'default' : 'outline'}
            onClick={() => setModo('base')}
            className="flex-1"
          >
            Desde valor base
          </Button>
          <Button
            variant={modo === 'total' ? 'default' : 'outline'}
            onClick={() => setModo('total')}
            className="flex-1"
          >
            Desde valor total
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-dark mb-2 block text-sm font-medium">
              {modo === 'base' ? 'Valor Base *' : 'Valor Total *'}
            </label>
            <Input
              type="text"
              placeholder="Ej: 1000000"
              value={valor}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setValor(val ? parseInt(val).toLocaleString('es-CO') : '')
                if (error) setError('')
              }}
              className={error ? 'border-error' : ''}
            />
            {error && <p className="text-error mt-1 text-xs">{error}</p>}
          </div>

          <div>
            <label className="text-dark mb-2 block text-sm font-medium">
              % IVA
            </label>
            <Input
              type="number"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              min="0"
              max="100"
              step="1"
            />
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
                Calcular IVA
              </>
            )}
          </Button>
          {(valor || resultado) && !isCalculating && (
            <Button onClick={handleReset} size="lg" variant="outline">
              <span className="material-symbols-outlined">restart_alt</span>
            </Button>
          )}
        </div>

        {resultado && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 border-t pt-4 duration-500">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-dark-100 text-sm">Valor Base</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatearMoneda(resultado.valorBase)}
                </p>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-dark-100 text-sm">
                  IVA ({(resultado.porcentajeIVA * 100).toFixed(0)}%)
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {formatearMoneda(resultado.valorIVA)}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-dark-100 text-sm">Valor Total</p>
                <p className="text-xl font-bold text-green-600">
                  {formatearMoneda(resultado.valorTotal)}
                </p>
              </div>
            </div>

            <div className="bg-light-50 rounded-lg p-4">
              <p className="text-dark text-sm">
                <strong>Fórmula:</strong>{' '}
                {modo === 'base'
                  ? `Base + (Base × ${(resultado.porcentajeIVA * 100).toFixed(0)}%) = Total`
                  : `Total ÷ (1 + ${(resultado.porcentajeIVA * 100).toFixed(0)}%) = Base`}
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
