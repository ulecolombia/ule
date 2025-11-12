/**
 * ULE - CUSTOM HOOKS PARA FACTURACIÓN
 * Hooks para obtener facturas y estadísticas con SWR
 */

import useSWR from 'swr'

// ==============================================
// TIPOS
// ==============================================

export interface FiltrosFacturas {
  estado?: 'BORRADOR' | 'EMITIDA' | 'ANULADA' | 'VENCIDA' | null
  fechaDesde?: Date | null
  fechaHasta?: Date | null
  clienteId?: string | null
  montoMin?: number | null
  montoMax?: number | null
  busqueda?: string | null
  page?: number
  limit?: number
}

interface FacturaResumen {
  id: string
  numeroFactura: string
  fecha: Date
  fechaEmision: Date | null
  estado: string
  total: number
  subtotal: number
  totalIva: number
  cliente: {
    id: string
    nombre: string
    email: string | null
    numeroDocumento: string | null
  }
  cufe: string | null
  pdfUrl: string | null
  xmlUrl: string | null
}

interface FacturasPorMes {
  mes: string // 'Enero 2025'
  mesNumero: number // 1-12
  año: number // 2025
  facturas: FacturaResumen[]
  totalMes: number
  cantidadFacturas: number
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FacturasResponse {
  facturasPorMes: FacturasPorMes[]
  pagination: PaginationInfo
}

interface Estadisticas {
  totalFacturadoMes: number
  totalFacturadoAño: number
  facturasPendientes: number
  promedioFactura: number
  facturacionMensual: {
    mes: string
    total: number
  }[]
  topClientes: {
    clienteId: string
    clienteNombre: string
    totalFacturado: number
    cantidadFacturas: number
  }[]
}

// ==============================================
// FETCHER
// ==============================================

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error en la petición' }))
    throw new Error(error.error || 'Error en la petición')
  }

  return res.json()
}

// ==============================================
// HOOK: useFacturas
// ==============================================

export const useFacturas = (filtros: FiltrosFacturas = {}) => {
  // Construir query params
  const params = new URLSearchParams()

  if (filtros.estado) {
    params.append('estado', filtros.estado)
  }

  if (filtros.fechaDesde) {
    params.append('fechaDesde', filtros.fechaDesde.toISOString())
  }

  if (filtros.fechaHasta) {
    params.append('fechaHasta', filtros.fechaHasta.toISOString())
  }

  if (filtros.clienteId) {
    params.append('clienteId', filtros.clienteId)
  }

  if (filtros.montoMin !== null && filtros.montoMin !== undefined) {
    params.append('montoMin', filtros.montoMin.toString())
  }

  if (filtros.montoMax !== null && filtros.montoMax !== undefined) {
    params.append('montoMax', filtros.montoMax.toString())
  }

  if (filtros.busqueda) {
    params.append('busqueda', filtros.busqueda)
  }

  params.append('page', (filtros.page || 1).toString())
  params.append('limit', (filtros.limit || 50).toString())

  // Construir URL
  const url = `/api/facturacion/facturas?${params.toString()}`

  // SWR hook
  const { data, error, mutate, isLoading } = useSWR<FacturasResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 segundos
    }
  )

  return {
    facturasPorMes: data?.facturasPorMes || [],
    pagination: data?.pagination || {
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    },
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  }
}

// ==============================================
// HOOK: useEstadisticas
// ==============================================

export const useEstadisticas = () => {
  const { data, error, mutate, isLoading } = useSWR<Estadisticas>(
    '/api/facturacion/estadisticas',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // 10 segundos
    }
  )

  return {
    estadisticas: data || null,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  }
}

// ==============================================
// HOOK: useFactura (individual)
// ==============================================

export const useFactura = (facturaId: string | null) => {
  const { data, error, mutate, isLoading } = useSWR<FacturaResumen>(
    facturaId ? `/api/facturacion/${facturaId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  )

  return {
    factura: data || null,
    isLoading,
    isError: !!error,
    error: error?.message || null,
    mutate,
  }
}
