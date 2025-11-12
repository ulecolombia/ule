/**
 * SISTEMA DE RATE LIMITING CON UPSTASH REDIS
 *
 * Protege contra ataques de fuerza bruta, credential stuffing y abuso de API
 * Implementa múltiples capas de rate limiting según el tipo de operación
 *
 * Cumplimiento OWASP: A07:2021 - Identification and Authentication Failures
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'

// Detectar si Upstash está configurado
const isUpstashConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_URL !== 'https://your-redis-url.upstash.io'
)

if (!isUpstashConfigured) {
  console.warn('⚠️  Upstash Redis no configurado - Usando modo MOCK para desarrollo')
  console.warn('⚠️  Rate limiting está DESHABILITADO')
  console.warn('⚠️  Configura Upstash para habilitar rate limiting:')
  console.warn('    1. Crear cuenta en https://upstash.com')
  console.warn('    2. Agregar UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN a .env')
}

// Instancia de Redis (singleton) - solo si está configurado
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Mock para desarrollo sin Upstash
const createMockRateLimit = () => ({
  limit: async (identifier: string) => ({
    success: true,
    limit: 999,
    remaining: 999,
    reset: Date.now() + 60000,
    pending: Promise.resolve(),
  }),
})

/**
 * Rate limiter para intentos de login
 * Limita por email + IP para prevenir ataques de fuerza bruta
 *
 * Límite: 5 intentos por 15 minutos
 */
export const loginRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:login',
    })
  : createMockRateLimit()

/**
 * Rate limiter más estricto para IPs sospechosas
 * Se activa cuando se detectan múltiples intentos fallidos
 *
 * Límite: 2 intentos por 30 minutos
 */
export const suspiciousIPRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, '30 m'),
      analytics: true,
      prefix: 'ratelimit:suspicious',
    })
  : createMockRateLimit()

/**
 * Rate limiter para recuperación de contraseña
 * Limita solicitudes de reset de contraseña
 *
 * Límite: 3 intentos por hora
 */
export const passwordResetRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '60 m'),
      analytics: true,
      prefix: 'ratelimit:password_reset',
    })
  : createMockRateLimit()

/**
 * Rate limiter para verificación de 2FA
 * Limita intentos de códigos 2FA
 *
 * Límite: 5 intentos por 10 minutos
 */
export const twoFactorRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      analytics: true,
      prefix: 'ratelimit:2fa',
    })
  : createMockRateLimit()

/**
 * Rate limiter para registro de nuevas cuentas
 * Previene registro masivo de cuentas falsas
 *
 * Límite: 3 registros por hora por IP
 */
export const registrationRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '60 m'),
      analytics: true,
      prefix: 'ratelimit:registration',
    })
  : createMockRateLimit()

/**
 * Rate limiter general para API endpoints
 * Protección global contra abuso de API
 *
 * Límite: 100 requests por minuto
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : createMockRateLimit()

/**
 * Rate limiter para endpoints de consulta IA
 * Limita uso de servicios de IA que pueden ser costosos
 *
 * Límite: 20 consultas por hora (usuarios free)
 */
export const aiConsultaRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '60 m'),
      analytics: true,
      prefix: 'ratelimit:ia_consulta',
    })
  : createMockRateLimit()

/**
 * Tipos de resultado de rate limiting
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // timestamp en ms
  blocked: boolean
}

/**
 * Verifica rate limit para intentos de login
 *
 * @param identifier - Email + IP (ej: "user@example.com:192.168.1.1")
 * @returns Resultado del rate limit
 *
 * @example
 * ```ts
 * const identifier = `${email}:${ip}`
 * const result = await checkLoginRateLimit(identifier)
 *
 * if (!result.success) {
 *   throw new Error(`Demasiados intentos. Intenta de nuevo en ${Math.ceil((result.reset - Date.now()) / 60000)} minutos`)
 * }
 * ```
 */
export async function checkLoginRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await loginRateLimit.limit(identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      blocked: !result.success,
    }
  } catch (error) {
    logger.error('Error al verificar rate limit de login', error as Error, {
      context: 'rate-limit.checkLoginRateLimit',
      identifier,
    })

    // En caso de error, permitir la operación (fail open)
    // pero registrar el error para investigación
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      blocked: false,
    }
  }
}

/**
 * Verifica rate limit para IP sospechosa
 *
 * @param ip - Dirección IP
 * @returns Resultado del rate limit
 *
 * @example
 * ```ts
 * const result = await checkSuspiciousIPRateLimit(ip)
 *
 * if (!result.success) {
 *   // Bloquear completamente
 *   await logSecurityEvent({
 *     type: 'IP_SOSPECHOSA',
 *     severity: 'ALTA',
 *     ip
 *   })
 * }
 * ```
 */
export async function checkSuspiciousIPRateLimit(
  ip: string
): Promise<RateLimitResult> {
  try {
    const result = await suspiciousIPRateLimit.limit(ip)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      blocked: !result.success,
    }
  } catch (error) {
    logger.error('Error al verificar rate limit de IP sospechosa', error as Error, {
      context: 'rate-limit.checkSuspiciousIPRateLimit',
      ip,
    })

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      blocked: false,
    }
  }
}

/**
 * Verifica rate limit para recuperación de contraseña
 *
 * @param identifier - Email o IP
 * @returns Resultado del rate limit
 */
export async function checkPasswordResetRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await passwordResetRateLimit.limit(identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      blocked: !result.success,
    }
  } catch (error) {
    logger.error('Error al verificar rate limit de reset password', error as Error, {
      context: 'rate-limit.checkPasswordResetRateLimit',
      identifier,
    })

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      blocked: false,
    }
  }
}

/**
 * Verifica rate limit para verificación 2FA
 *
 * @param identifier - User ID + sesión
 * @returns Resultado del rate limit
 */
export async function checkTwoFactorRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await twoFactorRateLimit.limit(identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      blocked: !result.success,
    }
  } catch (error) {
    logger.error('Error al verificar rate limit de 2FA', error as Error, {
      context: 'rate-limit.checkTwoFactorRateLimit',
      identifier,
    })

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      blocked: false,
    }
  }
}

/**
 * Verifica rate limit para registro de cuentas
 *
 * @param ip - Dirección IP
 * @returns Resultado del rate limit
 */
export async function checkRegistrationRateLimit(
  ip: string
): Promise<RateLimitResult> {
  try {
    const result = await registrationRateLimit.limit(ip)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      blocked: !result.success,
    }
  } catch (error) {
    logger.error('Error al verificar rate limit de registro', error as Error, {
      context: 'rate-limit.checkRegistrationRateLimit',
      ip,
    })

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      blocked: false,
    }
  }
}

/**
 * Verifica rate limit general de API
 *
 * @param identifier - User ID o IP
 * @returns Resultado del rate limit
 */
export async function checkAPIRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  try {
    const result = await apiRateLimit.limit(identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      blocked: !result.success,
    }
  } catch (error) {
    logger.error('Error al verificar rate limit de API', error as Error, {
      context: 'rate-limit.checkAPIRateLimit',
      identifier,
    })

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      blocked: false,
    }
  }
}

/**
 * Verifica rate limit para consultas de IA
 *
 * @param userId - ID del usuario
 * @returns Resultado del rate limit
 */
export async function checkAIConsultaRateLimit(
  userId: string
): Promise<RateLimitResult> {
  try {
    const result = await aiConsultaRateLimit.limit(userId)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      blocked: !result.success,
    }
  } catch (error) {
    logger.error('Error al verificar rate limit de IA', error as Error, {
      context: 'rate-limit.checkAIConsultaRateLimit',
      userId,
    })

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
      blocked: false,
    }
  }
}

/**
 * Resetea el contador de rate limit para un identificador
 * (Útil para limpiar después de login exitoso)
 *
 * @param prefix - Prefijo del rate limiter (ej: 'ratelimit:login')
 * @param identifier - Identificador único
 */
export async function resetRateLimit(
  prefix: string,
  identifier: string
): Promise<void> {
  try {
    const key = `${prefix}:${identifier}`
    await redis.del(key)

    logger.info('Rate limit reseteado', {
      context: 'rate-limit.resetRateLimit',
      prefix,
      identifier,
    })
  } catch (error) {
    logger.error('Error al resetear rate limit', error as Error, {
      context: 'rate-limit.resetRateLimit',
      prefix,
      identifier,
    })
  }
}

/**
 * Marca una IP como sospechosa (activa rate limiting más estricto)
 *
 * @param ip - Dirección IP
 * @param reason - Razón del marcado
 * @param durationMinutes - Duración en minutos (default: 60)
 */
export async function markIPAsSuspicious(
  ip: string,
  reason: string,
  durationMinutes: number = 60
): Promise<void> {
  try {
    const key = `suspicious_ip:${ip}`
    const expirySeconds = durationMinutes * 60

    await redis.setex(key, expirySeconds, JSON.stringify({ reason, timestamp: Date.now() }))

    logger.warn('IP marcada como sospechosa', {
      context: 'rate-limit.markIPAsSuspicious',
      ip,
      reason,
      durationMinutes,
    })
  } catch (error) {
    logger.error('Error al marcar IP como sospechosa', error as Error, {
      context: 'rate-limit.markIPAsSuspicious',
      ip,
      reason,
    })
  }
}

/**
 * Verifica si una IP está marcada como sospechosa
 *
 * @param ip - Dirección IP
 * @returns true si la IP está marcada como sospechosa
 */
export async function isIPSuspicious(ip: string): Promise<boolean> {
  try {
    const key = `suspicious_ip:${ip}`
    const result = await redis.get(key)

    return result !== null
  } catch (error) {
    logger.error('Error al verificar IP sospechosa', error as Error, {
      context: 'rate-limit.isIPSuspicious',
      ip,
    })

    return false // Fail open en caso de error
  }
}

/**
 * Obtiene el tiempo restante hasta que se resetee el rate limit
 *
 * @param reset - Timestamp de reset (en ms)
 * @returns Objeto con minutos y segundos restantes
 */
export function getTimeUntilReset(reset: number): { minutes: number; seconds: number } {
  const now = Date.now()
  const diff = Math.max(0, reset - now)
  const totalSeconds = Math.ceil(diff / 1000)

  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  }
}

/**
 * Formatea un mensaje de error de rate limit para el usuario
 *
 * @param result - Resultado del rate limit
 * @param action - Acción que se intentó realizar (ej: "login", "recuperación de contraseña")
 * @returns Mensaje formateado
 */
export function formatRateLimitError(result: RateLimitResult, action: string): string {
  const { minutes, seconds } = getTimeUntilReset(result.reset)

  let timeMessage: string
  if (minutes > 0) {
    timeMessage = `${minutes} minuto${minutes > 1 ? 's' : ''}`
    if (seconds > 0) {
      timeMessage += ` y ${seconds} segundo${seconds > 1 ? 's' : ''}`
    }
  } else {
    timeMessage = `${seconds} segundo${seconds > 1 ? 's' : ''}`
  }

  return `Demasiados intentos de ${action}. Por favor, intenta de nuevo en ${timeMessage}.`
}
