/**
 * SIMULADOR PENSIONAL
 * Compara Régimen de Prima Media (RPM) vs Régimen de Ahorro Individual (RAIS)
 *
 * VERSIÓN: 2.0.0 (Corregida - Auditoría Técnica)
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
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

const STORAGE_KEY = 'simulador-pensional-draft'

export function SimuladorPensional() {
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

  // M4: Persistencia en localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (data.edadActual) setEdadActual(data.edadActual)
        if (data.genero) setGenero(data.genero)
        if (data.ingresoMensual) setIngresoMensual(data.ingresoMensual)
        if (data.semanasActuales) setSemanasActuales(data.semanasActuales)
        if (data.regimen) setRegimen(data.regimen)
        if (data.rentabilidadEsperada)
          setRentabilidadEsperada(data.rentabilidadEsperada)
        if (data.saldoAcumulado) setSaldoAcumulado(data.saldoAcumulado)
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    }
  }, [])

  // Guardar borrador cuando cambian los inputs
  useEffect(() => {
    const draft = {
      edadActual,
      genero,
      ingresoMensual,
      semanasActuales,
      regimen,
      rentabilidadEsperada,
      saldoAcumulado,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [
    edadActual,
    genero,
    ingresoMensual,
    semanasActuales,
    regimen,
    rentabilidadEsperada,
    saldoAcumulado,
  ])

  // M5: Validación en tiempo real
  const erroresValidacion = useMemo(() => {
    const errores: Record<string, string> = {}

    if (edadActual) {
      const edad = parseInt(edadActual)
      if (isNaN(edad) || edad < 18 || edad > 100) {
        errores.edadActual = 'Edad debe estar entre 18 y 100 años'
      }
    }

    if (ingresoMensual) {
      const ingreso = parseFloat(ingresoMensual.replace(/[^0-9]/g, ''))
      if (isNaN(ingreso) || ingreso <= 0) {
        errores.ingresoMensual = 'Ingreso debe ser mayor a 0'
      }
    }

    if (semanasActuales) {
      const semanas = parseInt(semanasActuales)
      if (isNaN(semanas) || semanas < 0) {
        errores.semanasActuales = 'Semanas no puede ser negativo'
      }
    }

    if (rentabilidadEsperada) {
      const rentabilidad = parseFloat(rentabilidadEsperada)
      if (isNaN(rentabilidad) || rentabilidad < 0 || rentabilidad > 20) {
        errores.rentabilidadEsperada = 'Rentabilidad debe estar entre 0% y 20%'
      }
    }

    return errores
  }, [edadActual, ingresoMensual, semanasActuales, rentabilidadEsperada])

  const handleSimular = async () => {
    const edad = parseInt(edadActual)
    const ingreso = parseFloat(ingresoMensual.replace(/[^0-9]/g, ''))
    const semanas = parseInt(semanasActuales)
    const rentabilidad = parseFloat(rentabilidadEsperada)
    // A4: Corrección - mantener decimales
    const saldo = parseFloat(
      saldoAcumulado.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') || '0'
    )

    // Validaciones
    if (isNaN(edad) || edad < 18 || edad > 100) {
      toast.error('Ingresa una edad válida (18-100 años)')
      return
    }

    if (isNaN(ingreso) || ingreso <= 0) {
      toast.error('Ingresa un ingreso mensual válido')
      return
    }

    if (isNaN(semanas) || semanas < 0) {
      toast.error(
        'Ingresa las semanas cotizadas (puedes usar 0 si aún no has cotizado)'
      )
      return
    }

    if (isNaN(rentabilidad) || rentabilidad < 0 || rentabilidad > 20) {
      toast.error('Ingresa una rentabilidad esperada válida (0-20%)')
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
    } finally {
      setIsCalculating(false)
    }
  }

  const handleGuardar = async () => {
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

      // Limpiar borrador
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error al guardar:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al guardar la simulación'
      )
    }
  }

  // M7: Sanitización de inputs numéricos
  const handleIngresoChange = (value: string) => {
    const val = value.replace(/[^0-9]/g, '')
    const parsed = parseInt(val)
    setIngresoMensual(!isNaN(parsed) ? parsed.toLocaleString('es-CO') : '')
  }

  const handleSaldoChange = (value: string) => {
    const val = value.replace(/[^0-9]/g, '')
    const parsed = parseInt(val)
    setSaldoAcumulado(!isNaN(parsed) ? parsed.toLocaleString('es-CO') : '')
  }

  return (
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
            <label className="text-dark mb-2 block text-sm font-medium">
              Edad Actual *
              <span className="text-dark-100 ml-1 text-xs">(18-100 años)</span>
            </label>
            <Input
              type="number"
              placeholder="Ej: 35"
              value={edadActual}
              onChange={(e) => setEdadActual(e.target.value)}
              min="18"
              max="100"
              className={erroresValidacion.edadActual ? 'border-red-500' : ''}
            />
            {erroresValidacion.edadActual && (
              <p className="mt-1 text-xs text-red-600">
                {erroresValidacion.edadActual}
              </p>
            )}
          </div>

          {/* Género */}
          <div>
            <label className="text-dark mb-2 block text-sm font-medium">
              Género *
              <span className="text-dark-100 ml-1 text-xs">
                (Afecta edad de pensión)
              </span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setGenero('M')}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                  genero === 'M'
                    ? 'border-primary bg-primary text-white shadow-md'
                    : 'border-light-200 text-dark bg-white hover:border-primary'
                }`}
              >
                <span className="material-symbols-outlined mr-1 text-sm">
                  male
                </span>
                Masculino (62 años)
              </button>
              <button
                onClick={() => setGenero('F')}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                  genero === 'F'
                    ? 'border-primary bg-primary text-white shadow-md'
                    : 'border-light-200 text-dark bg-white hover:border-primary'
                }`}
              >
                <span className="material-symbols-outlined mr-1 text-sm">
                  female
                </span>
                Femenino (57 años)
              </button>
            </div>
          </div>

          {/* Ingreso Mensual */}
          <div>
            <label className="text-dark mb-2 block text-sm font-medium">
              Ingreso Mensual Actual *
            </label>
            <Input
              type="text"
              placeholder="Ej: 5000000"
              value={ingresoMensual}
              onChange={(e) => handleIngresoChange(e.target.value)}
              className={
                erroresValidacion.ingresoMensual ? 'border-red-500' : ''
              }
            />
            {erroresValidacion.ingresoMensual && (
              <p className="mt-1 text-xs text-red-600">
                {erroresValidacion.ingresoMensual}
              </p>
            )}
          </div>

          {/* Semanas Cotizadas */}
          <div>
            <label className="text-dark mb-2 block text-sm font-medium">
              Semanas Cotizadas *
              <span className="text-dark-100 ml-1 text-xs">
                (Mínimo: 1,300)
              </span>
            </label>
            <Input
              type="number"
              placeholder="Ej: 800"
              value={semanasActuales}
              onChange={(e) => setSemanasActuales(e.target.value)}
              min="0"
              className={
                erroresValidacion.semanasActuales ? 'border-red-500' : ''
              }
            />
            {semanasActuales && !erroresValidacion.semanasActuales && (
              <p className="text-dark-100 mt-1 text-xs">
                ≈ {semanasAsAños(parseInt(semanasActuales))} años cotizados
              </p>
            )}
            {erroresValidacion.semanasActuales && (
              <p className="mt-1 text-xs text-red-600">
                {erroresValidacion.semanasActuales}
              </p>
            )}
          </div>

          {/* Régimen Actual */}
          <div>
            <label className="text-dark mb-2 block text-sm font-medium">
              Régimen Actual
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setRegimen('RPM')}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
                  regimen === 'RPM'
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                    : 'border-light-200 text-dark bg-white hover:border-emerald-500'
                }`}
              >
                RPM (Colpensiones)
              </button>
              <button
                onClick={() => setRegimen('RAIS')}
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
            <label className="text-dark mb-2 block text-sm font-medium">
              Rentabilidad Esperada (RAIS)
              <span className="text-dark-100 ml-1 text-xs">
                (% anual, 0-20)
              </span>
            </label>
            <Input
              type="number"
              placeholder="Ej: 5"
              value={rentabilidadEsperada}
              onChange={(e) => setRentabilidadEsperada(e.target.value)}
              min="0"
              max="20"
              step="0.5"
              className={
                erroresValidacion.rentabilidadEsperada ? 'border-red-500' : ''
              }
            />
            {erroresValidacion.rentabilidadEsperada && (
              <p className="mt-1 text-xs text-red-600">
                {erroresValidacion.rentabilidadEsperada}
              </p>
            )}
          </div>

          {/* Saldo Acumulado */}
          {regimen === 'RAIS' && (
            <div className="md:col-span-2">
              <label className="text-dark mb-2 block text-sm font-medium">
                Saldo Acumulado en Fondo (Opcional)
                <span className="text-dark-100 ml-1 text-xs">
                  (Si ya tienes un fondo privado)
                </span>
              </label>
              <Input
                type="text"
                placeholder="Ej: 50000000"
                value={saldoAcumulado}
                onChange={(e) => handleSaldoChange(e.target.value)}
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleSimular}
          size="lg"
          className="w-full"
          disabled={isCalculating || Object.keys(erroresValidacion).length > 0}
        >
          {isCalculating ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              Calculando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined mr-2">analytics</span>
              Calcular Proyección Pensional
            </>
          )}
        </Button>

        {/* Resultados */}
        {resultado && (
          <div className="space-y-6 border-t pt-6">
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                <p className="text-dark-100 mb-1 text-xs font-medium">Estado</p>
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-light-200 border-b-2 bg-gradient-to-r from-slate-50 to-slate-100">
                    <th className="text-dark p-3 text-left text-sm font-semibold">
                      Concepto
                    </th>
                    <th className="p-3 text-right text-sm font-semibold text-emerald-700">
                      RPM (Colpensiones)
                    </th>
                    <th className="p-3 text-right text-sm font-semibold text-blue-700">
                      RAIS (Privado)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-light-200 border-b">
                    <td className="p-3 text-sm">IBL / Saldo Proyectado</td>
                    <td className="p-3 text-right text-sm font-medium">
                      {formatearMoneda(resultado.ibl || 0)}
                    </td>
                    <td className="p-3 text-right text-sm font-medium">
                      {formatearMoneda(resultado.saldoProyectado || 0)}
                    </td>
                  </tr>
                  <tr className="border-light-200 border-b">
                    <td className="p-3 text-sm">Porcentaje / Rentabilidad</td>
                    <td className="p-3 text-right text-sm font-medium">
                      {formatearPorcentaje(resultado.porcentajePension || 0)}
                    </td>
                    <td className="p-3 text-right text-sm font-medium">
                      {formatearPorcentaje(parseFloat(rentabilidadEsperada))}
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
                  <div className="border-light-200 mt-4 overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
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

            <Button
              variant="outline"
              onClick={handleGuardar}
              className="w-full"
            >
              <span className="material-symbols-outlined mr-2">bookmark</span>
              Guardar Simulación
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
