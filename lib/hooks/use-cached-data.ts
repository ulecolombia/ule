/**
 * HOOKS CON CACHING
 * Hooks que usan SWR para caching inteligente
 */

'use client'

import useSWR from 'swr'

/**
 * Hook para facturas con caching
 */
export function useFacturas(filtros?: Record<string, any>) {
  const params = filtros ? new URLSearchParams(filtros).toString() : ''
  const url = params ? `/api/facturacion/facturas?${params}` : '/api/facturacion/facturas'

  const { data, error, isLoading, mutate } = useSWR(url, {
    dedupingInterval: 300000, // 5 minutos
    revalidateOnMount: true,
  })

  return {
    facturas: data?.facturas || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    refetch: mutate,
  }
}

/**
 * Hook para clientes con caching
 */
export function useClientes() {
  const { data, error, isLoading, mutate } = useSWR('/api/clientes', {
    dedupingInterval: 300000, // 5 minutos
  })

  return {
    clientes: data?.clientes || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    refetch: mutate,
  }
}

/**
 * Hook para comprobantes PILA con caching
 */
export function useComprobantes(año?: number) {
  const url = año ? `/api/pila/comprobantes?año=${año}` : '/api/pila/comprobantes'

  const { data, error, isLoading, mutate } = useSWR(url, {
    dedupingInterval: 300000, // 5 minutos
  })

  return {
    comprobantes: data?.comprobantes || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    refetch: mutate,
  }
}

/**
 * Hook para aportes PILA con caching
 */
export function useAportes(filtros?: Record<string, any>) {
  const params = filtros ? new URLSearchParams(filtros).toString() : ''
  const url = params ? `/api/pila/aportes?${params}` : '/api/pila/aportes'

  const { data, error, isLoading, mutate } = useSWR(url, {
    dedupingInterval: 300000, // 5 minutos
  })

  return {
    aportes: data?.aportes || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    refetch: mutate,
  }
}

/**
 * Hook para eventos de calendario con caching
 */
export function useEventosCalendario(mes: number, año: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/calendario/eventos?mes=${mes}&año=${año}`,
    {
      dedupingInterval: 600000, // 10 minutos (eventos cambian poco)
    }
  )

  return {
    eventos: data?.eventos || [],
    isLoading,
    isError: error,
    refetch: mutate,
  }
}

/**
 * Hook para perfil de usuario con caching agresivo
 */
export function usePerfil() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/profile', {
    dedupingInterval: 600000, // 10 minutos
    revalidateOnFocus: false,
  })

  return {
    perfil: data?.perfil,
    isLoading,
    isError: error,
    refetch: mutate,
  }
}

/**
 * Hook para estadísticas del dashboard con caching
 */
export function useEstadisticasDashboard() {
  const { data, error, isLoading, mutate } = useSWR('/api/dashboard/stats', {
    dedupingInterval: 300000, // 5 minutos
  })

  return {
    stats: data?.stats,
    isLoading,
    isError: error,
    refetch: mutate,
  }
}

/**
 * Hook para conversaciones de IA con caching
 */
export function useConversaciones() {
  const { data, error, isLoading, mutate } = useSWR('/api/chat/conversaciones', {
    dedupingInterval: 60000, // 1 minuto (conversaciones más dinámicas)
  })

  return {
    conversaciones: data?.conversaciones || [],
    isLoading,
    isError: error,
    refetch: mutate,
  }
}

/**
 * Hook para notificaciones con caching mínimo
 */
export function useNotificaciones() {
  const { data, error, isLoading, mutate } = useSWR('/api/notificaciones', {
    dedupingInterval: 30000, // 30 segundos (actualizaciones frecuentes)
    refreshInterval: 60000, // Revalidar cada minuto automáticamente
  })

  return {
    notificaciones: data?.notificaciones || [],
    noLeidas: data?.noLeidas || 0,
    isLoading,
    isError: error,
    refetch: mutate,
  }
}

/**
 * Hook para exportaciones con caching
 */
export function useExportaciones() {
  const { data, error, isLoading, mutate } = useSWR('/api/exportar/historial', {
    dedupingInterval: 60000, // 1 minuto
  })

  return {
    exportaciones: data?.exportaciones || [],
    isLoading,
    isError: error,
    refetch: mutate,
  }
}
