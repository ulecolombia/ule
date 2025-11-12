/**
 * ULE - TIPOS TYPESCRIPT PARA SISTEMA DE CHAT
 * Tipos adicionales para gestión de conversaciones con IA
 */

import { Conversacion, Mensaje, RolMensaje } from '@prisma/client'

export type { Conversacion, Mensaje, RolMensaje }

/**
 * Conversación con mensajes incluidos
 */
export interface ConversacionConMensajes extends Conversacion {
  mensajes: Mensaje[]
  _count?: {
    mensajes: number
  }
}

/**
 * Conversación simple con conteo de mensajes
 */
export interface ConversacionConConteo extends Conversacion {
  _count: {
    mensajes: number
  }
}

/**
 * Estadísticas de uso de chat
 */
export interface EstadisticasChat {
  // Generales
  totalConversaciones: number
  totalMensajes: number
  totalConsultas: number
  tokensUsadosTotal: number

  // Mes actual
  consultasMes: number
  tokensUsadosMes: number

  // Actividad
  ultimaActividad: Date | null

  // Conversaciones recientes
  conversacionesRecientes: ConversacionResumen[]

  // Histórico
  usoUltimos7Dias: UsoDiario[]

  // Promedios
  promedioMensajesPorConversacion: number
  promedioTokensPorConsulta: number
}

/**
 * Resumen de conversación
 */
export interface ConversacionResumen {
  id: string
  titulo: string
  updatedAt: Date
  mensajesCount: number
}

/**
 * Uso diario de IA
 */
export interface UsoDiario {
  fecha: Date
  consultas: number
  tokens: number
}

/**
 * Paginación de conversaciones
 */
export interface PaginacionConversaciones {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Respuesta de lista de conversaciones
 */
export interface RespuestaConversaciones {
  conversaciones: ConversacionConConteo[]
  pagination: PaginacionConversaciones
}

/**
 * Respuesta de conversación individual
 */
export interface RespuestaConversacion {
  conversacion: ConversacionConMensajes
}

/**
 * Respuesta de estadísticas
 */
export interface RespuestaEstadisticas {
  estadisticas: EstadisticasChat
}

/**
 * Request para crear conversación
 */
export interface CrearConversacionRequest {
  titulo?: string
  primerMensaje?: string
}

/**
 * Request para actualizar conversación
 */
export interface ActualizarConversacionRequest {
  titulo: string
}

/**
 * Request para enviar mensaje
 */
export interface EnviarMensajeRequest {
  conversacionId: string
  contenido: string
}
