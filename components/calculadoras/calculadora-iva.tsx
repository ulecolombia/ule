/**
 * CALCULADORA DE IVA
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { calcularIVA, calcularBaseDesdeTotal } from '@/lib/services/calculadoras-service'
import { formatearMoneda } from '@/lib/utils/format'
import { toast } from 'sonner'

export function CalculadoraIVA() {
  const [modo, setModo] = useState<'base' | 'total'>('base')
  const [valor, setValor] = useState('')
  const [porcentaje, setPorcentaje] = useState('19')
  const [resultado, setResultado] = useState<any>(null)

  const handleCalcular = () => {
    const val = parseFloat(valor.replace(/[^0-9]/g, ''))
    const porc = parseFloat(porcentaje) / 100

    if (isNaN(val) || val <= 0) {
      toast.error('Ingresa un valor válido')
      return
    }

    const calculo = modo === 'base'
      ? calcularIVA(val, porc)
      : calcularBaseDesdeTotal(val, porc)

    setResultado(calculo)
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
        <h2 className="flex items-center text-2xl font-bold text-dark">
          <span className="material-symbols-outlined mr-2 text-primary">calculate</span>
          Calculadora de IVA
        </h2>
        <p className="mt-1 text-sm text-dark-100">
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
            <label className="mb-2 block text-sm font-medium text-dark">
              {modo === 'base' ? 'Valor Base *' : 'Valor Total *'}
            </label>
            <Input
              type="text"
              placeholder="Ej: 1000000"
              value={valor}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                setValor(val ? parseInt(val).toLocaleString('es-CO') : '')
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-dark">
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

        <Button onClick={handleCalcular} size="lg" className="w-full">
          <span className="material-symbols-outlined mr-2">calculate</span>
          Calcular IVA
        </Button>

        {resultado && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-dark-100">Valor Base</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatearMoneda(resultado.valorBase)}
                </p>
              </div>

              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-sm text-dark-100">IVA ({(resultado.porcentajeIVA * 100).toFixed(0)}%)</p>
                <p className="text-xl font-bold text-purple-600">
                  {formatearMoneda(resultado.valorIVA)}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-dark-100">Valor Total</p>
                <p className="text-xl font-bold text-green-600">
                  {formatearMoneda(resultado.valorTotal)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-light-50 p-4">
              <p className="text-sm text-dark">
                <strong>Fórmula:</strong>{' '}
                {modo === 'base'
                  ? `Base + (Base × ${(resultado.porcentajeIVA * 100).toFixed(0)}%) = Total`
                  : `Total ÷ (1 + ${(resultado.porcentajeIVA * 100).toFixed(0)}%) = Base`}
              </p>
            </div>

            <Button variant="outline" onClick={handleGuardar} className="w-full">
              <span className="material-symbols-outlined mr-2">bookmark</span>
              Guardar Cálculo
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
