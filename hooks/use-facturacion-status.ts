/**
 * ULE - HOOK DE ESTADO DE FACTURACIÓN
 * Verifica si el usuario tiene habilitada la facturación electrónica
 */

import useSWR from 'swr'

interface FacturacionStatus {
  habilitada: boolean
  yaSolicito: boolean
  fechaSolicitud: string | null
  userName: string
  userEmail: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useFacturacionStatus() {
  const { data, error, isLoading, mutate } = useSWR<FacturacionStatus>(
    '/api/facturacion/status',
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    habilitada: data?.habilitada ?? false,
    yaSolicito: data?.yaSolicito ?? false,
    fechaSolicitud: data?.fechaSolicitud ? new Date(data.fechaSolicitud) : null,
    userName: data?.userName ?? '',
    userEmail: data?.userEmail ?? '',
    isLoading,
    error,
    mutate,
  }
}
