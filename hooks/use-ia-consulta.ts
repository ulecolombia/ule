/**
 * ULE - HOOK CUSTOM PARA CONSULTAS A LA IA
 * Simplifica el uso de la IA desde componentes React
 */

import { useState } from 'react'
import { toast } from 'sonner'
import type { RespuestaEndpointConsulta, ErrorConsultaIA } from '@/lib/types/ia'

/**
 * Hook para realizar consultas a la IA
 */
export function useIAConsulta() {
  const [isLoading, setIsLoading] = useState(false)
  const [respuesta, setRespuesta] = useState('')
  const [conversacionId, setConversacionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Consultar a la IA (modo estándar)
   */
  const consultar = async (
    pregunta: string,
    conversacionIdExistente?: string
  ): Promise<RespuestaEndpointConsulta | null> => {
    setIsLoading(true)
    setRespuesta('')
    setError(null)

    try {
      const response = await fetch('/api/ia/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta,
          conversacionId: conversacionIdExistente || conversacionId,
        }),
      })

      if (!response.ok) {
        const errorData: ErrorConsultaIA = await response.json()
        throw new Error(errorData.error || 'Error al consultar')
      }

      const data: RespuestaEndpointConsulta = await response.json()

      setRespuesta(data.respuesta)
      setConversacionId(data.conversacionId)

      toast.success('Respuesta recibida', {
        description: `${data.tokensUsados} tokens usados`,
      })

      return data
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)

      console.error('Error en consulta:', err)
      toast.error('Error al consultar', {
        description: errorMessage,
      })

      return null
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Consultar a la IA con streaming (modo progresivo)
   */
  const consultarStream = async (
    pregunta: string,
    onChunk: (texto: string) => void,
    conversacionIdExistente?: string
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ia/consultar-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta,
          conversacionId: conversacionIdExistente || conversacionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al consultar con streaming')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No se pudo leer la respuesta')

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              if (parsed.chunk) {
                fullText += parsed.chunk
                onChunk(parsed.chunk)
              }
            } catch (e) {
              // Ignorar errores de parsing de chunks individuales
            }
          }
        }
      }

      setRespuesta(fullText)
      toast.success('Respuesta completada')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)

      console.error('Error en streaming:', err)
      toast.error('Error al consultar')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Resetear estado del hook
   */
  const reset = () => {
    setRespuesta('')
    setError(null)
    setConversacionId(null)
  }

  /**
   * Nueva conversación (resetea conversacionId)
   */
  const nuevaConversacion = () => {
    setConversacionId(null)
    setRespuesta('')
    setError(null)
  }

  return {
    // Funciones
    consultar,
    consultarStream,
    reset,
    nuevaConversacion,

    // Estado
    isLoading,
    respuesta,
    conversacionId,
    error,
  }
}

/**
 * Hook para obtener el historial de conversaciones
 */
export function useConversaciones() {
  const [conversaciones, setConversaciones] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Cargar conversaciones del usuario
   */
  const cargarConversaciones = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ia/conversaciones')

      if (!response.ok) {
        throw new Error('Error al cargar conversaciones')
      }

      const data = await response.json()
      setConversaciones(data.conversaciones || [])
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast.error('Error al cargar conversaciones')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Eliminar una conversación
   */
  const eliminarConversacion = async (conversacionId: string) => {
    try {
      const response = await fetch(
        `/api/ia/conversaciones/${conversacionId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Error al eliminar conversación')
      }

      // Actualizar lista local
      setConversaciones((prev) =>
        prev.filter((c) => c.id !== conversacionId)
      )

      toast.success('Conversación eliminada')
    } catch (err) {
      toast.error('Error al eliminar conversación')
    }
  }

  return {
    conversaciones,
    isLoading,
    error,
    cargarConversaciones,
    eliminarConversacion,
  }
}
