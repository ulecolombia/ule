/**
 * CUSTOM HOOK: usePensionSimulator
 *
 * Hook que encapsula toda la lógica de negocio del simulador pensional
 * Separa la lógica de cálculo de la UI para mejor mantenibilidad
 *
 * @example
 * const { inputs, setInputs, calcular, resultado, proyeccion, isCalculating } = usePensionSimulator()
 */

import { useState, useCallback } from 'react'

export interface PensionSimulatorInputs {
  edadActual: string
  genero: 'M' | 'F' | ''
  ingresoMensual: string
  semanasActuales: string
  regimen: 'RPM' | 'RAIS' | 'MIXTO' | ''
  rentabilidadEsperada: string
  saldoAcumulado: string
}

export const DEFAULT_PENSION_INPUTS: PensionSimulatorInputs = {
  edadActual: '',
  genero: '',
  ingresoMensual: '',
  semanasActuales: '',
  regimen: '',
  rentabilidadEsperada: '6',
  saldoAcumulado: '',
}

/**
 * Hook para manejar la lógica del simulador pensional
 *
 * @returns { inputs, setInput, setInputs, resetInputs, calcular, resultado, proyeccion, isCalculating, error }
 *
 * @example
 * const simulator = usePensionSimulator()
 *
 * // Actualizar un campo
 * simulator.setInput('edadActual', '35')
 *
 * // Calcular simulación
 * await simulator.calcular()
 *
 * // Resetear
 * simulator.resetInputs()
 */
export interface PensionSimulatorOptions {
  /** Función de cálculo personalizada */
  calcularFn?: (datos: any) => any
  /** Función de proyección personalizada */
  proyectarFn?: (datos: any) => any[]
}

export function usePensionSimulator(options: PensionSimulatorOptions = {}) {
  const { calcularFn, proyectarFn } = options

  const [inputs, setInputsState] = useState<PensionSimulatorInputs>(
    DEFAULT_PENSION_INPUTS
  )
  const [resultado, setResultado] = useState<any>(null)
  const [proyeccion, setProyeccion] = useState<any[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState('')

  // Actualizar un campo específico
  const setInput = useCallback(
    <K extends keyof PensionSimulatorInputs>(
      key: K,
      value: PensionSimulatorInputs[K]
    ) => {
      setInputsState((prev) => ({ ...prev, [key]: value }))
      if (error) setError('')
    },
    [error]
  )

  // Actualizar múltiples campos
  const setInputs = useCallback(
    (newInputs: Partial<PensionSimulatorInputs>) => {
      setInputsState((prev) => ({ ...prev, ...newInputs }))
    },
    []
  )

  // Resetear todos los inputs
  const resetInputs = useCallback(() => {
    setInputsState(DEFAULT_PENSION_INPUTS)
    setResultado(null)
    setProyeccion([])
    setError('')
  }, [])

  // Validar inputs antes de calcular
  const validateInputs = useCallback((): string | null => {
    const edad = parseInt(inputs.edadActual)
    const ingreso = parseFloat(inputs.ingresoMensual.replace(/[^0-9]/g, ''))
    const semanas = parseInt(inputs.semanasActuales)

    if (isNaN(edad) || edad < 15 || edad > 80) {
      return 'La edad debe estar entre 15 y 80 años'
    }

    if (!inputs.genero) {
      return 'Selecciona tu género'
    }

    if (isNaN(ingreso) || ingreso <= 0) {
      return 'Ingresa un ingreso mensual válido'
    }

    if (isNaN(semanas) || semanas < 0 || semanas > 2600) {
      return 'Las semanas cotizadas deben estar entre 0 y 2600'
    }

    if (!inputs.regimen) {
      return 'Selecciona un régimen pensional'
    }

    const rentabilidad = parseFloat(inputs.rentabilidadEsperada)
    if (isNaN(rentabilidad) || rentabilidad < 0 || rentabilidad > 20) {
      return 'La rentabilidad debe estar entre 0% y 20%'
    }

    return null
  }, [inputs])

  // Función principal de cálculo
  const calcular = useCallback(async () => {
    // Validar inputs
    const validationError = validateInputs()
    if (validationError) {
      setError(validationError)
      return false
    }

    setError('')
    setIsCalculating(true)

    try {
      // Parsear valores
      const edad = parseInt(inputs.edadActual)
      const ingreso = parseFloat(inputs.ingresoMensual.replace(/[^0-9]/g, ''))
      const semanas = parseInt(inputs.semanasActuales)
      const rentabilidad = parseFloat(inputs.rentabilidadEsperada)
      const saldo = parseFloat(
        inputs.saldoAcumulado.replace(/[^0-9]/g, '') || '0'
      )

      const datos = {
        edad,
        genero: inputs.genero as 'M' | 'F',
        ingreso,
        semanas,
        regimen: inputs.regimen as 'RPM' | 'RAIS' | 'MIXTO',
        rentabilidad,
        saldo,
      }

      // Ejecutar funciones de cálculo si se proporcionaron
      if (calcularFn) {
        const resultadoCalc = calcularFn(datos)
        setResultado(resultadoCalc)
      }

      if (proyectarFn) {
        const proyeccionCalc = proyectarFn(datos)
        setProyeccion(proyeccionCalc)
      }

      return true
    } catch (err) {
      setError('Error al calcular la simulación')
      console.error('Error en simulación:', err)
      return false
    } finally {
      setIsCalculating(false)
    }
  }, [inputs, validateInputs, calcularFn, proyectarFn])

  // Función para guardar en historial
  const guardarEnHistorial = useCallback(async () => {
    if (!resultado) {
      throw new Error('No hay resultado para guardar')
    }

    const response = await fetch('/api/calculadoras/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoCalculadora: 'SIMULADOR_PENSIONAL',
        inputs,
        resultados: resultado,
      }),
    })

    if (!response.ok) {
      throw new Error('Error al guardar en historial')
    }

    return await response.json()
  }, [inputs, resultado])

  return {
    // Estado de inputs
    inputs,
    setInput,
    setInputs,
    resetInputs,

    // Estado de cálculo
    calcular,
    resultado,
    proyeccion,
    isCalculating,
    error,

    // Utilidades
    validateInputs,
    guardarEnHistorial,
  }
}
