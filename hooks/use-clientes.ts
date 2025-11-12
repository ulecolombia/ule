/**
 * ULE - HOOK DE CLIENTES
 * Hook personalizado para gestión de clientes con SWR
 */

import useSWR from 'swr'
import { Cliente } from '@prisma/client'

// Tipo de cliente con count de facturas
export type ClienteConCount = Cliente & {
  _count: {
    facturas: number
  }
}

// Tipo de respuesta de la API
interface ClientesResponse {
  clientes: ClienteConCount[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * Hook para obtener lista de clientes con paginación y filtros
 */
export function useClientes(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  tipoDocumento: string = 'TODOS'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
    tipoDocumento,
  })

  const { data, error, mutate, isLoading } = useSWR<ClientesResponse>(
    `/api/clientes?${params}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000, // Evitar requests duplicados en 5s
    }
  )

  return {
    clientes: data?.clientes || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate, // Para revalidar manualmente
  }
}

/**
 * Hook para obtener un cliente específico
 */
export function useCliente(id: string | null) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/api/clientes/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    cliente: data?.cliente,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Hook para obtener estadísticas de clientes
 */
export function useClientesStats() {
  const { data, error, mutate, isLoading } = useSWR(
    '/api/clientes/stats',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refrescar cada minuto
    }
  )

  return {
    stats: data,
    isLoading,
    isError: error,
    mutate,
  }
}

/**
 * Funciones auxiliares para mutaciones
 */

/**
 * Crea un nuevo cliente
 */
export async function crearCliente(data: any) {
  const response = await fetch('/api/clientes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al crear cliente')
  }

  return response.json()
}

/**
 * Actualiza un cliente existente
 */
export async function actualizarCliente(id: string, data: any) {
  const response = await fetch(`/api/clientes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Error al actualizar cliente')
  }

  return response.json()
}

/**
 * Elimina un cliente
 */
export async function eliminarCliente(id: string) {
  const response = await fetch(`/api/clientes/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || error.error || 'Error al eliminar cliente')
  }

  return response.json()
}

/**
 * Valida si un documento ya existe
 */
export async function validarDocumento(
  numeroDocumento: string,
  excludeId?: string
) {
  const response = await fetch('/api/clientes/validate-documento', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ numeroDocumento, excludeId }),
  })

  if (!response.ok) {
    throw new Error('Error al validar documento')
  }

  const data = await response.json()
  return data.exists
}
