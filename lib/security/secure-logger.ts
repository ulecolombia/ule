import pino from 'pino'

/**
 * Logger seguro que filtra datos sensibles
 *
 * Cumplimiento:
 * - Ley 1581 de 2012: No exponer datos personales en logs
 * - OWASP: A09:2021 - Security Logging and Monitoring Failures
 */

// Campos sensibles a filtrar
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'numeroDocumento',
  'telefono',
  'twoFactorSecret',
  'twoFactorBackupCodes',
  'passwordResetToken',
  'creditCard',
  'cvv',
  'ssn',
  'authorization',
  'cookie',
]

/**
 * Filtrar datos sensibles de un objeto recursivamente
 */
function redactSensitiveData(obj: any, depth: number = 0): any {
  // Prevenir recursión infinita
  if (depth > 10) return '[Max Depth Reached]'

  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    // Si es un string largo, posiblemente sea sensitivo
    if (obj.length > 100) {
      return `[REDACTED_STRING_${obj.length}_CHARS]`
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1))
  }

  if (typeof obj === 'object') {
    const redacted: any = {}

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase()

      // Verificar si es un campo sensible
      const isSensitive = SENSITIVE_FIELDS.some((field) =>
        lowerKey.includes(field.toLowerCase())
      )

      if (isSensitive) {
        redacted[key] = '[REDACTED]'
      } else {
        redacted[key] = redactSensitiveData(value, depth + 1)
      }
    }

    return redacted
  }

  return obj
}

/**
 * Crear logger con redacción automática
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Configuración de formato
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    },
  },

  // Serializers personalizados
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      // NO incluir headers completos por seguridad
      userAgent: req.headers['user-agent'],
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },

  // Redactar campos sensibles
  redact: {
    paths: SENSITIVE_FIELDS,
    censor: '[REDACTED]',
  },

  // En producción, usar formato JSON
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
})

/**
 * Logger seguro con métodos auxiliares
 */
export const secureLogger = {
  /**
   * Log de información
   */
  info(message: string, data?: any) {
    logger.info(redactSensitiveData(data), message)
  },

  /**
   * Log de advertencia
   */
  warn(message: string, data?: any) {
    logger.warn(redactSensitiveData(data), message)
  },

  /**
   * Log de error
   */
  error(message: string, error?: any, data?: any) {
    const sanitizedError =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error

    logger.error(
      {
        error: sanitizedError,
        data: redactSensitiveData(data),
      },
      message
    )
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(redactSensitiveData(data), message)
    }
  },

  /**
   * Log de auditoría (sin redacción, pero en canal separado)
   */
  audit(message: string, data: any) {
    // En producción, enviar a servicio de auditoría separado
    logger.info(
      {
        audit: true,
        ...data,
      },
      `[AUDIT] ${message}`
    )
  },
}

/**
 * Middleware de logging para Next.js API routes
 */
export function logAPIRequest(req: any, res: any, startTime: number) {
  const duration = Date.now() - startTime

  secureLogger.info('API Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    userAgent: req.headers['user-agent'],
    // NO incluir IP completa por privacidad
    ipPrefix: req.headers['x-forwarded-for']?.split('.').slice(0, 2).join('.'),
  })
}
