/**
 * ULE - USE DEBOUNCE HOOK
 * Hook para debouncing de valores (útil para búsquedas en tiempo real)
 */

import { useState, useEffect } from 'react'

/**
 * Hook que devuelve un valor debounced
 * @param value - Valor a hacer debounce
 * @param delay - Delay en milisegundos (default: 500ms)
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set debouncedValue to value (passed in) after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes (also on component unmount)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
