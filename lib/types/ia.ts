/**
 * ULE - TIPOS TYPESCRIPT PARA SISTEMA DE IA
 * Tipos para integración con Anthropic Claude API
 */

import { User } from '@prisma/client'

/**
 * Mensaje en una conversación con la IA
 */
export interface MensajeIA {
  rol: 'user' | 'assistant'
  contenido: string
}

/**
 * Parámetros para consultar la IA
 */
export interface ConsultarIAParams {
  pregunta: string
  usuario: Partial<User>
  historialConversacion?: MensajeIA[]
}

/**
 * Respuesta de la IA con metadata
 */
export interface RespuestaIA {
  respuesta: string
  tokensUsados: number
  modelo: string
  finishReason: string
}

/**
 * Planes de usuario para límites de consultas
 */
export type PlanUsuario = 'FREE' | 'BASIC' | 'PREMIUM'

/**
 * Información sobre límites de consultas
 */
export interface LimiteConsultas {
  permitido: boolean
  limite: number
  restantes: number
}

/**
 * Resultado de validación de alcance de pregunta
 */
export interface ValidacionAlcance {
  valida: boolean
  razon?: string
}

/**
 * Respuesta del endpoint de consulta
 */
export interface RespuestaEndpointConsulta {
  success: boolean
  conversacionId: string
  tituloConversacion: string
  respuesta: string
  tokensUsados: number
  consultasRestantes: number
}

/**
 * Error de consulta a la IA
 */
export interface ErrorConsultaIA {
  error: string
  mensaje?: string
  razon?: string
  details?: any
}
