/**
 * ULE - HOOK PARA CUENTAS DE COBRO
 * Manejo de estado y fetching con SWR
 */

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export interface CuentaCobro {
  id: string
  numeroCuenta: string
  fecha: string
  fechaVencimiento: string | null
  emisorNombre: string
  emisorDocumento: string
  emisorEmail: string | null
  emisorTelefono: string | null
  emisorDireccion: string | null
  emisorCiudad: string | null
  emisorBanco: string | null
  emisorTipoCuenta: string | null
  emisorNumeroCuenta: string | null
  clienteId: string
  clienteNombre: string
  clienteDocumento: string
  clienteEmail: string | null
  clienteTelefono: string | null
  clienteDireccion: string | null
  clienteCiudad: string | null
  conceptos: ItemCuentaCobro[]
  subtotal: number
  total: number
  estado: EstadoCuentaCobro
  pdfUrl: string | null
  notas: string | null
  conceptoServicio: string | null
  declaracionNoIVA: boolean
  fechaEmision: string | null
  fechaAnulacion: string | null
  motivoAnulacion: string | null
  createdAt: string
  updatedAt: string
  cliente?: {
    id: string
    nombre: string
    numeroDocumento: string
    email: string | null
  }
}

export interface ItemCuentaCobro {
  descripcion: string
  cantidad: number
  valorUnitario: number
  total: number
}

export type EstadoCuentaCobro =
  | 'BORRADOR'
  | 'EMITIDA'
  | 'ENVIADA'
  | 'PAGADA'
  | 'VENCIDA'
  | 'ANULADA'

export interface EstadisticasCuentaCobro {
  resumen: {
    totalCuentas: number
    cuentasEmitidas: number
    cuentasPagadas: number
    cuentasPendientes: number
    cuentasMes: number
  }
  montos: {
    totalMes: number
    totalCobrado: number
    totalPendiente: number
  }
  ultimasCuentas: {
    id: string
    numeroCuenta: string
    clienteNombre: string
    total: number
    estado: string
    fecha: string
  }[]
  topClientes: {
    clienteId: string
    clienteNombre: string
    totalFacturado: number
    cantidadCuentas: number
  }[]
}

/**
 * Hook para listar cuentas de cobro con paginación
 */
export function useCuentasCobro(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  estado: string = 'TODOS'
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(estado && estado !== 'TODOS' && { estado }),
  })

  const { data, error, isLoading, mutate } = useSWR<{
    cuentas: CuentaCobro[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }>(`/api/cuenta-cobro?${params}`, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    cuentas: data?.cuentas || [],
    pagination: data?.pagination || {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook para obtener una cuenta de cobro por ID
 */
export function useCuentaCobro(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    cuentaCobro: CuentaCobro
  }>(id ? `/api/cuenta-cobro/${id}` : null, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    cuentaCobro: data?.cuentaCobro || null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook para estadísticas de cuentas de cobro
 */
export function useEstadisticasCuentaCobro() {
  const { data, error, isLoading, mutate } = useSWR<EstadisticasCuentaCobro>(
    '/api/cuenta-cobro/estadisticas',
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    estadisticas: data || null,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Funciones auxiliares para acciones
 */
export async function crearCuentaCobro(data: any) {
  const response = await fetch('/api/cuenta-cobro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.json()
}

export async function emitirCuentaCobro(cuentaCobroId: string) {
  const response = await fetch('/api/cuenta-cobro/emitir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cuentaCobroId }),
  })
  return response.json()
}

export async function marcarComoPagada(cuentaCobroId: string) {
  const response = await fetch('/api/cuenta-cobro/marcar-pagada', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cuentaCobroId }),
  })
  return response.json()
}

export async function eliminarCuentaCobro(id: string) {
  const response = await fetch(`/api/cuenta-cobro/${id}`, {
    method: 'DELETE',
  })
  return response.json()
}
