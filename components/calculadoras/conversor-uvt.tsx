/**
 * CONVERSOR UVT ↔ COP
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { convertirUVTaCOP, convertirCOPaUVT, CONSTANTES_2025 } from '@/lib/services/calculadoras-service'
import { formatearMoneda } from '@/lib/utils/format'
import { toast } from 'sonner'

export function ConversorUVT() {
  const [modo, setModo] = useState<'uvt-cop' | 'cop-uvt'>('uvt-cop')
  const [valor, setValor] = useState('')
  const [resultado, setResultado] = useState<any>(null)

  const handleConvertir = () => {
    const val = parseFloat(valor.replace(/[^0-9.]/g, ''))

    if (isNaN(val) || val <= 0) {
      toast.error('Ingresa un valor válido')
      return
    }

    const conversion =
      modo === 'uvt-cop' ? convertirUVTaCOP(val) : convertirCOPaUVT(val)

    setResultado(conversion)
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
        <h2 className="flex items-center text-2xl font-bold text-dark">
          <span className="material-symbols-outlined mr-2 text-primary">
            currency_exchange
          </span>
          Conversor UVT ↔ COP
        </h2>
        <p className="mt-1 text-sm text-dark-100">
          Convierte entre UVT y pesos colombianos (Vigencia 2025)
        </p>
      </div>

      <div className="space-y-6">
        {/* Valor UVT 2025 */}
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="text-sm text-dark-100">Valor UVT 2025</p>
          <p className="text-3xl font-bold text-primary">
            {formatearMoneda(CONSTANTES_2025.UVT)}
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
          <label className="mb-2 block text-sm font-medium text-dark">
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
            }}
            className="text-lg"
          />
        </div>

        <Button onClick={handleConvertir} size="lg" className="w-full">
          <span className="material-symbols-outlined mr-2">sync_alt</span>
          Convertir
        </Button>

        {resultado && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-dark-100">UVT</p>
                <p className="text-2xl font-bold text-blue-600">
                  {resultado.uvt.toFixed(2)}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-dark-100">COP</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatearMoneda(resultado.cop)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-light-50 p-4">
              <p className="text-sm text-dark">
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
              <p className="text-sm text-dark">
                La Unidad de Valor Tributario (UVT) es una medida usada en Colombia
                para calcular impuestos, multas y sanciones. Se actualiza cada año
                según la inflación. Para 2025, una UVT equivale a{' '}
                <strong>{formatearMoneda(CONSTANTES_2025.UVT)}</strong>.
              </p>
            </div>

            <Button variant="outline" onClick={handleGuardar} className="w-full">
              <span className="material-symbols-outlined mr-2">bookmark</span>
              Guardar Conversión
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
