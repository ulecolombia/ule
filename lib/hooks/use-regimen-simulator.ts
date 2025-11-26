/**
 * CUSTOM HOOK: useRegimenSimulator
 *
 * Hook que encapsula la lógica de negocio del simulador de régimen tributario
 * Separa la lógica de cálculo de la UI para mejor mantenibilidad
 *
 * @example
 * const { ingresoAnual, setIngresoAnual, calcular, resultado, isCalculating } = useRegimenSimulator()
 */

import { useState, useCallback } from 'react'
import { simularRegimenes } from '@/lib/services/calculadoras-service'

export interface RegimenSimulatorInputs {
  ingresoAnual: string
  gastosDeducibles: string
}

export const DEFAULT_REGIMEN_INPUTS: RegimenSimulatorInputs = {
  ingresoAnual: '',
  gastosDeducibles: '',
}

/**
 * Hook para manejar la lógica del simulador de régimen tributario
 *
 * @returns { inputs, setInput, setInputs, resetInputs, calcular, resultado, isCalculating, error }
 *
 * @example
 * const simulator = useRegimenSimulator()
 *
 * // Actualizar campo
 * simulator.setInput('ingresoAnual', '80000000')
 *
 * // Calcular
 * await simulator.calcular()
 *
 * // Resetear
 * simulator.resetInputs()
 */
export function useRegimenSimulator() {
  const [inputs, setInputsState] = useState<RegimenSimulatorInputs>(
    DEFAULT_REGIMEN_INPUTS
  )
  const [resultado, setResultado] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState('')

  // Actualizar un campo específico
  const setInput = useCallback(
    <K extends keyof RegimenSimulatorInputs>(
      key: K,
      value: RegimenSimulatorInputs[K]
    ) => {
      setInputsState((prev) => ({ ...prev, [key]: value }))
      if (error) setError('')
    },
    [error]
  )

  // Actualizar múltiples campos
  const setInputs = useCallback(
    (newInputs: Partial<RegimenSimulatorInputs>) => {
      setInputsState((prev) => ({ ...prev, ...newInputs }))
    },
    []
  )

  // Resetear todos los inputs
  const resetInputs = useCallback(() => {
    setInputsState(DEFAULT_REGIMEN_INPUTS)
    setResultado(null)
    setError('')
  }, [])

  // Validar inputs antes de calcular
  const validateInputs = useCallback((): string | null => {
    const ingreso = parseFloat(inputs.ingresoAnual.replace(/[^0-9]/g, ''))

    if (isNaN(ingreso) || ingreso <= 0) {
      return 'Ingresa un ingreso anual válido mayor a 0'
    }

    // Validar gastos deducibles (opcional pero debe ser número válido si se ingresó)
    if (inputs.gastosDeducibles) {
      const gastos = parseFloat(inputs.gastosDeducibles.replace(/[^0-9]/g, ''))
      if (isNaN(gastos) || gastos < 0) {
        return 'Los gastos deducibles deben ser un número válido'
      }
      if (gastos > ingreso) {
        return 'Los gastos no pueden ser mayores al ingreso'
      }
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
      const ingreso = parseFloat(inputs.ingresoAnual.replace(/[^0-9]/g, ''))
      const gastos = parseFloat(
        inputs.gastosDeducibles.replace(/[^0-9]/g, '') || '0'
      )

      // Ejecutar simulación con pequeño delay para UX
      await new Promise((resolve) => setTimeout(resolve, 300))

      const simulacion = simularRegimenes(ingreso, gastos)

      // Actualizar resultado
      setResultado(simulacion)

      return true
    } catch (err) {
      setError('Error al calcular la simulación')
      console.error('Error en simulación de régimen:', err)
      return false
    } finally {
      setIsCalculating(false)
    }
  }, [inputs, validateInputs])

  // Función para guardar en historial
  const guardarEnHistorial = useCallback(async () => {
    if (!resultado) {
      throw new Error('No hay resultado para guardar')
    }

    const response = await fetch('/api/calculadoras/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipoCalculadora: 'SIMULADOR_REGIMEN',
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
    isCalculating,
    error,

    // Utilidades
    validateInputs,
    guardarEnHistorial,
  }
}
