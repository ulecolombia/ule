/**
 * CONFIGURACIÓN DE SWR
 * Setup global para caching inteligente
 */

'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

/**
 * Opciones de fetcher
 */
export interface FetcherOptions {
  timeout?: number // Timeout en ms (default: 10000)
}

/**
 * Fetcher global para SWR con timeout configurable
 */
export const fetcher = async (url: string) => {
  return fetchWithTimeout(url, { timeout: 10000 })
}

/**
 * Fetcher con timeout configurable
 * Útil para endpoints que necesitan más/menos tiempo
 */
export const fetchWithTimeout = async (
  url: string,
  options: FetcherOptions = {}
) => {
  const { timeout = 10000 } = options
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const error: any = new Error('Error al cargar datos')
      error.status = response.status
      throw error
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    // Si fue timeout, dar mensaje más claro
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutError: any = new Error(
        `Request timeout después de ${timeout}ms`
      )
      timeoutError.isTimeout = true
      throw timeoutError
    }

    throw error
  }
}

/**
 * Factory para crear fetchers con timeout personalizado
 *
 * @example
 * const slowFetcher = createFetcherWithTimeout(30000) // 30 segundos
 * useSWR('/api/reportes', slowFetcher)
 */
export const createFetcherWithTimeout = (timeout: number) => {
  return (url: string) => fetchWithTimeout(url, { timeout })
}

/**
 * Fetchers predefinidos para casos comunes
 */
export const FETCHERS = {
  fast: createFetcherWithTimeout(5000), // 5s - Para endpoints rápidos (perfil, config)
  normal: createFetcherWithTimeout(10000), // 10s - Default para la mayoría
  slow: createFetcherWithTimeout(30000), // 30s - Para queries complejas (analytics, reportes)
  verySlow: createFetcherWithTimeout(60000), // 60s - Para operaciones pesadas (exports, PDF)
}

/**
 * Configuración global de SWR
 */
export const swrConfig = {
  fetcher,
  // No revalidar al hacer focus en la ventana
  revalidateOnFocus: false,
  // Revalidar al reconectar
  revalidateOnReconnect: true,
  // Deduplicar requests en 2 segundos
  dedupingInterval: 2000,
  // Revalidar si los datos están stale
  revalidateIfStale: true,
  // Reintentos en caso de error
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  // Mantener datos anteriores mientras se revalida
  keepPreviousData: true,
}

/**
 * Provider de SWR
 */
export function SWRProvider({ children }: { children: ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
}
