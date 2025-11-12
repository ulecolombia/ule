/**
 * MIDDLEWARE DE AUDITORÍA AUTOMÁTICA
 * Captura automáticamente información de contexto de peticiones API
 *
 * OPTIMIZACIONES IMPLEMENTADAS:
 * - Validación de IP para prevenir spoofing
 * - Response clone optimizado
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { registrarAuditoria } from './audit-service'
import { AccionAuditoria } from '@prisma/client'
import { getClientIP } from '@/lib/utils/ip-validation'
import crypto from 'crypto'

/**
 * Configuración del middleware de auditoría
 */
export interface AuditMiddlewareConfig {
  action?: AccionAuditoria
  resourceExtractor?: (req: NextRequest) => string | undefined
  skipIf?: (req: NextRequest) => boolean
}

/**
 * Wrapper de middleware de auditoría
 * Envuelve un handler de API para registrar automáticamente en logs
 *
 * @example
 * export const POST = withAudit(async (req) => {
 *   // Tu lógica aquí
 * }, { action: 'FACTURA_CREADA' })
 */
export function withAudit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config?: AuditMiddlewareConfig
) {
  return async (req: NextRequest, context?: any) => {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()

    // Verificar si se debe saltar auditoría
    if (config?.skipIf && config.skipIf(req)) {
      return handler(req, context)
    }

    // Obtener sesión
    const session = await auth()
    const userId = session?.user?.id

    // ✅ ALTO #12 RESUELTO: Validación de IP para prevenir spoofing
    const ip = getClientIP(req.headers)
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const metodoHttp = req.method
    const ruta = req.nextUrl.pathname

    let response: NextResponse
    let exitoso = true
    let codigoError: string | undefined
    let mensajeError: string | undefined

    try {
      // Ejecutar handler
      response = await handler(req, context)

      // Determinar si fue exitoso
      exitoso = response.status >= 200 && response.status < 400

      // ✅ ALTO #11 RESUELTO: Solo clonar si es necesario
      if (!exitoso && response.headers.get('content-type')?.includes('application/json')) {
        codigoError = response.status.toString()
        try {
          const body = await response.clone().json()
          mensajeError = body.error || body.message
        } catch {
          // Body no es JSON válido o muy grande
        }
      }

      return response
    } catch (error: any) {
      exitoso = false
      codigoError = error.code || 'ERROR'
      mensajeError = error.message
      throw error
    } finally {
      const duracionMs = Date.now() - startTime

      // Registrar auditoría (no bloqueante, fire and forget)
      registrarAuditoria({
        userId,
        accion: config?.action || inferirAccion(metodoHttp, ruta),
        recurso: config?.resourceExtractor ? config.resourceExtractor(req) : undefined,
        exitoso,
        codigoError,
        mensajeError,
        ip,
        userAgent,
        metodoHttp,
        ruta,
        duracionMs,
        requestId,
        sessionId: session?.user?.id, // Usar userId como sessionId si no hay sessionId real
      }).catch((error) => {
        console.error('Error en auditoría automática:', error)
      })
    }
  }
}

/**
 * Inferir acción de auditoría desde método HTTP y ruta
 */
function inferirAccion(metodo: string, ruta: string): AccionAuditoria {
  // Login/Auth
  if (ruta.includes('/api/auth/signin') || ruta.includes('/api/auth/callback')) return 'LOGIN'
  if (ruta.includes('/api/auth/signout')) return 'LOGOUT'
  if (ruta.includes('/api/auth/register') || ruta.includes('/registro')) return 'REGISTRO'

  // Perfil
  if (ruta.includes('/api/user')) {
    if (metodo === 'PUT' || metodo === 'PATCH') return 'PERFIL_ACTUALIZADO'
  }

  // PILA
  if (ruta.includes('/api/pila/liquidacion')) return 'PILA_LIQUIDADA'
  if (ruta.includes('/api/pila/pagar')) return 'PILA_PAGADA'

  // Facturación
  if (ruta.includes('/api/facturacion')) {
    if (ruta.includes('/emitir')) return 'FACTURA_EMITIDA'
    if (metodo === 'POST') return 'FACTURA_CREADA'
    if (metodo === 'DELETE') return 'FACTURA_ANULADA'
  }

  if (ruta.includes('/api/clientes')) {
    if (metodo === 'POST') return 'CLIENTE_CREADO'
    if (metodo === 'PUT' || metodo === 'PATCH') return 'CLIENTE_ACTUALIZADO'
    if (metodo === 'DELETE') return 'CLIENTE_ELIMINADO'
  }

  // IA
  if (ruta.includes('/api/ia/') || ruta.includes('/api/chat')) return 'CONSULTA_IA'

  // Privacidad
  if (ruta.includes('/api/privacy/export')) return 'DATOS_EXPORTADOS'
  if (ruta.includes('/api/privacy/delete-account')) return 'SOLICITUD_ELIMINACION'

  // Archivos
  if (ruta.includes('/api/upload') || ruta.includes('/subir')) {
    if (metodo === 'POST') return 'ARCHIVO_SUBIDO'
    if (metodo === 'DELETE') return 'ARCHIVO_ELIMINADO'
  }
  if (ruta.includes('/download') || ruta.includes('/descargar')) return 'ARCHIVO_DESCARGADO'

  // Default basado en método
  if (metodo === 'POST') return 'REGISTRO'
  if (metodo === 'PUT' || metodo === 'PATCH') return 'PERFIL_ACTUALIZADO'

  return 'REGISTRO' // Default genérico
}

/**
 * Helper para auditar login
 */
export async function auditarLogin(
  email: string,
  exitoso: boolean,
  ip: string,
  userAgent: string,
  userId?: string,
  razon?: string
) {
  await registrarAuditoria({
    userId,
    accion: exitoso ? 'LOGIN' : 'LOGIN_FALLIDO',
    exitoso,
    mensajeError: razon,
    detalles: { email },
    ip,
    userAgent,
    categoria: 'AUTENTICACION',
  })
}

/**
 * Helper para auditar logout
 */
export async function auditarLogout(
  userId: string,
  sessionId?: string,
  ip?: string,
  userAgent?: string
) {
  await registrarAuditoria({
    userId,
    accion: 'LOGOUT',
    sessionId,
    ip,
    userAgent,
    categoria: 'AUTENTICACION',
  })
}

/**
 * Helper para auditar cambio de contraseña
 */
export async function auditarCambioPassword(
  userId: string,
  ip: string,
  userAgent: string,
  metodo: 'cambio' | 'reset' = 'cambio'
) {
  await registrarAuditoria({
    userId,
    accion: metodo === 'reset' ? 'PASSWORD_RESET_COMPLETADO' : 'PASSWORD_CAMBIADO',
    detalles: { metodo },
    ip,
    userAgent,
    categoria: 'AUTENTICACION',
    nivelRiesgo: 'ALTO',
  })
}

/**
 * Helper para auditar solicitud de reset de password
 */
export async function auditarSolicitudResetPassword(
  email: string,
  exitoso: boolean,
  ip: string,
  userAgent: string,
  userId?: string
) {
  await registrarAuditoria({
    userId,
    accion: 'PASSWORD_RESET_SOLICITADO',
    exitoso,
    detalles: { email },
    ip,
    userAgent,
    categoria: 'AUTENTICACION',
  })
}

/**
 * Helper para auditar 2FA
 */
export async function auditar2FA(
  userId: string,
  accion: 'habilitado' | 'deshabilitado',
  ip: string,
  userAgent: string
) {
  await registrarAuditoria({
    userId,
    accion: accion === 'habilitado' ? 'TWO_FACTOR_HABILITADO' : 'TWO_FACTOR_DESHABILITADO',
    ip,
    userAgent,
    categoria: 'AUTENTICACION',
    nivelRiesgo: 'ALTO',
  })
}
