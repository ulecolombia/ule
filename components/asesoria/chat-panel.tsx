/**
 * ULE - PANEL DE CHAT CON IA
 * Chat principal con streaming de respuestas
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '@/components/asesoria/chat-message'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import type { useIAConsulta } from '@/hooks/use-ia-consulta'

interface Mensaje {
  id: string
  rol: 'USER' | 'ASSISTANT'
  contenido: string
  timestamp: Date | string
}

interface ChatPanelProps {
  conversacionId: string | null
  iaHook: ReturnType<typeof useIAConsulta>
  onConversacionCreada: (id: string) => void
}

/**
 * Preguntas sugeridas para iniciar
 */
const PREGUNTAS_SUGERIDAS = [
  '¿Cómo calculo mis aportes a seguridad social con un contrato OPS?',
  '¿Cuándo debo empezar a facturar electrónicamente?',
  '¿Qué diferencia hay entre régimen simple y régimen ordinario?',
  '¿Cómo declaro renta si tengo varios contratos simultáneos?',
]

/**
 * Panel principal de chat
 */
export function ChatPanel({
  conversacionId,
  iaHook,
  onConversacionCreada,
}: ChatPanelProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [isLoadingMensajes, setIsLoadingMensajes] = useState(false)
  const [pregunta, setPregunta] = useState('')
  const [respuestaStream, setRespuestaStream] = useState('')

  // Refs para auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Cargar mensajes cuando cambia conversacionId
  useEffect(() => {
    if (conversacionId) {
      cargarMensajes(conversacionId)
    } else {
      setMensajes([])
      setRespuestaStream('')
    }
  }, [conversacionId])

  // Auto-scroll cuando hay nuevos mensajes o streaming
  useEffect(() => {
    scrollToBottom()
  }, [mensajes, respuestaStream])

  /**
   * Cargar mensajes de una conversación
   */
  const cargarMensajes = async (id: string) => {
    setIsLoadingMensajes(true)
    try {
      const response = await fetch(`/api/ia/conversaciones/${id}/mensajes`)

      if (!response.ok) {
        throw new Error('Error al cargar mensajes')
      }

      const data = await response.json()
      setMensajes(data.mensajes || [])
    } catch (error) {
      console.error('Error al cargar mensajes:', error)
      toast.error('Error al cargar mensajes')
    } finally {
      setIsLoadingMensajes(false)
    }
  }

  /**
   * Scroll al final del chat
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  /**
   * Enviar pregunta con streaming
   */
  const handleEnviarPregunta = async () => {
    if (!pregunta.trim() || iaHook.isLoading) return

    const preguntaActual = pregunta.trim()
    setPregunta('')
    setRespuestaStream('')

    // Agregar pregunta del usuario al UI inmediatamente
    const mensajeUsuario: Mensaje = {
      id: `temp-${Date.now()}`,
      rol: 'USER',
      contenido: preguntaActual,
      timestamp: new Date(),
    }
    setMensajes((prev) => [...prev, mensajeUsuario])

    try {
      // Enviar con streaming
      await iaHook.consultarStream(
        preguntaActual,
        (chunk) => {
          setRespuestaStream((prev) => prev + chunk)
        },
        conversacionId || undefined
      )

      // Al finalizar, recargar mensajes de la DB
      // Si es una nueva conversación, obtener el ID
      if (!conversacionId) {
        // Esperar un momento para que el backend guarde
        setTimeout(async () => {
          const response = await fetch('/api/ia/conversaciones')
          const data = await response.json()
          if (data.conversaciones && data.conversaciones.length > 0) {
            const nuevaConv = data.conversaciones[0]
            onConversacionCreada(nuevaConv.id)
          }
        }, 500)
      } else {
        // Recargar mensajes
        await cargarMensajes(conversacionId)
      }

      setRespuestaStream('')
    } catch (error) {
      console.error('Error al enviar pregunta:', error)
      // La respuesta stream ya muestra error en el hook
    }
  }

  /**
   * Manejar Enter para enviar (Shift+Enter para nueva línea)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviarPregunta()
    }
  }

  /**
   * Usar pregunta sugerida
   */
  const handleUsarSugerencia = (sugerencia: string) => {
    setPregunta(sugerencia)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-0">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMensajes ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : mensajes.length === 0 && !conversacionId ? (
          /* Preguntas sugeridas */
          <div className="max-w-3xl mx-auto py-12">
            <div className="text-center mb-8">
              <Sparkles className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Bienvenido a tu Asesor Tributario!
              </h2>
              <p className="text-gray-600">
                Pregúntame sobre tributación, seguridad social y facturación en
                Colombia
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Preguntas sugeridas:
              </p>
              {PREGUNTAS_SUGERIDAS.map((sugerencia, index) => (
                <button
                  key={index}
                  onClick={() => handleUsarSugerencia(sugerencia)}
                  className="w-full text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <p className="text-sm text-gray-700">{sugerencia}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Mensajes de conversación */
          <>
            {mensajes.map((mensaje) => (
              <ChatMessage
                key={mensaje.id}
                rol={mensaje.rol}
                contenido={mensaje.contenido}
                timestamp={mensaje.timestamp}
              />
            ))}

            {/* Respuesta en streaming */}
            {respuestaStream && (
              <ChatMessage
                rol="ASSISTANT"
                contenido={respuestaStream}
                timestamp={new Date()}
                isStreaming
              />
            )}

            {/* Loading indicator */}
            {iaHook.isLoading && !respuestaStream && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Pensando...</span>
              </div>
            )}
          </>
        )}

        {/* Elemento para auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta... (Enter para enviar, Shift+Enter para nueva línea)"
                className="resize-none min-h-[60px] max-h-[200px]"
                disabled={iaHook.isLoading}
              />
            </div>
            <Button
              onClick={handleEnviarPregunta}
              disabled={!pregunta.trim() || iaHook.isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-[60px] px-6"
            >
              {iaHook.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            Esta es información educativa. Para casos específicos, consulta un
            profesional certificado.
          </p>
        </div>
      </div>
    </div>
  )
}
