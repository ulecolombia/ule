/**
 * SERVICIO DE GESTIÓN DE SESIONES DE USUARIO
 *
 * Maneja el ciclo de vida completo de sesiones: creación, validación,
 * actualización de actividad, revocación y limpieza.
 *
 * Características:
 * - Tracking de dispositivos y ubicación geográfica
 * - Detección de cambios sospechosos (IP, dispositivo)
 * - Gestión de múltiples sesiones activas
 * - Revocación individual o masiva
 */

import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import UAParser from 'ua-parser-js'
import { logger } from '@/lib/logger'

/**
 * Obtiene información del contexto de la petición HTTP
 * (User-Agent, IP, etc.)
 */
async function getRequestContext() {
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || 'Unknown'
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    '0.0.0.0'

  // Parsear User-Agent
  const parser = new UAParser(userAgent)
  const ua = parser.getResult()

  // Determinar tipo de dispositivo
  let dispositivo = 'desktop'
  if (ua.device.type === 'mobile') dispositivo = 'mobile'
  else if (ua.device.type === 'tablet') dispositivo = 'tablet'

  const navegador = ua.browser.name || 'Unknown'
  const sistemaOperativo = ua.os.name || 'Unknown'

  return {
    userAgent,
    ip,
    dispositivo,
    navegador,
    sistemaOperativo,
  }
}

/**
 * Obtiene información de geolocalización de una IP
 * Usa ipapi.co (gratuito hasta 1000 requests/día)
 *
 * @param ip - Dirección IP
 * @returns País y ciudad (o undefined si falla)
 */
async function getGeoLocation(ip: string): Promise<{
  pais?: string
  ciudad?: string
}> {
  try {
    // Ignorar IPs locales
    if (ip === '0.0.0.0' || ip.startsWith('192.168.') || ip.startsWith('127.')) {
      return {}
    }

    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000), // Timeout de 3 segundos
    })

    if (!response.ok) {
      return {}
    }

    const data = await response.json()

    return {
      pais: data.country_name,
      ciudad: data.city,
    }
  } catch (error) {
    logger.warn('Error al obtener geolocalización', {
      context: 'session-manager.getGeoLocation',
      ip,
      error: error instanceof Error ? error.message : String(error),
    })
    return {}
  }
}

/**
 * Crea una nueva sesión de usuario
 *
 * @param userId - ID del usuario
 * @param token - Token único de sesión
 * @param expiresAt - Fecha de expiración de la sesión
 * @returns Sesión creada
 *
 * @example
 * ```ts
 * const token = generateSecureToken()
 * const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
 *
 * const sesion = await createSession({
 *   userId: user.id,
 *   token,
 *   expiresAt
 * })
 * ```
 */
export async function createSession({
  userId,
  token,
  expiresAt,
}: {
  userId: string
  token: string
  expiresAt: Date
}) {
  try {
    const { userAgent, ip, dispositivo, navegador, sistemaOperativo } =
      await getRequestContext()

    // Obtener geolocalización (no bloqueante)
    const { pais, ciudad } = await getGeoLocation(ip)

    // Marcar otras sesiones como no actuales
    await prisma.sesion.updateMany({
      where: { userId, esActual: true },
      data: { esActual: false },
    })

    // Crear nueva sesión
    const sesion = await prisma.sesion.create({
      data: {
        userId,
        token,
        userAgent,
        ip,
        dispositivo,
        navegador,
        sistemaOperativo,
        pais,
        ciudad,
        expiraEn: expiresAt,
        esActual: true,
      },
    })

    logger.info('Sesión creada', {
      context: 'session-manager.createSession',
      userId,
      sesionId: sesion.id,
      dispositivo,
      navegador,
      ip: ip.substring(0, 10) + '...', // Log parcial de IP por privacidad
    })

    // Registrar evento de seguridad
    await prisma.eventoSeguridad.create({
      data: {
        userId,
        tipo: 'SESION_INICIADA',
        descripcion: `Nueva sesión iniciada desde ${dispositivo} (${navegador})`,
        severidad: 'BAJA',
        ip,
        userAgent,
        sesionId: sesion.id,
        metadata: {
          sesionId: sesion.id,
          dispositivo,
          navegador,
          sistemaOperativo,
          pais,
          ciudad,
        },
      },
    })

    return sesion
  } catch (error) {
    logger.error('Error al crear sesión', error as Error, {
      context: 'session-manager.createSession',
      userId,
    })
    throw error
  }
}

/**
 * Obtiene todas las sesiones activas de un usuario
 *
 * @param userId - ID del usuario
 * @returns Array de sesiones activas ordenadas por última actividad
 *
 * @example
 * ```ts
 * const sesiones = await getUserActiveSessions(userId)
 *
 * for (const sesion of sesiones) {
 *   console.log(`${sesion.dispositivo} - ${sesion.navegador} - ${sesion.ip}`)
 * }
 * ```
 */
export async function getUserActiveSessions(userId: string) {
  return prisma.sesion.findMany({
    where: {
      userId,
      activa: true,
      expiraEn: { gt: new Date() },
    },
    orderBy: { ultimaActividad: 'desc' },
  })
}

/**
 * Actualiza la última actividad de una sesión
 * (Llamar en cada request autenticado para tracking)
 *
 * @param token - Token de sesión
 *
 * @example
 * ```ts
 * // En middleware de autenticación:
 * await updateSessionActivity(sessionToken)
 * ```
 */
export async function updateSessionActivity(token: string): Promise<void> {
  try {
    await prisma.sesion.update({
      where: { token },
      data: { ultimaActividad: new Date() },
    })
  } catch (error) {
    // No lanzar error si la sesión no existe (puede haber sido revocada)
    logger.warn('No se pudo actualizar actividad de sesión', {
      context: 'session-manager.updateSessionActivity',
      token: token.substring(0, 10) + '...',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Revoca una sesión específica
 *
 * @param sesionId - ID de la sesión a revocar
 * @param userId - ID del usuario (para validación)
 * @throws Error si la sesión no existe o no pertenece al usuario
 *
 * @example
 * ```ts
 * await revokeSession(sesionId, userId)
 * ```
 */
export async function revokeSession(
  sesionId: string,
  userId: string
): Promise<void> {
  const sesion = await prisma.sesion.findFirst({
    where: { id: sesionId, userId },
  })

  if (!sesion) {
    throw new Error('Sesión no encontrada')
  }

  await prisma.sesion.update({
    where: { id: sesionId },
    data: {
      activa: false,
      revokedAt: new Date(),
    },
  })

  logger.info('Sesión revocada', {
    context: 'session-manager.revokeSession',
    userId,
    sesionId,
    dispositivo: sesion.dispositivo,
  })

  // Registrar evento de seguridad
  await prisma.eventoSeguridad.create({
    data: {
      userId,
      tipo: 'SESION_REVOCADA',
      descripcion: `Sesión revocada manualmente: ${sesion.dispositivo} - ${sesion.navegador}`,
      severidad: 'MEDIA',
      metadata: {
        sesionId: sesion.id,
        dispositivo: sesion.dispositivo,
        ip: sesion.ip,
      },
    },
  })
}

/**
 * Revoca todas las sesiones del usuario excepto la actual
 * (Útil para "Cerrar sesión en todos los dispositivos")
 *
 * @param userId - ID del usuario
 * @param currentToken - Token de la sesión actual (no revocar esta)
 * @returns Cantidad de sesiones revocadas
 *
 * @example
 * ```ts
 * const count = await revokeAllOtherSessions(userId, currentSessionToken)
 * console.log(`${count} sesiones cerradas`)
 * ```
 */
export async function revokeAllOtherSessions(
  userId: string,
  currentToken: string
): Promise<number> {
  const sesiones = await prisma.sesion.findMany({
    where: {
      userId,
      activa: true,
      token: { not: currentToken },
    },
  })

  await prisma.sesion.updateMany({
    where: {
      userId,
      activa: true,
      token: { not: currentToken },
    },
    data: {
      activa: false,
      revokedAt: new Date(),
    },
  })

  logger.info('Sesiones revocadas masivamente', {
    context: 'session-manager.revokeAllOtherSessions',
    userId,
    cantidadRevocada: sesiones.length,
  })

  // Registrar evento
  await prisma.eventoSeguridad.create({
    data: {
      userId,
      tipo: 'SESION_REVOCADA',
      descripcion: `${sesiones.length} sesiones revocadas (cerrar todas las demás)`,
      severidad: 'MEDIA',
      metadata: {
        cantidadSesiones: sesiones.length,
      },
    },
  })

  return sesiones.length
}

/**
 * Revoca TODAS las sesiones de un usuario (incluyendo la actual)
 * Útil al cambiar contraseña o detectar compromiso de cuenta
 *
 * @param userId - ID del usuario
 * @returns Cantidad de sesiones revocadas
 *
 * @example
 * ```ts
 * // Después de cambiar contraseña:
 * await revokeAllSessions(userId)
 * ```
 */
export async function revokeAllSessions(userId: string): Promise<number> {
  const sesiones = await prisma.sesion.findMany({
    where: {
      userId,
      activa: true,
    },
  })

  await prisma.sesion.updateMany({
    where: {
      userId,
      activa: true,
    },
    data: {
      activa: false,
      revokedAt: new Date(),
    },
  })

  logger.info('Todas las sesiones revocadas', {
    context: 'session-manager.revokeAllSessions',
    userId,
    cantidadRevocada: sesiones.length,
  })

  return sesiones.length
}

/**
 * Limpia sesiones expiradas de la base de datos
 * (Ejecutar periódicamente, ej: cron job diario)
 *
 * Elimina:
 * - Sesiones expiradas (expiraEn < now)
 * - Sesiones revocadas hace más de 30 días
 *
 * @returns Cantidad de sesiones eliminadas
 *
 * @example
 * ```ts
 * // En cron job:
 * const count = await cleanupExpiredSessions()
 * console.log(`${count} sesiones expiradas eliminadas`)
 * ```
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const resultado = await prisma.sesion.deleteMany({
      where: {
        OR: [
          { expiraEn: { lt: new Date() } },
          {
            activa: false,
            revokedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días
            },
          },
        ],
      },
    })

    logger.info('Sesiones expiradas limpiadas', {
      context: 'session-manager.cleanupExpiredSessions',
      cantidadEliminada: resultado.count,
    })

    return resultado.count
  } catch (error) {
    logger.error('Error al limpiar sesiones expiradas', error as Error, {
      context: 'session-manager.cleanupExpiredSessions',
    })
    throw error
  }
}

/**
 * Valida una sesión por token
 *
 * @param token - Token de sesión
 * @returns Sesión si es válida, null si no existe o expiró
 *
 * @example
 * ```ts
 * const sesion = await validateSession(token)
 *
 * if (!sesion) {
 *   throw new Error('Sesión inválida o expirada')
 * }
 * ```
 */
export async function validateSession(token: string) {
  const sesion = await prisma.sesion.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!sesion) {
    return null
  }

  // Verificar si está activa y no expirada
  if (!sesion.activa || sesion.expiraEn < new Date()) {
    return null
  }

  return sesion
}

/**
 * Obtiene estadísticas de sesiones de un usuario
 *
 * @param userId - ID del usuario
 * @returns Estadísticas de sesiones
 */
export async function getUserSessionStats(userId: string) {
  const [activas, total, recientes] = await Promise.all([
    prisma.sesion.count({
      where: {
        userId,
        activa: true,
        expiraEn: { gt: new Date() },
      },
    }),
    prisma.sesion.count({
      where: { userId },
    }),
    prisma.sesion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        dispositivo: true,
        navegador: true,
        ciudad: true,
        pais: true,
        ultimaActividad: true,
        createdAt: true,
        activa: true,
      },
    }),
  ])

  return {
    sesionesActivas: activas,
    totalSesiones: total,
    sesionesRecientes: recientes,
  }
}
