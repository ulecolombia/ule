/**
 * ULE - HOOKS MEJORADOS CON SWR PARA CONVERSACIONES
 * Hooks para gestión de conversaciones con caché y revalidación automática
 */

'use client'

import useSWR from 'swr'
import { toast } from 'sonner'
import type {
  RespuestaConversaciones,
  RespuestaConversacion,
  RespuestaEstadisticas,
} from '@/lib/types/chat'

/**
 * Fetcher genérico para SWR
 */
const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al cargar datos')
  }

  return res.json()
}

/**
 * Hook para gestión de lista de conversaciones con paginación
 */
export function useConversaciones(
  page = 1,
  limit = 50,
  search = ''
) {
  const { data, error, mutate } = useSWR<RespuestaConversaciones>(
    `/api/ia/conversaciones?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  /**
   * Crear nueva conversación
   */
  const crear = async (titulo?: string, primerMensaje?: string) => {
    try {
      const response = await fetch('/api/ia/conversaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, primerMensaje }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear conversación')
      }

      const result = await response.json()

      // Revalidar lista
      mutate()

      toast.success('Conversación creada')
      return result.conversacion
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error al crear conversación'
      )
      throw error
    }
  }

  /**
   * Eliminar conversación
   */
  const eliminar = async (id: string) => {
    try {
      const response = await fetch(`/api/ia/conversaciones/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar')
      }

      // Revalidar lista
      mutate()

      toast.success('Conversación eliminada')
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al eliminar conversación'
      )
      throw error
    }
  }

  /**
   * Actualizar título de conversación
   */
  const actualizarTitulo = async (id: string, titulo: string) => {
    try {
      const response = await fetch(`/api/ia/conversaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar')
      }

      // Revalidar lista
      mutate()

      toast.success('Título actualizado')
    } catch (error) {
      console.error('Error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error al actualizar título'
      )
      throw error
    }
  }

  return {
    conversaciones: data?.conversaciones || [],
    pagination: data?.pagination,
    isLoading: !error && !data,
    isError: error,
    error: error?.message,
    mutate,
    crear,
    eliminar,
    actualizarTitulo,
  }
}

/**
 * Hook para obtener conversación específica con mensajes
 */
export function useConversacion(id: string | null) {
  const { data, error, mutate } = useSWR<RespuestaConversacion>(
    id ? `/api/ia/conversaciones/${id}/mensajes` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  )

  return {
    conversacion: data?.conversacion,
    mensajes: data?.conversacion?.mensajes || [],
    isLoading: !error && !data && id !== null,
    isError: error,
    error: error?.message,
    mutate,
  }
}

/**
 * Hook para estadísticas de uso de chat
 */
export function useEstadisticasChat() {
  const { data, error, mutate } = useSWR<RespuestaEstadisticas>(
    '/api/ia/estadisticas',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Actualizar cada minuto
    }
  )

  return {
    estadisticas: data?.estadisticas,
    isLoading: !error && !data,
    isError: error,
    error: error?.message,
    mutate,
  }
}
