/**
 * ULE - ACCOUNT DELETION SERVICE
 * Servicio de eliminación de cuenta según Ley 1581 de 2012
 *
 * Art. 15: "Derecho a la supresión de datos"
 *
 * Proceso:
 * 1. Usuario solicita eliminación
 * 2. Se envía token de confirmación por email
 * 3. Usuario confirma con token (30 días de gracia)
 * 4. Transcurridos 30 días, se ejecuta eliminación
 * 5. Usuario puede cancelar en cualquier momento durante periodo de gracia
 */

import { db } from '@/lib/db'
import { EstadoSolicitudEliminacion, AccionPrivacidad } from '@prisma/client'
import { secureLogger } from '@/lib/security/secure-logger'
import { randomBytes } from 'crypto'

/**
 * Genera un token de confirmación seguro
 */
function generarTokenConfirmacion(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Calcula fecha de ejecución (30 días desde confirmación)
 */
function calcularFechaEjecucion(): Date {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 30)
  return fecha
}

/**
 * Crea una solicitud de eliminación de cuenta
 * Genera token de confirmación y lo envía por email
 */
export async function solicitarEliminacion(
  userId: string,
  motivoEliminacion?: string,
  ipSolicitud?: string
): Promise<string> {
  try {
    // 1. Verificar que no exista solicitud pendiente
    const solicitudExistente = await db.solicitudEliminacion.findFirst({
      where: {
        userId,
        estado: {
          in: [
            EstadoSolicitudEliminacion.PENDIENTE,
            EstadoSolicitudEliminacion.CONFIRMADA,
            EstadoSolicitudEliminacion.EN_PERIODO_GRACIA,
          ],
        },
      },
    })

    if (solicitudExistente) {
      throw new Error('Ya existe una solicitud de eliminación activa')
    }

    // 2. Generar token de confirmación
    const tokenConfirmacion = generarTokenConfirmacion()

    // 3. Crear solicitud
    const solicitud = await db.solicitudEliminacion.create({
      data: {
        userId,
        estado: EstadoSolicitudEliminacion.PENDIENTE,
        tokenConfirmacion,
        motivoEliminacion,
        ipSolicitud,
      },
    })

    // 4. Log de privacidad
    await db.logPrivacidad.create({
      data: {
        userId,
        accion: AccionPrivacidad.SOLICITUD_ELIMINACION,
        descripcion: 'Solicitud de eliminación de cuenta creada',
        ipAddress: ipSolicitud,
        metadata: {
          solicitudId: solicitud.id,
          motivo: motivoEliminacion,
        },
      },
    })

    secureLogger.audit('Solicitud de eliminación creada', {
      userId,
      solicitudId: solicitud.id,
    })

    // 5. TODO: Enviar email con token de confirmación
    // await enviarEmailConfirmacionEliminacion(userId, tokenConfirmacion)

    return tokenConfirmacion
  } catch (error) {
    secureLogger.error('Error solicitando eliminación', error, { userId })
    throw error
  }
}

/**
 * Confirma una solicitud de eliminación con el token
 * Inicia el periodo de gracia de 30 días
 */
export async function confirmarEliminacion(
  userId: string,
  token: string
): Promise<void> {
  try {
    // 1. Buscar solicitud con el token
    const solicitud = await db.solicitudEliminacion.findFirst({
      where: {
        userId,
        tokenConfirmacion: token,
        estado: EstadoSolicitudEliminacion.PENDIENTE,
      },
    })

    if (!solicitud) {
      throw new Error('Token inválido o solicitud no encontrada')
    }

    // 2. Calcular fecha de ejecución (30 días desde ahora)
    const fechaEjecucion = calcularFechaEjecucion()

    // 3. Actualizar solicitud
    await db.solicitudEliminacion.update({
      where: { id: solicitud.id },
      data: {
        estado: EstadoSolicitudEliminacion.EN_PERIODO_GRACIA,
        fechaConfirmacion: new Date(),
        fechaEjecucion,
      },
    })

    // 4. Log de privacidad
    await db.logPrivacidad.create({
      data: {
        userId,
        accion: AccionPrivacidad.ELIMINACION_CONFIRMADA,
        descripcion: `Eliminación confirmada. Se ejecutará el ${fechaEjecucion.toLocaleDateString()}`,
        metadata: {
          solicitudId: solicitud.id,
          fechaEjecucion: fechaEjecucion.toISOString(),
        },
      },
    })

    secureLogger.audit('Eliminación confirmada', {
      userId,
      solicitudId: solicitud.id,
      fechaEjecucion,
    })

    // 5. TODO: Enviar email de confirmación con información del periodo de gracia
    // await enviarEmailConfirmacionPeriodoGracia(userId, fechaEjecucion)
  } catch (error) {
    secureLogger.error('Error confirmando eliminación', error, { userId })
    throw error
  }
}

/**
 * Cancela una solicitud de eliminación
 * Solo puede cancelarse si está PENDIENTE o EN_PERIODO_GRACIA
 */
export async function cancelarEliminacion(userId: string): Promise<void> {
  try {
    // 1. Buscar solicitud activa
    const solicitud = await db.solicitudEliminacion.findFirst({
      where: {
        userId,
        estado: {
          in: [
            EstadoSolicitudEliminacion.PENDIENTE,
            EstadoSolicitudEliminacion.EN_PERIODO_GRACIA,
          ],
        },
      },
    })

    if (!solicitud) {
      throw new Error('No se encontró solicitud de eliminación activa')
    }

    // 2. Actualizar estado a CANCELADA
    await db.solicitudEliminacion.update({
      where: { id: solicitud.id },
      data: {
        estado: EstadoSolicitudEliminacion.CANCELADA,
        fechaCancelacion: new Date(),
      },
    })

    // 3. Log de privacidad
    await db.logPrivacidad.create({
      data: {
        userId,
        accion: AccionPrivacidad.ELIMINACION_CANCELADA,
        descripcion: 'Solicitud de eliminación cancelada por el usuario',
        metadata: {
          solicitudId: solicitud.id,
        },
      },
    })

    secureLogger.audit('Eliminación cancelada', {
      userId,
      solicitudId: solicitud.id,
    })

    // 4. TODO: Enviar email de confirmación de cancelación
    // await enviarEmailCancelacionEliminacion(userId)
  } catch (error) {
    secureLogger.error('Error cancelando eliminación', error, { userId })
    throw error
  }
}

/**
 * Ejecuta la eliminación permanente de una cuenta
 * Solo ejecuta si la solicitud está EN_PERIODO_GRACIA y pasaron 30 días
 */
export async function ejecutarEliminacion(solicitudId: string): Promise<void> {
  try {
    // 1. Obtener solicitud
    const solicitud = await db.solicitudEliminacion.findUnique({
      where: { id: solicitudId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!solicitud) {
      throw new Error('Solicitud no encontrada')
    }

    // 2. Validar que esté en periodo de gracia
    if (solicitud.estado !== EstadoSolicitudEliminacion.EN_PERIODO_GRACIA) {
      throw new Error(
        `Solicitud no está en periodo de gracia. Estado: ${solicitud.estado}`
      )
    }

    // 3. Validar que hayan pasado 30 días
    if (!solicitud.fechaEjecucion || new Date() < solicitud.fechaEjecucion) {
      throw new Error('No ha transcurrido el periodo de gracia de 30 días')
    }

    const userId = solicitud.userId

    secureLogger.audit('Iniciando eliminación de cuenta', {
      userId,
      solicitudId,
    })

    // 4. ELIMINACIÓN EN CASCADA
    // Prisma ya tiene configurado onDelete: Cascade en las relaciones,
    // por lo que al eliminar el usuario se eliminarán todos sus datos relacionados

    // 5. Actualizar estado de solicitud antes de eliminar
    await db.solicitudEliminacion.update({
      where: { id: solicitudId },
      data: {
        estado: EstadoSolicitudEliminacion.EJECUTADA,
        fechaEjecucion: new Date(),
      },
    })

    // 6. Log final de privacidad (antes de eliminar)
    await db.logPrivacidad.create({
      data: {
        userId,
        accion: AccionPrivacidad.ELIMINACION_EJECUTADA,
        descripcion: 'Cuenta eliminada permanentemente',
        metadata: {
          solicitudId,
          timestamp: new Date().toISOString(),
        },
      },
    })

    // 7. ELIMINAR USUARIO (cascada elimina todo lo demás)
    await db.user.delete({
      where: { id: userId },
    })

    secureLogger.audit('Cuenta eliminada exitosamente', {
      userId,
      solicitudId,
      email: solicitud.user.email,
    })

    // 8. TODO: Enviar email final de confirmación
    // await enviarEmailEliminacionCompletada(solicitud.user.email)
  } catch (error) {
    // Marcar solicitud como ERROR
    try {
      await db.solicitudEliminacion.update({
        where: { id: solicitudId },
        data: {
          estado: EstadoSolicitudEliminacion.ERROR,
        },
      })
    } catch (updateError) {
      secureLogger.error('Error actualizando estado de solicitud', updateError)
    }

    secureLogger.error('Error ejecutando eliminación', error, { solicitudId })
    throw error
  }
}

/**
 * Obtiene todas las solicitudes de eliminación pendientes de ejecución
 * Usada por el cron job para procesar eliminaciones programadas
 */
export async function obtenerSolicitudesPendientes(): Promise<
  Array<{
    id: string
    userId: string
    fechaEjecucion: Date
    user: {
      email: string
    }
  }>
> {
  try {
    const ahora = new Date()

    const solicitudes = await db.solicitudEliminacion.findMany({
      where: {
        estado: EstadoSolicitudEliminacion.EN_PERIODO_GRACIA,
        fechaEjecucion: {
          lte: ahora, // Menor o igual a ahora (ya pasó el periodo)
        },
      },
      select: {
        id: true,
        userId: true,
        fechaEjecucion: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    // Filter out any with null fechaEjecucion (shouldn't happen given query, but TS requires)
    return solicitudes.filter(
      (s): s is typeof s & { fechaEjecucion: Date } => s.fechaEjecucion !== null
    )
  } catch (error) {
    secureLogger.error('Error obteniendo solicitudes pendientes', error)
    throw error
  }
}

/**
 * Obtiene el estado de la solicitud de eliminación de un usuario
 */
export async function obtenerEstadoEliminacion(userId: string) {
  try {
    const solicitud = await db.solicitudEliminacion.findFirst({
      where: {
        userId,
        estado: {
          in: [
            EstadoSolicitudEliminacion.PENDIENTE,
            EstadoSolicitudEliminacion.EN_PERIODO_GRACIA,
          ],
        },
      },
      select: {
        id: true,
        estado: true,
        fechaSolicitud: true,
        fechaConfirmacion: true,
        fechaEjecucion: true,
        motivoEliminacion: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return solicitud
  } catch (error) {
    secureLogger.error('Error obteniendo estado de eliminación', error, {
      userId,
    })
    throw error
  }
}

/**
 * Obtiene el historial de solicitudes de eliminación
 */
export async function obtenerHistorialEliminaciones(userId: string) {
  try {
    const historial = await db.solicitudEliminacion.findMany({
      where: { userId },
      select: {
        id: true,
        estado: true,
        fechaSolicitud: true,
        fechaConfirmacion: true,
        fechaEjecucion: true,
        fechaCancelacion: true,
        motivoEliminacion: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return historial
  } catch (error) {
    secureLogger.error('Error obteniendo historial de eliminaciones', error, {
      userId,
    })
    throw error
  }
}
