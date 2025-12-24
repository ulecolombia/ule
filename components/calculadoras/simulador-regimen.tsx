/**
 * SIMULADOR RÉGIMEN TRIBUTARIO - VERSIÓN PROFESIONAL
 * Comparación RST vs Ordinario con cuadros explicativos
 * Colombia 2025 - UVT $49,799
 */

'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { NativeSelect } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { simularRegimenesCompleto } from '@/lib/services/calculadoras-service'
import { formatearMoneda } from '@/lib/utils/format'
import { toast } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { FinancialTermTooltip } from '@/components/ui/financial-term-tooltip'
import { useAnalytics } from '@/lib/hooks/use-analytics'
import type {
  DatosEntradaSimulador,
  ActividadEconomicaRST,
  ComparacionRegimenes,
} from '@/lib/types/simulador-tributario'

// Constantes
const UVT_2025 = 49799

// Solo actividades relevantes para ULE (profesionales independientes)
const ACTIVIDADES_ECONOMICAS: {
  value: ActividadEconomicaRST
  label: string
}[] = [
  {
    value: 'PROFESIONAL_LIBERAL',
    label: 'Profesional Liberal (Abogados, médicos, contadores, consultores)',
  },
  {
    value: 'SERVICIOS_TECNICOS',
    label: 'Servicios Técnicos (Ingeniería, arquitectura, técnicos)',
  },
]

// Pasos del formulario
const PASOS = [
  { id: 1, titulo: 'Ingresos', icono: 'payments' },
  { id: 2, titulo: 'Deducciones', icono: 'receipt_long' },
]

// Estado inicial
const DATOS_INICIALES: DatosEntradaSimulador = {
  ingresosBrutosAnuales: 0,
  actividadEconomica: 'PROFESIONAL_LIBERAL',
  costosGastos: 0,
  dependientes: 0,
  comprasFacturaElectronica: 0,
  aportesVoluntariosPension: 0,
  aportesAFC: 0,
  interesesViviendaAnuales: 0,
  medicinaPrepagadaAnual: 0,
  aplicarRentaExenta25: true,
  pagosRecibidosElectronicos: 0,
  gmfPagadoAnual: 0,
}

export function SimuladorRegimen() {
  const { track } = useAnalytics()

  const [paso, setPaso] = useState(1)
  const [datos, setDatos] = useState<DatosEntradaSimulador>(DATOS_INICIALES)
  const [resultado, setResultado] = useState<ComparacionRegimenes | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [, setDisclaimerAccepted] = useState(false)

  const formatNumber = (value: number): string => {
    if (value === 0) return ''
    return value.toLocaleString('es-CO')
  }

  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/[^0-9]/g, '')
    return cleaned ? parseInt(cleaned, 10) : 0
  }

  const handleNumberChange = useCallback(
    (field: keyof DatosEntradaSimulador) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseNumber(e.target.value)
        setDatos((prev) => ({ ...prev, [field]: value }))
        if (errores[field]) {
          setErrores((prev) => {
            const newErrors = { ...prev }
            delete newErrors[field]
            return newErrors
          })
        }
      },
    [errores]
  )

  const validarPaso = (): boolean => {
    const nuevosErrores: Record<string, string> = {}
    if (paso === 1 && datos.ingresosBrutosAnuales <= 0) {
      nuevosErrores.ingresosBrutosAnuales = 'Ingresa un ingreso anual válido'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const siguientePaso = () => {
    if (validarPaso() && paso < 2) {
      setPaso(paso + 1)
    }
  }

  // Mostrar disclaimer antes de simular
  const handlePreSimular = () => {
    if (!validarPaso()) return
    setShowDisclaimer(true)
  }

  // Ejecutar simulación después de aceptar disclaimer
  const handleSimular = () => {
    setShowDisclaimer(false)
    setDisclaimerAccepted(true)
    setIsCalculating(true)

    setTimeout(() => {
      try {
        const simulacion = simularRegimenesCompleto(datos)
        setResultado(simulacion)
        track('simulacion_regimen_completa', 'CALCULADORAS', {
          ingreso: datos.ingresosBrutosAnuales,
          actividad: datos.actividadEconomica,
          regimenRecomendado: simulacion.regimenRecomendado,
        })
        toast.success('Simulación completada')
      } catch (error) {
        console.error('Error:', error)
        toast.error('Error al calcular')
      } finally {
        setIsCalculating(false)
      }
    }, 500)
  }

  const handleReset = () => {
    setPaso(1)
    setDatos(DATOS_INICIALES)
    setResultado(null)
    setErrores({})
    setDisclaimerAccepted(false)
  }

  // Modal de Disclaimer
  const renderDisclaimer = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="animate-in fade-in zoom-in-95 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2">
            <span className="material-symbols-outlined text-2xl text-amber-600">
              gavel
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Aviso Legal Importante
          </h3>
        </div>

        <div className="mb-6 space-y-4 text-sm text-gray-600">
          <p>Antes de continuar, es importante que comprenda lo siguiente:</p>

          <div className="rounded-lg bg-gray-50 p-4">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-base text-amber-500">
                  info
                </span>
                <span>
                  Este simulador tiene fines exclusivamente educativos e
                  informativos.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-base text-amber-500">
                  info
                </span>
                <span>
                  Los valores presentados son aproximaciones basadas en la
                  normativa tributaria vigente y pueden diferir del cálculo
                  real.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-base text-amber-500">
                  info
                </span>
                <span>
                  Las normas tributarias están sujetas a cambios por parte de la
                  DIAN y el Congreso de la República.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 text-base text-amber-500">
                  info
                </span>
                <span>
                  Los resultados no constituyen asesoría fiscal, contable ni
                  legal.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-gray-700">
            Para tomar decisiones tributarias definitivas, consulte siempre con
            un Contador Público certificado que pueda analizar su situación
            particular.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowDisclaimer(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button onClick={handleSimular} className="flex-1 bg-primary">
            <span className="material-symbols-outlined mr-2 text-lg">
              check_circle
            </span>
            Entiendo y Acepto
          </Button>
        </div>
      </div>
    </div>
  )

  // Paso 1: Ingresos
  const renderPaso1 = () => (
    <div className="space-y-6">
      {/* Explicación del ejercicio */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-blue-100 p-2">
            <span className="material-symbols-outlined text-xl text-blue-600">
              school
            </span>
          </div>
          <div>
            <h4 className="font-bold text-blue-900">
              ¿Cómo funciona este simulador?
            </h4>
            <p className="mt-1 text-sm text-blue-800">
              Compararemos dos formas de tributar en Colombia:
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-white/70 p-3">
                <p className="font-semibold text-purple-700">
                  Régimen Simple (RST)
                </p>
                <p className="text-xs text-gray-600">
                  Tarifa fija sobre ingresos brutos (5.9% - 14.5%)
                </p>
              </div>
              <div className="rounded-lg bg-white/70 p-3">
                <p className="font-semibold text-blue-700">Régimen Ordinario</p>
                <p className="text-xs text-gray-600">
                  Tarifa progresiva sobre renta líquida (0% - 39%)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UVT Info */}
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm">
        <span className="material-symbols-outlined text-gray-500">info</span>
        <span className="text-gray-600">
          UVT 2025:{' '}
          <strong className="text-gray-900">${formatNumber(UVT_2025)}</strong>
          <span className="ml-1 text-gray-400">(Resolución DIAN 000193)</span>
        </span>
      </div>

      {/* Ingreso Anual */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="material-symbols-outlined text-lg text-primary">
            payments
          </span>
          Ingresos Brutos Anuales *
          <FinancialTermTooltip term="Ingresos Brutos" side="right" />
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <Input
            type="text"
            placeholder="Ej: 80,000,000"
            value={formatNumber(datos.ingresosBrutosAnuales)}
            onChange={handleNumberChange('ingresosBrutosAnuales')}
            className={`pl-8 text-lg ${errores.ingresosBrutosAnuales ? 'border-red-500' : ''}`}
          />
        </div>
        {errores.ingresosBrutosAnuales && (
          <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
            <span className="material-symbols-outlined text-base">error</span>
            {errores.ingresosBrutosAnuales}
          </p>
        )}
        {datos.ingresosBrutosAnuales > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            = {(datos.ingresosBrutosAnuales / UVT_2025).toFixed(0)} UVT
            {datos.ingresosBrutosAnuales / UVT_2025 < 1090 && (
              <span className="ml-2 text-green-600">
                (Dentro de franja 0% en Ordinario)
              </span>
            )}
          </p>
        )}
      </div>

      {/* Actividad */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="material-symbols-outlined text-lg text-primary">
            work
          </span>
          Tipo de Actividad *
        </label>
        <NativeSelect
          value={datos.actividadEconomica}
          onChange={(e) =>
            setDatos((prev) => ({
              ...prev,
              actividadEconomica: e.target.value as ActividadEconomicaRST,
            }))
          }
        >
          {ACTIVIDADES_ECONOMICAS.map((act) => (
            <option key={act.value} value={act.value}>
              {act.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      {/* Costos */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="material-symbols-outlined text-lg text-primary">
            receipt_long
          </span>
          Costos y Gastos con Soporte Fiscal
          <FinancialTermTooltip term="Gastos Deducibles" side="right" />
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <Input
            type="text"
            placeholder="Ej: 20,000,000"
            value={formatNumber(datos.costosGastos)}
            onChange={handleNumberChange('costosGastos')}
            className="pl-8"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Solo aplican para Régimen Ordinario. Incluye facturas, nómina,
          arriendos, etc.
        </p>
      </div>
    </div>
  )

  // Paso 2: Deducciones
  const renderPaso2 = () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="flex items-center gap-2 text-sm text-amber-800">
          <span className="material-symbols-outlined">lightbulb</span>
          <strong>
            Estas deducciones solo aplican en el Régimen Ordinario
          </strong>
          y pueden reducir significativamente tu impuesto.
        </p>
      </div>

      {/* Dependientes */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <span className="material-symbols-outlined text-lg text-primary">
            family_restroom
          </span>
          Dependientes Económicos
        </label>
        <NativeSelect
          value={datos.dependientes.toString()}
          onChange={(e) =>
            setDatos((prev) => ({
              ...prev,
              dependientes: parseInt(e.target.value),
            }))
          }
        >
          <option value="0">Sin dependientes</option>
          <option value="1">
            1 dependiente (deduce ${formatNumber(72 * UVT_2025)})
          </option>
          <option value="2">
            2 dependientes (deduce ${formatNumber(144 * UVT_2025)})
          </option>
          <option value="3">
            3 dependientes (deduce ${formatNumber(216 * UVT_2025)})
          </option>
          <option value="4">
            4 dependientes (deduce ${formatNumber(288 * UVT_2025)})
          </option>
        </NativeSelect>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Medicina */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Medicina Prepagada Anual
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <Input
              type="text"
              placeholder="0"
              value={formatNumber(datos.medicinaPrepagadaAnual)}
              onChange={handleNumberChange('medicinaPrepagadaAnual')}
              className="pl-7"
            />
          </div>
        </div>

        {/* Vivienda */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Intereses Crédito Vivienda
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <Input
              type="text"
              placeholder="0"
              value={formatNumber(datos.interesesViviendaAnuales)}
              onChange={handleNumberChange('interesesViviendaAnuales')}
              className="pl-7"
            />
          </div>
        </div>

        {/* AFC */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Aportes AFC
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <Input
              type="text"
              placeholder="0"
              value={formatNumber(datos.aportesAFC)}
              onChange={handleNumberChange('aportesAFC')}
              className="pl-7"
            />
          </div>
        </div>

        {/* Pensión Voluntaria */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Aportes Voluntarios Pensión
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <Input
              type="text"
              placeholder="0"
              value={formatNumber(datos.aportesVoluntariosPension)}
              onChange={handleNumberChange('aportesVoluntariosPension')}
              className="pl-7"
            />
          </div>
        </div>
      </div>

      {/* Renta Exenta */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <Checkbox
          label={
            <span>
              <strong>Aplicar Renta Exenta 25%</strong> (Art. 206 num. 10 E.T.)
              <span className="ml-1 text-sm text-gray-500">
                - Límite: ${formatNumber(2880 * UVT_2025)}/año
              </span>
            </span>
          }
          checked={datos.aplicarRentaExenta25}
          onChange={(checked) =>
            setDatos((prev) => ({ ...prev, aplicarRentaExenta25: checked }))
          }
        />
      </div>
    </div>
  )

  // Resultados - SIMPLE Y DIRECTO
  const renderResultados = () => {
    if (!resultado) return null

    const { regimenOrdinario, regimenSimple, regimenRecomendado, diferencia } =
      resultado
    const ahorro = Math.abs(diferencia)
    const esRSTMejor = regimenRecomendado === 'SIMPLE'

    // Valores calculados
    const impuestoRST = regimenSimple.esElegible
      ? regimenSimple.impuestoSimpleNeto
      : 0
    const impuestoOrdinario = regimenOrdinario.impuestoNeto
    const rentaLiquidaUVT = Math.round(
      regimenOrdinario.rentaLiquidaGravable / UVT_2025
    )

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-500">
        {/* RESUMEN: Tus datos */}
        <div className="rounded-xl bg-gray-100 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Resumen de tus datos
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <span className="text-gray-500">Ingresos anuales:</span>
              <span className="ml-2 font-bold">
                {formatearMoneda(datos.ingresosBrutosAnuales)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Costos/Gastos:</span>
              <span className="ml-2 font-bold">
                {formatearMoneda(datos.costosGastos)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Deducciones:</span>
              <span className="ml-2 font-bold">
                {formatearMoneda(
                  regimenOrdinario.deducciones.totalDeduccionesOrdinario
                )}
              </span>
            </div>
          </div>
        </div>

        {/* COMPARACIÓN DIRECTA */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* RST */}
          <div
            className={`rounded-xl border-2 p-5 ${esRSTMejor ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
          >
            {esRSTMejor && (
              <div className="mb-3 flex justify-center">
                <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                  ✓ RECOMENDADO
                </span>
              </div>
            )}
            <h3 className="text-center text-lg font-bold text-purple-700">
              Régimen Simple (RST)
            </h3>

            <div className="my-4 rounded-lg bg-white p-4 text-center shadow-sm">
              <p className="text-sm text-gray-500">Pagarías</p>
              <p className="text-4xl font-bold text-purple-600">
                {formatearMoneda(impuestoRST)}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ingresos brutos</span>
                <span>{formatearMoneda(datos.ingresosBrutosAnuales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">× Tarifa RST</span>
                <span className="font-semibold text-purple-600">
                  {(regimenSimple.tarifaConsolidada * 100).toFixed(1)}%
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>= Impuesto</span>
                  <span className="text-purple-600">
                    {formatearMoneda(impuestoRST)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ORDINARIO */}
          <div
            className={`rounded-xl border-2 p-5 ${!esRSTMejor ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
          >
            {!esRSTMejor && (
              <div className="mb-3 flex justify-center">
                <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
                  ✓ RECOMENDADO
                </span>
              </div>
            )}
            <h3 className="text-center text-lg font-bold text-blue-700">
              Régimen Ordinario
            </h3>

            <div className="my-4 rounded-lg bg-white p-4 text-center shadow-sm">
              <p className="text-sm text-gray-500">Pagarías</p>
              <p className="text-4xl font-bold text-blue-600">
                {formatearMoneda(impuestoOrdinario)}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Ingresos brutos</span>
                <span>{formatearMoneda(datos.ingresosBrutosAnuales)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>- Costos y gastos</span>
                <span>-{formatearMoneda(regimenOrdinario.costosGastos)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>- Deducciones</span>
                <span>
                  -
                  {formatearMoneda(
                    regimenOrdinario.deducciones.totalDeduccionesOrdinario
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Base gravable</span>
                <span className="font-semibold">
                  {formatearMoneda(regimenOrdinario.rentaLiquidaGravable)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>= {rentaLiquidaUVT.toLocaleString()} UVT</span>
                <span>{regimenOrdinario.rangoTabla}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold">
                  <span>= Impuesto</span>
                  <span className="text-blue-600">
                    {formatearMoneda(impuestoOrdinario)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESULTADO FINAL */}
        <div
          className={`rounded-2xl p-6 text-center ${esRSTMejor ? 'bg-purple-600' : 'bg-blue-600'}`}
        >
          <p className="text-sm text-white/80">
            Según tus datos, el régimen que más te conviene es:
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">
            {esRSTMejor ? 'Régimen Simple (RST)' : 'Régimen Ordinario'}
          </h2>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2">
            <span className="material-symbols-outlined text-green-600">
              savings
            </span>
            <span className="text-lg font-bold text-gray-900">
              Ahorras {formatearMoneda(ahorro)} al año
            </span>
          </div>
          <p className="mt-4 text-sm text-white/70">
            {esRSTMejor
              ? `RST: ${formatearMoneda(impuestoRST)} vs Ordinario: ${formatearMoneda(impuestoOrdinario)}`
              : `Ordinario: ${formatearMoneda(impuestoOrdinario)} vs RST: ${formatearMoneda(impuestoRST)}`}
          </p>
        </div>

        {/* EXPLICACIÓN BREVE */}
        {rentaLiquidaUVT < 1090 && !esRSTMejor && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm text-green-800">
              <strong>¿Por qué $0 en Ordinario?</strong> Tu renta líquida (
              {formatearMoneda(regimenOrdinario.rentaLiquidaGravable)}) es menor
              a 1,090 UVT (~$54 millones), que es la franja exenta de impuesto
              de renta.
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <span className="material-symbols-outlined mr-2">restart_alt</span>
            Nueva Simulación
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex-1"
          >
            <span className="material-symbols-outlined mr-2">print</span>
            Imprimir
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      {showDisclaimer && renderDisclaimer()}

      <Card className="overflow-hidden">
        <div className="border-b bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <span className="material-symbols-outlined text-primary">
              compare
            </span>
            Simulador: RST vs Régimen Ordinario
          </h2>
          <p className="text-sm text-gray-600">
            Colombia 2025 - Personas Naturales
          </p>
        </div>

        <div className="p-6">
          {!resultado ? (
            <>
              {/* Stepper */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-4">
                  {PASOS.map((p, index) => (
                    <div key={p.id} className="flex items-center">
                      <button
                        onClick={() => p.id <= paso && setPaso(p.id)}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          p.id === paso
                            ? 'bg-primary text-white'
                            : p.id < paso
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {p.id < paso ? (
                          <span className="material-symbols-outlined text-lg">
                            check
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-lg">
                            {p.icono}
                          </span>
                        )}
                        {p.titulo}
                      </button>
                      {index < PASOS.length - 1 && (
                        <div
                          className={`mx-2 h-0.5 w-8 ${paso > p.id ? 'bg-green-500' : 'bg-gray-200'}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contenido */}
              <div className="min-h-[350px]">
                {paso === 1 && renderPaso1()}
                {paso === 2 && renderPaso2()}
              </div>

              {/* Navegación */}
              <div className="mt-6 flex justify-between border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => setPaso(paso - 1)}
                  disabled={paso === 1}
                >
                  <span className="material-symbols-outlined mr-1">
                    arrow_back
                  </span>
                  Anterior
                </Button>

                {paso < 2 ? (
                  <Button onClick={siguientePaso}>
                    Siguiente
                    <span className="material-symbols-outlined ml-1">
                      arrow_forward
                    </span>
                  </Button>
                ) : (
                  <Button
                    onClick={handlePreSimular}
                    disabled={isCalculating}
                    className="bg-primary"
                  >
                    {isCalculating ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined mr-2">
                          analytics
                        </span>
                        Simular
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          ) : (
            renderResultados()
          )}
        </div>
      </Card>
    </TooltipProvider>
  )
}
