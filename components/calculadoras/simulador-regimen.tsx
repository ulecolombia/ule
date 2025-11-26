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
import { TooltipProvider } from '@/components/ui/tooltip'
import { FinancialTermTooltip } from '@/components/ui/financial-term-tooltip'
import { RegimenResultSkeleton } from '@/components/ui/skeleton'
import { exportarComparacionRegimenPDF } from '@/lib/utils/pdf-export'
import { useAnalytics } from '@/lib/hooks/use-analytics'

export function SimuladorRegimen() {
  // M1: Analytics tracking
  const { track } = useAnalytics()

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

      // M1: Track simulation completed
      track('simulacion_regimen_completada', 'CALCULADORAS', {
        ingreso,
        gastos,
        regimenRecomendado: simulacion.regimenMasConveniente,
        diferencia: Math.abs(simulacion.diferencia),
      })
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

      // M1: Track simulation saved
      track('simulacion_regimen_guardada', 'CALCULADORAS', {
        regimenRecomendado: resultado.regimenMasConveniente,
      })
    } catch (error) {
      toast.error('Error al guardar')
    }
  }

  // F1: Handler para exportar a PDF
  const handleExportarPDF = () => {
    if (!resultado) return

    try {
      exportarComparacionRegimenPDF(
        resultado,
        { ingresoAnual, gastosDeducibles },
        {
          title: 'Comparación de Regímenes Tributarios',
          subtitle: 'Simple vs Ordinario',
          filename: `comparacion-regimen-${new Date().toISOString().split('T')[0]}.pdf`,
        }
      )
      toast.success('PDF descargado correctamente')

      // M1: Track PDF export
      track('pdf_exportado', 'CALCULADORAS', {
        tipo: 'simulacion_regimen',
        regimenRecomendado: resultado.regimenMasConveniente,
      })
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }

  return (
    <TooltipProvider>
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
              <label
                htmlFor="ingreso-anual"
                className="text-dark mb-2 block text-sm font-medium"
              >
                Ingreso Anual *
              </label>
              <Input
                id="ingreso-anual"
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
                aria-label="Ingreso anual en pesos colombianos"
                aria-required="true"
                aria-invalid={!!error}
                aria-describedby={error ? 'error-ingreso-anual' : undefined}
                className={error ? 'border-error' : ''}
              />
              {error && (
                <p
                  id="error-ingreso-anual"
                  className="text-error mt-1 text-xs"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="gastos-deducibles"
                className="text-dark mb-2 flex items-center gap-1 text-sm font-medium"
              >
                Gastos Deducibles (Ordinario)
                <FinancialTermTooltip term="Gastos Deducibles" side="right" />
              </label>
              <Input
                id="gastos-deducibles"
                type="text"
                placeholder="Ej: 20000000"
                value={gastosDeducibles}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '')
                  setGastosDeducibles(
                    val ? parseInt(val).toLocaleString('es-CO') : ''
                  )
                }}
                aria-label="Gastos deducibles para régimen ordinario en pesos colombianos"
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

          {/* P1: Skeleton loader durante cálculo */}
          {isCalculating && !resultado && <RegimenResultSkeleton />}

          {resultado && !isCalculating && (
            <div
              className="animate-in fade-in slide-in-from-bottom-4 space-y-6 border-t pt-4 duration-500"
              role="region"
              aria-live="polite"
              aria-label="Resultados de la comparación de regímenes tributarios"
            >
              {/* Tabla comparativa */}
              <div className="relative">
                <div className="border-light-200 overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b-2">
                        <th className="p-3 text-left">Concepto</th>
                        <th className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            Régimen Simple
                            <FinancialTermTooltip
                              term="Régimen Simple"
                              side="top"
                            />
                          </div>
                        </th>
                        <th className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            Régimen Ordinario
                            <FinancialTermTooltip
                              term="Régimen Ordinario"
                              side="top"
                            />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            Base Gravable
                            <FinancialTermTooltip
                              term="Base Gravable"
                              side="right"
                            />
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {formatearMoneda(resultado.ingresoAnual)}
                        </td>
                        <td className="p-3 text-right">
                          {formatearMoneda(
                            resultado.regimenOrdinario.rentaLiquida
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Tarifa Efectiva</td>
                        <td className="p-3 text-right">
                          {(resultado.regimenSimple.tarifa * 100).toFixed(2)}%
                        </td>
                        <td className="p-3 text-right">
                          {(resultado.regimenOrdinario.tarifa * 100).toFixed(2)}
                          %
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
                          {formatearMoneda(
                            resultado.regimenOrdinario.ingresoNeto
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* R1: Indicador visual de scroll horizontal */}
                <div className="pointer-events-none absolute right-0 top-0 h-full w-8 rounded-r-lg bg-gradient-to-l from-white to-transparent opacity-80"></div>
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
                    Impuesto:{' '}
                    {formatearMoneda(resultado.regimenSimple.impuesto)}
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

              {/* F1 + UX4: Botones de acción optimizados para móvil */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  onClick={handleExportarPDF}
                  className="min-h-[48px] w-full touch-manipulation border-primary text-primary transition-transform hover:bg-primary hover:text-white active:scale-95"
                >
                  <span className="material-symbols-outlined mr-2">
                    picture_as_pdf
                  </span>
                  <span className="hidden sm:inline">Exportar a PDF</span>
                  <span className="inline sm:hidden">PDF</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="min-h-[48px] w-full touch-manipulation border-slate-500 text-slate-700 transition-transform hover:bg-slate-500 hover:text-white active:scale-95"
                >
                  <span className="material-symbols-outlined mr-2">print</span>
                  <span className="hidden sm:inline">Imprimir</span>
                  <span className="inline sm:hidden">Imprimir</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleGuardar}
                  className="min-h-[48px] w-full touch-manipulation transition-transform active:scale-95 sm:col-span-2 lg:col-span-1"
                >
                  <span className="material-symbols-outlined mr-2">
                    bookmark
                  </span>
                  <span className="hidden sm:inline">Guardar Simulación</span>
                  <span className="inline sm:hidden">Guardar</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  )
}
