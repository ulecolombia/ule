/**
 * SERVICIO DE ANALYTICS
 * Tracking de eventos y logging de errores
 */

import { prisma } from '@/lib/prisma'
import {
  SafeMetadata,
  MetadataAllowedKey,
  EventoAnalytics,
  ErrorAnalytics,
} from '@/lib/types/analytics'
import { logger } from '@/lib/logger'

/**
 * Campos permitidos en metadata para evitar leak de datos sensibles
 * GDPR Compliance: Solo almacenar datos no sensibles
 */
const METADATA_ALLOWED_KEYS: MetadataAllowedKey[] = [
  'page',
  'pathname',
  'monto',
  'cantidad',
  'entidad',
  'tipo',
  'categoria',
  'duracion',
  'resultado',
  'formato',
  'periodo',
  'nivel',
  'calculadora',
  'tourKey',
  'accion',
  'origen',
  'destino',
]

/**
 * Sanitiza metadata para evitar almacenar datos sensibles
 * Previene: passwords, tokens, emails, documentos, etc.
 */
function sanitizeMetadata(metadata: unknown): SafeMetadata {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }

  const sanitized: SafeMetadata = {}

  for (const key of METADATA_ALLOWED_KEYS) {
    if (key in metadata) {
      const value = metadata[key]

      // Solo permitir tipos primitivos
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        // Truncar strings largos (max 200 chars)
        if (typeof value === 'string' && value.length > 200) {
          sanitized[key] = value.substring(0, 200)
        } else {
          sanitized[key] = value
        }
      }
    }
  }

  return sanitized
}

/**
 * Eventos trackables en la aplicación
 */
export const EVENTOS = {
  // Onboarding
  REGISTRO_INICIADO: 'registro_iniciado',
  REGISTRO_COMPLETADO: 'registro_completado',
  PERFIL_COMPLETADO: 'perfil_completado',
  ONBOARDING_COMPLETADO: 'onboarding_completado',

  // PILA
  PILA_LIQUIDADA: 'pila_liquidada',
  PILA_PAGADA: 'pila_pagada',
  PILA_COMPROBANTE_DESCARGADO: 'pila_comprobante_descargado',

  // Facturación
  CLIENTE_CREADO: 'cliente_creado',
  FACTURA_BORRADOR: 'factura_borrador',
  FACTURA_EMITIDA: 'factura_emitida',
  FACTURA_DESCARGADA: 'factura_descargada',
  FACTURA_ENVIADA_EMAIL: 'factura_enviada_email',

  // Asesoría IA
  CONSULTA_IA_ENVIADA: 'consulta_ia_enviada',
  CONVERSACION_IA_INICIADA: 'conversacion_ia_iniciada',

  // Exportación
  EXPORTACION_REALIZADA: 'exportacion_realizada',

  // Calendario
  EVENTO_CALENDARIO_CREADO: 'evento_calendario_creado',
  CALENDARIO_EXPORTADO: 'calendario_exportado',

  // Calculadoras
  CALCULADORA_USADA: 'calculadora_usada',
  CALCULO_GUARDADO: 'calculo_guardado',

  // Ayuda
  TOUR_COMPLETADO: 'tour_completado',
  ARTICULO_AYUDA_LEIDO: 'articulo_ayuda_leido',

  // Navegación
  PAGE_VIEW: 'page_view',

  // Sistema
  ERROR_CAPTURADO: 'error_capturado',
}

/**
 * Trackear evento
 */
export async function trackEvent(params: EventoAnalytics) {
  const {
    userId,
    evento,
    categoria,
    metadata = {},
    sessionId,
    userAgent,
    ip,
  } = params
  try {
    // Parsear dispositivo y navegador
    const dispositivo = userAgent ? getDeviceType(userAgent) : null
    const navegador = userAgent ? getBrowser(userAgent) : null

    await prisma.analyticsEvento.create({
      data: {
        userId,
        sessionId,
        evento,
        categoria,
        metadata: sanitizeMetadata(metadata), // ✅ Sanitizar metadata
        userAgent,
        ip,
        dispositivo,
        navegador,
      },
    })

    // Actualizar métricas del día
    await actualizarMetricaDiaria(evento, categoria)
  } catch (error) {
    logger.error('Error al trackear evento', error instanceof Error ? error : { error })
    // No fallar la request del usuario por un error de analytics
  }
}

/**
 * Actualizar métricas diarias agregadas
 */
async function actualizarMetricaDiaria(evento: string, categoria: string) {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const metrica = await prisma.metricaDiaria.upsert({
      where: { fecha: hoy },
      create: { fecha: hoy },
      update: {},
    })

    // Incrementar contador según el evento
    const updates: Record<string, { increment: number }> = {}

    switch (evento) {
      case EVENTOS.REGISTRO_COMPLETADO:
        updates.nuevosUsuarios = { increment: 1 }
        updates.registrosCompletados = { increment: 1 }
        break
      case EVENTOS.PERFIL_COMPLETADO:
        updates.perfilesCompletados = { increment: 1 }
        break
      case EVENTOS.PILA_LIQUIDADA:
      case EVENTOS.PILA_PAGADA:
        updates.usosPILA = { increment: 1 }
        break
      case EVENTOS.FACTURA_EMITIDA:
        updates.usosFacturacion = { increment: 1 }
        break
      case EVENTOS.CONSULTA_IA_ENVIADA:
        updates.usosAsesoria = { increment: 1 }
        break
      // ✅ REMOVIDO: No incrementar usuarios activos aquí
      // Se calculará correctamente con distinct count en la API
    }

    if (Object.keys(updates).length > 0) {
      await prisma.metricaDiaria.update({
        where: { id: metrica.id },
        data: updates,
      })
    }
  } catch (error) {
    logger.error('Error al actualizar métrica diaria', error instanceof Error ? error : { error })
  }
}

/**
 * Helpers para detección de dispositivo y navegador
 */
function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile'
  if (/tablet|ipad/i.test(userAgent)) return 'tablet'
  return 'desktop'
}

/**
 * Detecta navegador del user agent
 * IMPORTANTE: El orden importa - más específico primero
 * Edge contiene "Chrome", Chrome contiene "Safari", etc.
 */
function getBrowser(userAgent: string): string {
  // Orden específico para evitar falsos positivos
  if (/edg/i.test(userAgent)) return 'Edge' // Edge primero (contiene "Chrome")
  if (/opr|opera/i.test(userAgent)) return 'Opera' // Opera también contiene "Chrome"
  if (/chrome/i.test(userAgent)) return 'Chrome' // Chrome después de Edge/Opera
  if (/firefox/i.test(userAgent)) return 'Firefox'
  if (/safari/i.test(userAgent)) return 'Safari' // Safari al final (muchos contienen "Safari")
  return 'Other'
}

/**
 * Registrar error
 */
export async function logError(params: ErrorAnalytics) {
  const {
    userId,
    sessionId,
    mensaje,
    stack,
    tipo = 'Error',
    severidad = 'ERROR',
    url,
    componente,
    accion,
    metadata = {},
    userAgent,
    dispositivo,
    navegador,
  } = params
  try {
    await prisma.errorLog.create({
      data: {
        userId,
        sessionId,
        mensaje,
        stack,
        tipo,
        severidad,
        url,
        componente,
        accion,
        metadata,
        userAgent,
        dispositivo,
        navegador,
      },
    })

    // También enviar a Sentry si está configurado
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry lo manejará automáticamente
    }
  } catch (error) {
    // No usar logger.error aquí para evitar loop infinito
    console.error('Error al registrar error:', error)
  }
}
