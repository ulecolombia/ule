/**
 * SIMULADOR PENSIONAL
 * Compara Régimen de Prima Media (RPM) vs Régimen de Ahorro Individual (RAIS)
 *
 * VERSIÓN: 2.0.0 (Corregida - Auditoría Técnica)
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  calcularProyeccionPension,
  generarProyeccionAnual,
  formatearMoneda,
  formatearPorcentaje,
  semanasAsAños,
  type DatosPensionales,
  type ResultadoPension,
  type ProyeccionAnual,
} from '@/lib/calculators/pension-calculator'
import { toast } from 'sonner'
import {
  getSecureItem,
  setSecureItem,
  removeSecureItem,
  migrateToSecureStorage,
} from '@/lib/utils/secure-storage'
import { TooltipProvider } from '@/components/ui/tooltip'
import { FinancialTermTooltip } from '@/components/ui/financial-term-tooltip'
import { SimulationResultSkeleton } from '@/components/ui/skeleton'
import { exportarSimulacionPensionalPDF } from '@/lib/utils/pdf-export'
import { useAnalytics } from '@/lib/hooks/use-analytics'

const STORAGE_KEY = 'simulador-pensional-draft'

export function SimuladorPensional() {
  // M1: Analytics tracking
  const { track } = useAnalytics()
  // Estados del formulario
  const [edadActual, setEdadActual] = useState('')
  const [genero, setGenero] = useState<'M' | 'F'>('M')
  const [ingresoMensual, setIngresoMensual] = useState('')
  const [semanasActuales, setSemanasActuales] = useState('')
  const [regimen, setRegimen] = useState<'RPM' | 'RAIS'>('RPM')
  const [rentabilidadEsperada, setRentabilidadEsperada] = useState('5')
  const [saldoAcumulado, setSaldoAcumulado] = useState('')

  // Estados de resultados
  const [resultado, setResultado] = useState<ResultadoPension | null>(null)
  const [proyeccion, setProyeccion] = useState<ProyeccionAnual[]>([])
  const [mostrarProyeccion, setMostrarProyeccion] = useState(false)

  // Estado de carga (M3)
  const [isCalculating, setIsCalculating] = useState(false)

  // UX2: Estado para controlar si hay cambios sin guardar
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // M4: Persistencia SEGURA en localStorage con encriptación
  useEffect(() => {
    const loadSecureDraft = async () => {
      try {
        // Intentar migrar datos antiguos sin encriptar (si existen)
        await migrateToSecureStorage(STORAGE_KEY)

        // Cargar datos encriptados
        const data = await getSecureItem<any>(STORAGE_KEY)
        if (data) {
          if (data.edadActual) setEdadActual(data.edadActual)
          if (data.genero) setGenero(data.genero)
          if (data.ingresoMensual) setIngresoMensual(data.ingresoMensual)
          if (data.semanasActuales) setSemanasActuales(data.semanasActuales)
          if (data.regimen) setRegimen(data.regimen)
          if (data.rentabilidadEsperada)
            setRentabilidadEsperada(data.rentabilidadEsperada)
          if (data.saldoAcumulado) setSaldoAcumulado(data.saldoAcumulado)
          console.log('✅ Borrador cargado de forma segura')
        }
      } catch (error) {
        console.error('Error loading secure draft:', error)
      }
    }

    loadSecureDraft()
  }, [])

  // Guardar borrador ENCRIPTADO cuando cambian los inputs
  useEffect(() => {
    const saveSecureDraft = async () => {
      const draft = {
        edadActual,
        genero,
        ingresoMensual,
        semanasActuales,
        regimen,
        rentabilidadEsperada,
        saldoAcumulado,
      }

      // Solo guardar si hay al menos un campo con datos
      const hasDatos = Object.values(draft).some(
        (val) => val !== '' && val !== null
      )
      if (hasDatos) {
        await setSecureItem(STORAGE_KEY, draft)
      }
    }

    saveSecureDraft()
  }, [
    edadActual,
    genero,
    ingresoMensual,
    semanasActuales,
    regimen,
    rentabilidadEsperada,
    saldoAcumulado,
  ])

  // UX2: Detectar cuando hay resultados sin guardar
  useEffect(() => {
    // Si hay resultados calculados, marcar como "tiene cambios sin guardar"
    if (resultado) {
      setHasUnsavedChanges(true)
    }
  }, [resultado])

  // UX2: Prevenir cierre de ventana con datos sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && resultado) {
        e.preventDefault()
        // Chrome requiere returnValue para mostrar el diálogo
        e.returnValue =
          '¿Estás seguro de salir? Tienes una simulación sin guardar que se perderá.'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges, resultado])

  // M5 + V1: Validación en tiempo real con rangos mejorados
  const erroresValidacion = useMemo(() => {
    const errores: Record<string, string> = {}

    // V1: Edad entre 15-80 años (rango realista para simulaciones)
    if (edadActual) {
      const edad = parseInt(edadActual)
      if (isNaN(edad)) {
        errores.edadActual = 'Ingresa un número válido'
      } else if (edad < 15) {
        errores.edadActual = 'La edad mínima es 15 años'
      } else if (edad > 80) {
        errores.edadActual = 'La edad máxima es 80 años'
      }
    }

    // V1: Ingreso mensual positivo
    if (ingresoMensual) {
      const ingreso = parseFloat(ingresoMensual.replace(/[^0-9]/g, ''))
      if (isNaN(ingreso)) {
        errores.ingresoMensual = 'Ingresa un número válido'
      } else if (ingreso <= 0) {
        errores.ingresoMensual = 'El ingreso debe ser mayor a $0'
      }
    }

    // V1: Semanas cotizadas 0-2600 (máx 50 años de cotización)
    if (semanasActuales) {
      const semanas = parseInt(semanasActuales)
      if (isNaN(semanas)) {
        errores.semanasActuales = 'Ingresa un número válido'
      } else if (semanas < 0) {
        errores.semanasActuales = 'Las semanas no pueden ser negativas'
      } else if (semanas > 2600) {
        errores.semanasActuales = 'Máximo 2,600 semanas (50 años)'
      }
    }

    // V1: Rentabilidad 0-20% anual
    if (rentabilidadEsperada) {
      const rentabilidad = parseFloat(rentabilidadEsperada)
      if (isNaN(rentabilidad)) {
        errores.rentabilidadEsperada = 'Ingresa un número válido'
      } else if (rentabilidad < 0) {
        errores.rentabilidadEsperada = 'La rentabilidad no puede ser negativa'
      } else if (rentabilidad > 20) {
        errores.rentabilidadEsperada = 'Máximo 20% anual'
      }
    }

    return errores
  }, [edadActual, ingresoMensual, semanasActuales, rentabilidadEsperada])

  // P2: Memoización con useCallback para optimizar re-renders
  const handleSimular = useCallback(async () => {
    const edad = parseInt(edadActual)
    const ingreso = parseFloat(ingresoMensual.replace(/[^0-9]/g, ''))
    const semanas = parseInt(semanasActuales)
    const rentabilidad = parseFloat(rentabilidadEsperada)
    // A4: Corrección - mantener decimales
    const saldo = parseFloat(
      saldoAcumulado.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') || '0'
    )

    // V1: Validaciones con rangos específicos
    if (isNaN(edad) || edad < 15 || edad > 80) {
      toast.error('Ingresa una edad válida (15-80 años)')
      return
    }

    if (isNaN(ingreso) || ingreso <= 0) {
      toast.error('Ingresa un ingreso mensual válido mayor a $0')
      return
    }

    if (isNaN(semanas) || semanas < 0 || semanas > 2600) {
      toast.error(
        'Ingresa semanas cotizadas válidas (0-2,600). Puedes usar 0 si aún no has cotizado.'
      )
      return
    }

    if (isNaN(rentabilidad) || rentabilidad < 0 || rentabilidad > 20) {
      toast.error('Ingresa una rentabilidad esperada válida (0-20% anual)')
      return
    }

    // M6: Casos extremos
    const edadPension = genero === 'M' ? 62 : 57
    if (edad >= edadPension) {
      toast.warning(
        'Ya cumples la edad de pensión. Esta simulación muestra tu estado actual.'
      )
    }

    const datos: DatosPensionales = {
      edadActual: edad,
      genero,
      ingresoMensual: ingreso,
      semanasActuales: semanas,
      regimen,
      rentabilidadEsperada: rentabilidad,
      saldoAcumulado: saldo,
    }

    // M3: Loading state
    setIsCalculating(true)

    // Yield to UI thread
    await new Promise((resolve) => setTimeout(resolve, 0))

    try {
      const resultadoCalculado = calcularProyeccionPension(datos)
      const proyeccionCalculada = generarProyeccionAnual(datos)

      setResultado(resultadoCalculado)
      setProyeccion(proyeccionCalculada)

      // M1: Track simulation completed
      track('simulacion_pensional_completada', 'CALCULADORAS', {
        regimen,
        edad: edadActual,
        semanas: semanasActuales,
        tieneAdvertencias: resultadoCalculado.advertencias.length > 0,
      })

      // UX2: Marcar como con cambios sin guardar
      setHasUnsavedChanges(true)
    } finally {
      setIsCalculating(false)
    }
  }, [
    edadActual,
    genero,
    ingresoMensual,
    semanasActuales,
    regimen,
    rentabilidadEsperada,
    saldoAcumulado,
    setHasUnsavedChanges,
    track,
  ])

  const handleGuardar = useCallback(async () => {
    // A2: Validación de response HTTP
    try {
      const response = await fetch('/api/calculadoras/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoCalculadora: 'SIMULADOR_PENSIONAL',
          inputs: {
            edadActual,
            genero,
            ingresoMensual,
            semanasActuales,
            regimen,
            rentabilidadEsperada,
            saldoAcumulado,
          },
          resultados: resultado,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message ||
            `Error ${response.status}: ${response.statusText}`
        )
      }

      toast.success('Simulación guardada correctamente')

      // M1: Track simulation saved
      track('simulacion_pensional_guardada', 'CALCULADORAS', {
        regimen,
        edad: edadActual,
      })

      // Limpiar borrador encriptado
      removeSecureItem(STORAGE_KEY)

      // UX2: Marcar como guardado
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al guardar la simulación'
      )
    }
  }, [
    edadActual,
    genero,
    ingresoMensual,
    semanasActuales,
    regimen,
    rentabilidadEsperada,
    saldoAcumulado,
    resultado,
    setHasUnsavedChanges,
    track,
  ])

  // M7 + P2: Sanitización de inputs numéricos con memoización
  const handleIngresoChange = useCallback((value: string) => {
    const val = value.replace(/[^0-9]/g, '')
    const parsed = parseInt(val)
    setIngresoMensual(!isNaN(parsed) ? parsed.toLocaleString('es-CO') : '')
  }, [])

  const handleSaldoChange = useCallback((value: string) => {
    const val = value.replace(/[^0-9]/g, '')
    const parsed = parseInt(val)
    setSaldoAcumulado(!isNaN(parsed) ? parsed.toLocaleString('es-CO') : '')
  }, [])

  // F1: Handler para exportar a PDF
  const handleExportarPDF = useCallback(() => {
    if (!resultado) return

    try {
      exportarSimulacionPensionalPDF(
        resultado,
        {
          edadActual,
          genero,
          ingresoMensual,
          semanasActuales,
          regimen,
        },
        {
          title: 'Simulación Pensional',
          subtitle: 'Comparación RPM vs RAIS',
          filename: `simulacion-pensional-${new Date().toISOString().split('T')[0]}.pdf`,
        }
      )
      toast.success('PDF descargado correctamente')

      // M1: Track PDF export
      track('pdf_exportado', 'CALCULADORAS', {
        tipo: 'simulacion_pensional',
        regimen,
      })
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      toast.error('Error al generar el PDF')
    }
  }, [
    resultado,
    edadActual,
    genero,
    ingresoMensual,
    semanasActuales,
    regimen,
    track,
  ])

  return (
    <TooltipProvider>
      <Card className="border-light-200 overflow-hidden shadow-md">
        <div className="border-light-200 border-b bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-4">
          <h2 className="text-dark flex items-center gap-2 text-2xl font-bold">
            <span className="material-symbols-outlined text-primary">
              savings
            </span>
            Simulador Pensional
          </h2>
          <p className="text-dark-100 mt-1 text-sm">
            Compara RPM (Colpensiones) vs RAIS (Fondos Privados) y proyecta tu
            pensión
          </p>
          <p className="mt-2 inline-block rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
            ⚠️ Versión 2.0 - Cálculos corregidos según auditoría técnica
          </p>
        </div>

        <div className="space-y-6 p-6">
          {/* Formulario */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Edad Actual */}
            <div>
              <label
                htmlFor="edad-actual"
                className="text-dark mb-2 block text-sm font-medium"
              >
                Edad Actual *
                <span className="text-dark-100 ml-1 text-xs">(15-80 años)</span>
              </label>
              <Input
                id="edad-actual"
                type="number"
                placeholder="Ej: 35"
                value={edadActual}
                onChange={(e) => setEdadActual(e.target.value)}
                min="15"
                max="80"
                aria-label="Edad actual en años"
                aria-required="true"
                aria-invalid={!!erroresValidacion.edadActual}
                aria-describedby={
                  erroresValidacion.edadActual ? 'error-edad' : undefined
                }
                className={erroresValidacion.edadActual ? 'border-red-500' : ''}
              />
              {erroresValidacion.edadActual && (
                <p
                  id="error-edad"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {erroresValidacion.edadActual}
                </p>
              )}
            </div>

            {/* Género */}
            <div>
              <label
                id="genero-label"
                className="text-dark mb-2 block text-sm font-medium"
              >
                Género *
                <span className="text-dark-100 ml-1 text-xs">
                  (Afecta edad de pensión)
                </span>
              </label>
              <div
                className="flex gap-3"
                role="group"
                aria-labelledby="genero-label"
              >
                <button
                  type="button"
                  onClick={() => setGenero('M')}
                  role="radio"
                  aria-checked={genero === 'M'}
                  aria-label="Masculino, edad de pensión 62 años"
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                    genero === 'M'
                      ? 'border-primary bg-primary text-white shadow-md'
                      : 'border-light-200 text-dark bg-white hover:border-primary'
                  }`}
                >
                  <span
                    className="material-symbols-outlined mr-1 text-sm"
                    aria-hidden="true"
                  >
                    male
                  </span>
                  Masculino (62 años)
                </button>
                <button
                  type="button"
                  onClick={() => setGenero('F')}
                  role="radio"
                  aria-checked={genero === 'F'}
                  aria-label="Femenino, edad de pensión 57 años"
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                    genero === 'F'
                      ? 'border-primary bg-primary text-white shadow-md'
                      : 'border-light-200 text-dark bg-white hover:border-primary'
                  }`}
                >
                  <span
                    className="material-symbols-outlined mr-1 text-sm"
                    aria-hidden="true"
                  >
                    female
                  </span>
                  Femenino (57 años)
                </button>
              </div>
            </div>

            {/* Ingreso Mensual */}
            <div>
              <label
                htmlFor="ingreso-mensual"
                className="text-dark mb-2 block text-sm font-medium"
              >
                Ingreso Mensual Actual *
              </label>
              <Input
                id="ingreso-mensual"
                type="text"
                placeholder="Ej: 5000000"
                value={ingresoMensual}
                onChange={(e) => handleIngresoChange(e.target.value)}
                aria-label="Ingreso mensual actual en pesos colombianos"
                aria-required="true"
                aria-invalid={!!erroresValidacion.ingresoMensual}
                aria-describedby={
                  erroresValidacion.ingresoMensual ? 'error-ingreso' : undefined
                }
                className={
                  erroresValidacion.ingresoMensual ? 'border-red-500' : ''
                }
              />
              {erroresValidacion.ingresoMensual && (
                <p
                  id="error-ingreso"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {erroresValidacion.ingresoMensual}
                </p>
              )}
            </div>

            {/* Semanas Cotizadas */}
            <div>
              <label
                htmlFor="semanas-cotizadas"
                className="text-dark mb-2 flex items-center gap-1 text-sm font-medium"
              >
                Semanas Cotizadas *
                <FinancialTermTooltip term="Semanas Cotizadas" side="right" />
                <span className="text-dark-100 ml-1 text-xs">
                  (Mínimo: 1,300)
                </span>
              </label>
              <Input
                id="semanas-cotizadas"
                type="number"
                placeholder="Ej: 800"
                value={semanasActuales}
                onChange={(e) => setSemanasActuales(e.target.value)}
                min="0"
                max="2600"
                aria-label="Número de semanas cotizadas al sistema pensional"
                aria-required="true"
                aria-invalid={!!erroresValidacion.semanasActuales}
                aria-describedby={
                  erroresValidacion.semanasActuales
                    ? 'error-semanas'
                    : 'info-semanas'
                }
                className={
                  erroresValidacion.semanasActuales ? 'border-red-500' : ''
                }
              />
              {semanasActuales && !erroresValidacion.semanasActuales && (
                <p id="info-semanas" className="text-dark-100 mt-1 text-xs">
                  ≈ {semanasAsAños(parseInt(semanasActuales))} años cotizados
                </p>
              )}
              {erroresValidacion.semanasActuales && (
                <p
                  id="error-semanas"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {erroresValidacion.semanasActuales}
                </p>
              )}
            </div>

            {/* Régimen Actual */}
            <div>
              <label
                id="regimen-label"
                className="text-dark mb-2 block text-sm font-medium"
              >
                Régimen Actual
              </label>
              <div
                className="flex gap-3"
                role="group"
                aria-labelledby="regimen-label"
              >
                <button
                  type="button"
                  onClick={() => setRegimen('RPM')}
                  role="radio"
                  aria-checked={regimen === 'RPM'}
                  aria-label="Régimen de Prima Media Colpensiones"
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                    regimen === 'RPM'
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                      : 'border-light-200 text-dark bg-white hover:border-emerald-500'
                  }`}
                >
                  RPM (Colpensiones)
                </button>
                <button
                  type="button"
                  onClick={() => setRegimen('RAIS')}
                  role="radio"
                  aria-checked={regimen === 'RAIS'}
                  aria-label="Régimen de Ahorro Individual con Solidaridad Privado"
                  className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                    regimen === 'RAIS'
                      ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                      : 'border-light-200 text-dark bg-white hover:border-blue-500'
                  }`}
                >
                  RAIS (Privado)
                </button>
              </div>
            </div>

            {/* Rentabilidad Esperada */}
            <div>
              <label
                htmlFor="rentabilidad"
                className="text-dark mb-2 flex items-center gap-1 text-sm font-medium"
              >
                Rentabilidad Esperada (RAIS)
                <FinancialTermTooltip term="Rentabilidad" side="right" />
                <span className="text-dark-100 ml-1 text-xs">
                  (% anual, 0-20)
                </span>
              </label>
              <Input
                id="rentabilidad"
                type="number"
                placeholder="Ej: 5"
                value={rentabilidadEsperada}
                onChange={(e) => setRentabilidadEsperada(e.target.value)}
                min="0"
                max="20"
                step="0.5"
                aria-label="Rentabilidad esperada anual en porcentaje para fondos privados"
                aria-invalid={!!erroresValidacion.rentabilidadEsperada}
                aria-describedby={
                  erroresValidacion.rentabilidadEsperada
                    ? 'error-rentabilidad'
                    : undefined
                }
                className={
                  erroresValidacion.rentabilidadEsperada ? 'border-red-500' : ''
                }
              />
              {erroresValidacion.rentabilidadEsperada && (
                <p
                  id="error-rentabilidad"
                  className="mt-1 text-xs text-red-600"
                  role="alert"
                >
                  {erroresValidacion.rentabilidadEsperada}
                </p>
              )}
            </div>

            {/* Saldo Acumulado */}
            {regimen === 'RAIS' && (
              <div className="md:col-span-2">
                <label
                  htmlFor="saldo-acumulado"
                  className="text-dark mb-2 block text-sm font-medium"
                >
                  Saldo Acumulado en Fondo (Opcional)
                  <span className="text-dark-100 ml-1 text-xs">
                    (Si ya tienes un fondo privado)
                  </span>
                </label>
                <Input
                  id="saldo-acumulado"
                  type="text"
                  placeholder="Ej: 50000000"
                  value={saldoAcumulado}
                  onChange={(e) => handleSaldoChange(e.target.value)}
                  aria-label="Saldo acumulado en el fondo de pensiones privado en pesos colombianos"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSimular}
            size="lg"
            className="w-full"
            disabled={
              isCalculating || Object.keys(erroresValidacion).length > 0
            }
          >
            {isCalculating ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Calculando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined mr-2">
                  analytics
                </span>
                Calcular Proyección Pensional
              </>
            )}
          </Button>

          {/* P1: Skeleton loader durante cálculo */}
          {isCalculating && !resultado && <SimulationResultSkeleton />}

          {/* Resultados */}
          {resultado && !isCalculating && (
            <div
              className="animate-in fade-in slide-in-from-bottom-4 space-y-6 border-t pt-6 duration-500"
              role="region"
              aria-live="polite"
              aria-label="Resultados de la simulación pensional"
            >
              {/* Advertencias */}
              {resultado.advertencias.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-amber-900">
                    <span className="material-symbols-outlined text-amber-600">
                      warning
                    </span>
                    Advertencias Importantes
                  </h4>
                  <ul className="space-y-2 text-sm text-amber-800">
                    {resultado.advertencias.map((adv, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined mt-0.5 text-xs">
                          arrow_right
                        </span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Información General */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border-light-200 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                  <p className="text-dark-100 mb-1 text-xs font-medium">
                    Edad de Pensión
                  </p>
                  <p className="text-dark text-2xl font-bold">
                    {resultado.edadPension} años
                  </p>
                </div>
                <div className="border-light-200 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                  <p className="text-dark-100 mb-1 text-xs font-medium">
                    Años Faltantes
                  </p>
                  <p className="text-dark text-2xl font-bold">
                    {resultado.añosFaltantes} años
                  </p>
                </div>
                <div className="border-light-200 rounded-lg border bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                  <p className="text-dark-100 mb-1 text-xs font-medium">
                    Semanas Faltantes
                  </p>
                  <p className="text-dark text-2xl font-bold">
                    {resultado.semanasFaltantes}
                  </p>
                </div>
                <div className="border-light-200 rounded-lg border bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
                  <p className="text-dark-100 mb-1 text-xs font-medium">
                    Estado
                  </p>
                  <p className="text-dark text-sm font-bold">
                    {resultado.puedesPensionarte ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="material-symbols-outlined text-lg">
                          check_circle
                        </span>
                        Puedes pensionarte
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <span className="material-symbols-outlined text-lg">
                          schedule
                        </span>
                        Aún no cumples requisitos
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Comparativa RPM vs RAIS */}
              <div className="relative">
                <div className="border-light-200 overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[500px] border-collapse">
                    <thead>
                      <tr className="border-light-200 border-b-2 bg-gradient-to-r from-slate-50 to-slate-100">
                        <th className="text-dark p-3 text-left text-sm font-semibold">
                          Concepto
                        </th>
                        <th className="p-3 text-right text-sm font-semibold text-emerald-700">
                          <div className="flex items-center justify-end gap-1">
                            RPM (Colpensiones)
                            <FinancialTermTooltip term="RPM" side="top" />
                          </div>
                        </th>
                        <th className="p-3 text-right text-sm font-semibold text-blue-700">
                          <div className="flex items-center justify-end gap-1">
                            RAIS (Privado)
                            <FinancialTermTooltip term="RAIS" side="top" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-light-200 border-b">
                        <td className="p-3 text-sm">
                          <div className="flex items-center gap-1">
                            IBL / Saldo Proyectado
                            <FinancialTermTooltip term="IBL" side="right" />
                          </div>
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          {formatearMoneda(resultado.ibl || 0)}
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          {formatearMoneda(resultado.saldoProyectado || 0)}
                        </td>
                      </tr>
                      <tr className="border-light-200 border-b">
                        <td className="p-3 text-sm">
                          Porcentaje / Rentabilidad
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          {formatearPorcentaje(
                            resultado.porcentajePension || 0
                          )}
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          {formatearPorcentaje(
                            parseFloat(rentabilidadEsperada)
                          )}
                        </td>
                      </tr>
                      <tr className="border-b-2 border-primary/20 bg-gradient-to-r from-emerald-50 to-blue-50">
                        <td className="text-dark p-3 text-sm font-bold">
                          Pensión Mensual Proyectada
                        </td>
                        <td className="p-3 text-right text-lg font-bold text-emerald-700">
                          {formatearMoneda(resultado.pensionMensualRPM || 0)}
                        </td>
                        <td className="p-3 text-right text-lg font-bold text-blue-700">
                          {formatearMoneda(resultado.pensionMensualRAIS || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {/* R1: Indicador visual de scroll horizontal */}
                <div className="pointer-events-none absolute right-0 top-0 h-full w-8 rounded-r-lg bg-gradient-to-l from-white to-transparent opacity-80"></div>
              </div>

              {/* Recomendación Principal */}
              <div
                className={`rounded-xl border-2 p-6 shadow-sm ${
                  resultado.regimenRecomendado === 'RPM'
                    ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50'
                    : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
                }`}
              >
                <h4 className="text-dark mb-3 flex items-center gap-2 text-lg font-bold">
                  <span className="material-symbols-outlined text-2xl text-primary">
                    recommend
                  </span>
                  Régimen Recomendado:{' '}
                  {resultado.regimenRecomendado === 'RPM'
                    ? 'Prima Media (Colpensiones)'
                    : 'Ahorro Individual (Privado)'}
                </h4>

                <div className="mb-4 rounded-lg bg-white/60 p-4">
                  <p className="text-dark text-sm font-semibold">
                    Diferencia en pensión mensual:{' '}
                    <span
                      className={
                        (resultado.diferenciaMensual || 0) > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {formatearMoneda(
                        Math.abs(resultado.diferenciaMensual || 0)
                      )}
                    </span>
                  </p>
                  <p className="text-dark-100 mt-1 text-xs">
                    {resultado.regimenRecomendado === 'RAIS'
                      ? 'RAIS te daría una pensión mayor'
                      : 'RPM te ofrece mejor cobertura'}
                  </p>
                </div>

                <div className="space-y-2">
                  {resultado.recomendaciones.map((rec, i) => (
                    <div
                      key={i}
                      className="text-dark flex items-start gap-2 rounded-lg bg-white/60 p-3 text-sm"
                    >
                      <span className="material-symbols-outlined mt-0.5 text-sm text-primary">
                        lightbulb
                      </span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proyección Año por Año */}
              {proyeccion.length > 0 && (
                <div>
                  <button
                    onClick={() => setMostrarProyeccion(!mostrarProyeccion)}
                    className="border-light-200 flex w-full items-center justify-between rounded-lg border-2 bg-white p-4 text-left transition-all hover:border-primary hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">
                        trending_up
                      </span>
                      <span className="text-dark font-semibold">
                        Ver Proyección Año por Año
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-dark-100">
                      {mostrarProyeccion ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {mostrarProyeccion && (
                    <div className="relative">
                      <div className="border-light-200 mt-4 overflow-x-auto rounded-lg border shadow-sm">
                        <table className="w-full min-w-[700px] text-sm">
                          <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                            <tr>
                              <th className="p-3 text-left">Año</th>
                              <th className="p-3 text-center">Edad</th>
                              <th className="p-3 text-center">Semanas</th>
                              <th className="p-3 text-right">Aporte Anual</th>
                              <th className="p-3 text-right">Saldo RAIS</th>
                              <th className="p-3 text-right">Pensión RPM</th>
                              <th className="p-3 text-right">Pensión RAIS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proyeccion.map((p, i) => (
                              <tr
                                key={i}
                                className={`border-light-200 border-b ${
                                  p.edad >= resultado.edadPension
                                    ? 'bg-green-50 font-semibold'
                                    : ''
                                }`}
                              >
                                <td className="p-3">{p.año}</td>
                                <td className="p-3 text-center">{p.edad}</td>
                                <td className="p-3 text-center">{p.semanas}</td>
                                <td className="p-3 text-right">
                                  {formatearMoneda(p.aporteAnual)}
                                </td>
                                <td className="p-3 text-right">
                                  {formatearMoneda(p.saldoAcumulado)}
                                </td>
                                <td className="p-3 text-right text-emerald-700">
                                  {formatearMoneda(p.pensionProyectadaRPM)}
                                </td>
                                <td className="p-3 text-right text-blue-700">
                                  {formatearMoneda(p.pensionProyectadaRAIS)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {/* R1: Indicador visual de scroll horizontal */}
                      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 rounded-r-lg bg-gradient-to-l from-white to-transparent opacity-80"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Disclaimer Legal */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h5 className="text-dark mb-2 flex items-center gap-2 text-sm font-semibold">
                  <span className="material-symbols-outlined text-sm text-gray-600">
                    gavel
                  </span>
                  Aviso Legal
                </h5>
                <p className="text-dark-100 text-xs leading-relaxed">
                  Esta simulación es únicamente informativa y educativa. Los
                  cálculos se basan en la Ley 100 de 1993 y supuestos de
                  proyección. Los valores reales pueden variar según cambios
                  legislativos, rentabilidad de fondos, y tu historial laboral
                  específico.{' '}
                  <strong>El IBL mostrado es una simplificación</strong> (asume
                  ingreso constante). Consulta con un asesor pensional para
                  decisiones definitivas.
                </p>
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
                  className={`min-h-[48px] w-full touch-manipulation transition-transform active:scale-95 sm:col-span-2 lg:col-span-1 ${hasUnsavedChanges ? 'border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100' : ''}`}
                >
                  <span className="material-symbols-outlined mr-2">
                    {hasUnsavedChanges ? 'save' : 'bookmark'}
                  </span>
                  <span className="hidden sm:inline">
                    {hasUnsavedChanges
                      ? 'Guardar Simulación (Sin Guardar)'
                      : 'Guardar Simulación'}
                  </span>
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
