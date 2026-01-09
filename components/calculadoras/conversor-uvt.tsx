/**
 * CONVERSOR UVT ↔ COP
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  convertirUVTaCOP,
  convertirCOPaUVT,
  CONSTANTES_2026,
} from '@/lib/services/calculadoras-service'
import { formatearMoneda } from '@/lib/utils/format'
import { toast } from 'sonner'

export function ConversorUVT() {
  const [modo, setModo] = useState<'uvt-cop' | 'cop-uvt'>('uvt-cop')
  const [valor, setValor] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState('')

  const handleConvertir = () => {
    const val = parseFloat(valor.replace(/[^0-9.]/g, ''))

    if (isNaN(val) || val <= 0) {
      setError('Ingresa un valor válido mayor a 0')
      toast.error('Ingresa un valor válido')
      return
    }

    setError('')
    setIsCalculating(true)

    setTimeout(() => {
      const conversion =
        modo === 'uvt-cop' ? convertirUVTaCOP(val) : convertirCOPaUVT(val)

      setResultado(conversion)
      setIsCalculating(false)
    }, 300)
  }

  const handleReset = () => {
    setValor('')
    setResultado(null)
    setError('')
  }

  const handleGuardar = async () => {
    try {
      await fetch('/api/calculadoras/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoCalculadora: 'CONVERSOR_UVT',
          inputs: { valor, modo },
          resultados: resultado,
        }),
      })
      toast.success('Conversión guardada')
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-dark flex items-center text-2xl font-bold">
          <span className="material-symbols-outlined mr-2 text-primary">
            currency_exchange
          </span>
          Conversor UVT ↔ COP
        </h2>
        <p className="text-dark-100 mt-1 text-sm">
          Convierte entre UVT y pesos colombianos (Vigencia 2026)
        </p>
      </div>

      <div className="space-y-6">
        {/* Valor UVT 2026 */}
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="text-dark-100 text-sm">Valor UVT 2026</p>
          <p className="text-3xl font-bold text-primary">
            {formatearMoneda(CONSTANTES_2026.UVT)}
          </p>
        </div>

        {/* Selector de modo */}
        <div className="flex gap-2">
          <Button
            variant={modo === 'uvt-cop' ? 'default' : 'outline'}
            onClick={() => {
              setModo('uvt-cop')
              setResultado(null)
            }}
            className="flex-1"
          >
            UVT → COP
          </Button>
          <Button
            variant={modo === 'cop-uvt' ? 'default' : 'outline'}
            onClick={() => {
              setModo('cop-uvt')
              setResultado(null)
            }}
            className="flex-1"
          >
            COP → UVT
          </Button>
        </div>

        <div>
          <label className="text-dark mb-2 block text-sm font-medium">
            {modo === 'uvt-cop' ? 'Cantidad en UVT *' : 'Cantidad en COP *'}
          </label>
          <Input
            type="text"
            placeholder={modo === 'uvt-cop' ? 'Ej: 100' : 'Ej: 5000000'}
            value={valor}
            onChange={(e) => {
              if (modo === 'uvt-cop') {
                // Permitir decimales para UVT
                setValor(e.target.value)
              } else {
                // Solo números para COP
                const val = e.target.value.replace(/[^0-9]/g, '')
                setValor(val ? parseInt(val).toLocaleString('es-CO') : '')
              }
              if (error) setError('')
            }}
            className={`text-lg ${error ? 'border-error' : ''}`}
          />
          {error && <p className="text-error mt-1 text-xs">{error}</p>}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleConvertir}
            size="lg"
            className="flex-1"
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Convirtiendo...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2">sync_alt</span>
                Convertir
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-dark-100 text-sm">UVT</p>
                <p className="text-2xl font-bold text-blue-600">
                  {resultado.uvt.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-dark-100 text-sm">COP</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatearMoneda(resultado.cop)}
                </p>
              </div>
            </div>

            <div className="bg-light-50 rounded-lg p-4">
              <p className="text-dark text-sm">
                <strong>Fórmula:</strong>{' '}
                {modo === 'uvt-cop'
                  ? `${resultado.uvt.toFixed(2)} UVT × ${formatearMoneda(resultado.uvtValor)} = ${formatearMoneda(resultado.cop)}`
                  : `${formatearMoneda(resultado.cop)} ÷ ${formatearMoneda(resultado.uvtValor)} = ${resultado.uvt.toFixed(2)} UVT`}
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="mb-2 flex items-center text-sm font-semibold">
                <span className="material-symbols-outlined mr-2 text-sm text-blue-600">
                  info
                </span>
                ¿Qué es la UVT?
              </h4>
              <p className="text-dark text-sm">
                La Unidad de Valor Tributario (UVT) es una medida usada en
                Colombia para calcular impuestos, multas y sanciones. Se
                actualiza cada año según la inflación. Para 2026, una UVT
                equivale a{' '}
                <strong>{formatearMoneda(CONSTANTES_2026.UVT)}</strong>.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleGuardar}
              className="w-full"
            >
              <span className="material-symbols-outlined mr-2">bookmark</span>
              Guardar Conversión
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
