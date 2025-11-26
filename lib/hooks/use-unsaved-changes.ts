/**
 * CUSTOM HOOK: useUnsavedChanges
 *
 * Hook para detectar y prevenir pérdida de datos no guardados
 * Muestra confirmación antes de salir de la página
 *
 * @example
 * const { markAsUnsaved, markAsSaved, hasUnsavedChanges } = useUnsavedChanges()
 */

import { useState, useEffect, useCallback } from 'react'

export interface UseUnsavedChangesOptions {
  /** Mensaje de confirmación personalizado */
  message?: string
  /** Habilitar/deshabilitar advertencias */
  enabled?: boolean
}

/**
 * Hook para manejar advertencias de cambios sin guardar
 *
 * @param options - Opciones de configuración
 * @returns { markAsUnsaved, markAsSaved, hasUnsavedChanges }
 *
 * @example
 * const { markAsUnsaved, markAsSaved, hasUnsavedChanges } = useUnsavedChanges({
 *   message: '¿Estás seguro de salir? Tienes una simulación sin guardar.'
 * })
 *
 * // Cuando se calculan resultados
 * markAsUnsaved()
 *
 * // Cuando se guardan los datos
 * markAsSaved()
 */
export function useUnsavedChanges(options: UseUnsavedChangesOptions = {}) {
  const {
    message = '¿Estás seguro de salir? Tienes cambios sin guardar que se perderán.',
    enabled = true,
  } = options

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Prevenir cierre de ventana con datos sin guardar
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = message
        return message
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, message, enabled])

  // Marcar como no guardado
  const markAsUnsaved = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  // Marcar como guardado
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false)
  }, [])

  // Toggle
  const toggleUnsaved = useCallback(() => {
    setHasUnsavedChanges((prev) => !prev)
  }, [])

  return {
    hasUnsavedChanges,
    markAsUnsaved,
    markAsSaved,
    toggleUnsaved,
    setHasUnsavedChanges,
  }
}
