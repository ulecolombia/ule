/**
 * ULE - ONBOARDING STORAGE HOOK
 * Hook para persistir datos del onboarding en localStorage
 */

'use client'

import { useEffect, useState } from 'react'

export function useOnboardingStorage<T>(key: string, initialValue: T) {
  // Estado para almacenar el valor
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar desde localStorage al montar
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error)
    } finally {
      setIsLoaded(true)
    }
  }, [key])

  // Función para guardar valor
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir función de actualización como useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      setStoredValue(valueToStore)

      // Guardar en localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error)
    }
  }

  // Función para limpiar
  const clearValue = () => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error(`Error clearing ${key} from localStorage:`, error)
    }
  }

  return { value: storedValue, setValue, clearValue, isLoaded }
}
