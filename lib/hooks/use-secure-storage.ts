/**
 * CUSTOM HOOK: useSecureStorage
 *
 * Hook reutilizable para manejar localStorage encriptado de forma reactiva
 * Proporciona persistencia automática y sincronización de estado
 *
 * @example
 * const [draft, setDraft] = useSecureStorage('pension-draft', defaultValue)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getSecureItem,
  setSecureItem,
  removeSecureItem,
  migrateToSecureStorage,
} from '@/lib/utils/secure-storage'

export interface UseSecureStorageOptions<T> {
  /** Valor inicial si no existe dato guardado */
  defaultValue?: T
  /** Clave antigua para migración automática */
  migrationKey?: string
  /** Callback ejecutado después de cargar */
  onLoad?: (data: T | null) => void
  /** Callback ejecutado después de guardar */
  onSave?: (data: T) => void
}

/**
 * Hook para manejar estado con persistencia encriptada en localStorage
 *
 * @param key - Clave del localStorage
 * @param options - Opciones de configuración
 * @returns [value, setValue, remove, isLoaded]
 *
 * @example
 * const [draft, setDraft, removeDraft, isLoaded] = useSecureStorage('user-draft', {
 *   defaultValue: { edad: '', ingreso: '' },
 *   migrationKey: 'old-draft-key'
 * })
 */
export function useSecureStorage<T>(
  key: string,
  options: UseSecureStorageOptions<T> = {}
) {
  const { defaultValue, migrationKey, onLoad, onSave } = options

  const [value, setValue] = useState<T | null>(defaultValue ?? null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar datos al montar
  useEffect(() => {
    const loadData = async () => {
      try {
        // Migrar datos antiguos si se especificó
        if (migrationKey) {
          await migrateToSecureStorage(migrationKey, key)
        }

        // Cargar datos encriptados
        const data = await getSecureItem<T>(key)

        if (data) {
          setValue(data)
          onLoad?.(data)
        } else if (defaultValue !== undefined) {
          setValue(defaultValue)
        }
      } catch (error) {
        console.error('Error loading secure storage:', error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]) // Solo ejecutar al montar

  // Función para actualizar valor y persistir
  const updateValue = useCallback(
    async (newValue: T | null | ((prev: T | null) => T | null)) => {
      try {
        const valueToSet =
          typeof newValue === 'function'
            ? (newValue as (prev: T | null) => T | null)(value)
            : newValue

        setValue(valueToSet)

        if (valueToSet !== null) {
          await setSecureItem(key, valueToSet)
          onSave?.(valueToSet)
        } else {
          removeSecureItem(key)
        }
      } catch (error) {
        console.error('Error saving to secure storage:', error)
      }
    },
    [key, value, onSave]
  )

  // Función para eliminar
  const remove = useCallback(() => {
    setValue(null)
    removeSecureItem(key)
  }, [key])

  return [value, updateValue, remove, isLoaded] as const
}
