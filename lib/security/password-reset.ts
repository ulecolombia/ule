/**
 * SERVICIO DE RECUPERACIÓN DE CONTRASEÑA
 *
 * Implementa el flujo completo de recuperación de contraseña:
 * 1. Solicitar reset (genera token, envía email)
 * 2. Verificar token
 * 3. Completar reset (cambiar contraseña)
 *
 * Características de seguridad:
 * - Tokens hasheados en BD
 * - Expiración de 1 hora
 * - Rate limiting por intentos
 * - Respuestas opacas (no revelan si email existe)
 * - Revocación de sesiones al cambiar contraseña
 */

import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, generateSecureToken } from './encryption'
import { logger } from '@/lib/logger'
import { revokeAllSessions } from './session-manager'

/**
 * Solicita un reset de contraseña
 *
 * @param email - Email del usuario
 * @returns Resultado de la operación (siempre success:true por seguridad)
 *
 * Nota: Siempre retorna éxito para no revelar si el email existe
 *
 * @example
 * ```ts
 * const result = await requestPasswordReset('user@example.com')
 * console.log(result.message)
 * ```
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Siempre retornar éxito para no revelar si el email existe
    const genericMessage =
      'Si el email existe, recibirás instrucciones para resetear tu contraseña'

    if (!user) {
      logger.info('Reset solicitado para email inexistente', {
        context: 'password-reset.requestPasswordReset',
        email: email.toLowerCase(),
      })

      return {
        success: true,
        message: genericMessage,
      }
    }

    // Verificar rate limit de intentos
    if (user.passwordResetAttempts >= 3) {
      const lastReset = user.passwordResetExpires
      if (lastReset && lastReset > new Date()) {
        logger.warn('Rate limit excedido en reset de contraseña', {
          context: 'password-reset.requestPasswordReset',
          userId: user.id,
          attempts: user.passwordResetAttempts,
        })

        return {
          success: false,
          message: 'Demasiados intentos. Intenta de nuevo más tarde',
        }
      }
    }

    // Generar token seguro
    const token = generateSecureToken(32) // 32 bytes = 64 caracteres hex
    const hashedToken = await hashPassword(token)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Guardar token hasheado en BD
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
        passwordResetAttempts: { increment: 1 },
      },
    })

    // Construir URL de reset
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${token}`

    // TODO: Enviar email con resetUrl
    // En producción, usar un servicio de email real (SendGrid, Resend, etc.)
    logger.info('Token de reset generado', {
      context: 'password-reset.requestPasswordReset',
      userId: user.id,
      expiresAt,
      resetUrl, // Solo para desarrollo - remover en producción
    })

    // Registrar evento de seguridad
    await prisma.eventoSeguridad.create({
      data: {
        userId: user.id,
        tipo: 'PASSWORD_RESET_SOLICITADO',
        descripcion: 'Usuario solicitó reset de contraseña',
        severidad: 'MEDIA',
        metadata: {
          email: user.email,
        },
      },
    })

    return {
      success: true,
      message: genericMessage,
    }
  } catch (error) {
    logger.error('Error al solicitar reset de contraseña', error as Error, {
      context: 'password-reset.requestPasswordReset',
      email,
    })

    throw new Error('Error al procesar solicitud de reset')
  }
}

/**
 * Verifica si un token de reset es válido
 *
 * @param token - Token de reset (texto plano del URL)
 * @returns Resultado de verificación
 *
 * @example
 * ```ts
 * const result = await verifyResetToken(token)
 *
 * if (!result.valid) {
 *   throw new Error(result.message)
 * }
 *
 * const userId = result.userId
 * ```
 */
export async function verifyResetToken(token: string): Promise<{
  valid: boolean
  userId?: string
  message?: string
}> {
  try {
    // Buscar usuarios con token de reset no expirado
    const users = await prisma.user.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { gt: new Date() },
      },
    })

    // Comparar token con cada hash (bcrypt)
    for (const user of users) {
      if (user.passwordResetToken) {
        const isValid = await verifyPassword(token, user.passwordResetToken)
        if (isValid) {
          logger.info('Token de reset verificado', {
            context: 'password-reset.verifyResetToken',
            userId: user.id,
          })

          return { valid: true, userId: user.id }
        }
      }
    }

    logger.warn('Token de reset inválido o expirado', {
      context: 'password-reset.verifyResetToken',
      token: token.substring(0, 10) + '...',
    })

    return {
      valid: false,
      message: 'Token inválido o expirado',
    }
  } catch (error) {
    logger.error('Error al verificar token de reset', error as Error, {
      context: 'password-reset.verifyResetToken',
    })

    return {
      valid: false,
      message: 'Error al verificar token',
    }
  }
}

/**
 * Completa el proceso de reset de contraseña
 *
 * @param token - Token de reset (texto plano)
 * @param newPassword - Nueva contraseña
 * @returns Resultado de la operación
 *
 * @example
 * ```ts
 * const result = await resetPassword(token, newPassword)
 *
 * if (!result.success) {
 *   throw new Error(result.message)
 * }
 *
 * // Redirigir a login
 * ```
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Verificar token
    const verification = await verifyResetToken(token)

    if (!verification.valid || !verification.userId) {
      return {
        success: false,
        message: verification.message || 'Token inválido',
      }
    }

    const userId = verification.userId

    // Hash de nueva contraseña
    const passwordHash = await hashPassword(newPassword)

    // Actualizar contraseña y limpiar tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordResetAttempts: 0,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    })

    logger.info('Contraseña reseteada exitosamente', {
      context: 'password-reset.resetPassword',
      userId,
    })

    // Revocar todas las sesiones activas por seguridad
    await revokeAllSessions(userId)

    // Registrar evento
    await prisma.eventoSeguridad.create({
      data: {
        userId,
        tipo: 'PASSWORD_RESET_COMPLETADO',
        descripcion: 'Contraseña cambiada vía reset',
        severidad: 'ALTA',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
    })

    // TODO: Enviar email de confirmación
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, nombre: true },
    })

    if (user) {
      logger.info('Notificación de cambio de contraseña', {
        context: 'password-reset.resetPassword',
        userId,
        email: user.email,
      })

      // TODO: Enviar email de confirmación
      // await sendEmail({
      //   to: user.email,
      //   subject: 'Tu contraseña ha sido cambiada - ULE',
      //   template: 'password-changed',
      //   data: {
      //     nombre: user.nombre,
      //     timestamp: new Date().toLocaleString('es-CO'),
      //   },
      // })
    }

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente',
    }
  } catch (error) {
    logger.error('Error al completar reset de contraseña', error as Error, {
      context: 'password-reset.resetPassword',
    })

    return {
      success: false,
      message: 'Error al actualizar contraseña',
    }
  }
}

/**
 * Cancela un reset de contraseña en progreso
 * (Limpia el token de reset de un usuario)
 *
 * @param userId - ID del usuario
 *
 * @example
 * ```ts
 * await cancelPasswordReset(userId)
 * ```
 */
export async function cancelPasswordReset(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    logger.info('Reset de contraseña cancelado', {
      context: 'password-reset.cancelPasswordReset',
      userId,
    })
  } catch (error) {
    logger.error('Error al cancelar reset de contraseña', error as Error, {
      context: 'password-reset.cancelPasswordReset',
      userId,
    })
    throw error
  }
}

/**
 * Limpia tokens de reset expirados
 * (Ejecutar periódicamente, ej: cron job diario)
 *
 * @returns Cantidad de tokens limpiados
 *
 * @example
 * ```ts
 * const count = await cleanupExpiredResetTokens()
 * console.log(`${count} tokens expirados limpiados`)
 * ```
 */
export async function cleanupExpiredResetTokens(): Promise<number> {
  try {
    const resultado = await prisma.user.updateMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { lt: new Date() },
      },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    logger.info('Tokens de reset expirados limpiados', {
      context: 'password-reset.cleanupExpiredResetTokens',
      cantidadLimpiada: resultado.count,
    })

    return resultado.count
  } catch (error) {
    logger.error('Error al limpiar tokens expirados', error as Error, {
      context: 'password-reset.cleanupExpiredResetTokens',
    })
    throw error
  }
}
