/**
 * ULE - SISTEMA DE LOGGING ESTRUCTURADO
 * Logger centralizado para mejor debugging y monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    message: string
    stack?: string
    name?: string
  }
}

class Logger {
  private isDevelopment: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry, null, this.isDevelopment ? 2 : 0)
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    }

    const formatted = this.formatLog(entry)

    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formatted)
        break
      case 'info':
        console.log(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }
  }

  /**
   * Log de debugging (solo en desarrollo)
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  /**
   * Log informativo
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  /**
   * Log de advertencia
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  /**
   * Log de error con información estructurada
   */
  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
    }

    // Si el segundo parámetro es un Error
    if (errorOrContext instanceof Error) {
      entry.error = {
        message: errorOrContext.message,
        stack: errorOrContext.stack,
        name: errorOrContext.name,
      }
      if (context) {
        entry.context = context
      }
    } else if (errorOrContext) {
      // Si es un objeto de contexto
      entry.context = errorOrContext
    }

    console.error(this.formatLog(entry))
  }

  /**
   * Log de operación de API
   */
  api(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ) {
    this.info(`API ${method} ${path}`, {
      method,
      path,
      statusCode,
      duration,
      ...context,
    })
  }

  /**
   * Log de operación de base de datos
   */
  db(operation: string, table: string, duration: number, context?: LogContext) {
    this.debug(`DB ${operation} ${table}`, {
      operation,
      table,
      duration,
      ...context,
    })
  }

  /**
   * Log de llamada externa (IA, APIs externas, etc.)
   */
  external(
    service: string,
    operation: string,
    duration: number,
    context?: LogContext
  ) {
    this.info(`External ${service} ${operation}`, {
      service,
      operation,
      duration,
      ...context,
    })
  }

  /**
   * Log de evento de usuario
   */
  userEvent(
    userId: string,
    event: string,
    context?: LogContext
  ) {
    this.info(`User Event: ${event}`, {
      userId,
      event,
      ...context,
    })
  }

  /**
   * Log de seguridad
   */
  security(event: string, context?: LogContext) {
    this.warn(`Security: ${event}`, {
      event,
      ...context,
    })
  }
}

// Singleton
export const logger = new Logger()

/**
 * Helper para medir tiempo de ejecución
 */
export function createTimer() {
  const start = Date.now()
  return {
    end: () => Date.now() - start,
  }
}

/**
 * Decorator para logging automático de funciones
 */
export function withLogging<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string
): T {
  return ((...args: unknown[]) => {
    const timer = createTimer()
    logger.debug(`Starting ${name}`, { args })

    try {
      const result = fn(...args)

      // Si es una promesa, esperar y loggear resultado
      if (result instanceof Promise) {
        return result
          .then((value) => {
            logger.debug(`Completed ${name}`, {
              duration: timer.end(),
              success: true,
            })
            return value
          })
          .catch((error) => {
            logger.error(`Failed ${name}`, error, {
              duration: timer.end(),
            })
            throw error
          })
      }

      // Si es síncrona
      logger.debug(`Completed ${name}`, {
        duration: timer.end(),
        success: true,
      })
      return result
    } catch (error) {
      logger.error(`Failed ${name}`, error as Error, {
        duration: timer.end(),
      })
      throw error
    }
  }) as T
}
