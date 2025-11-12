/**
 * ULE - LOGGER ESTRUCTURADO
 * Sistema de logging centralizado con niveles y metadata
 * FIX: Reemplaza console.log con logging apropiado para producción
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  meta?: Record<string, any>
  error?: Error
  context?: string
}

class Logger {
  private isDevelopment: boolean
  private isProduction: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  /**
   * Formatea el timestamp en formato ISO
   */
  private getTimestamp(): string {
    return new Date().toISOString()
  }

  /**
   * Envía logs a servicio externo en producción (Sentry, Datadog, etc)
   */
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // En producción, enviar a servicio de logging
    if (this.isProduction) {
      try {
        // Ejemplo con Sentry
        if (entry.level === 'error' || entry.level === 'fatal') {
          // TODO: Integrar con Sentry cuando esté configurado
          // Sentry.captureException(entry.error || new Error(entry.message), {
          //   level: entry.level,
          //   extra: entry.meta,
          //   contexts: { context: entry.context },
          // })
        }

        // TODO: Integrar con servicio de logs (Datadog, LogRocket, etc)
        // await fetch('https://logs-api.example.com', {
        //   method: 'POST',
        //   body: JSON.stringify(entry),
        // })
      } catch (error) {
        // Fallback: log error de logging
        console.error('[Logger] Failed to send log:', error)
      }
    }
  }

  /**
   * Método interno de logging
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      meta,
      error,
    }

    // En desarrollo: console output colorizado
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m', // Green
        warn: '\x1b[33m', // Yellow
        error: '\x1b[31m', // Red
        fatal: '\x1b[35m', // Magenta
      }
      const reset = '\x1b[0m'
      const color = colors[level]

      console.log(
        `${color}[${level.toUpperCase()}]${reset} ${entry.timestamp} - ${message}`,
        meta ? meta : '',
        error ? error : ''
      )
    }

    // En producción: JSON estructurado
    if (this.isProduction) {
      console.log(JSON.stringify(entry))
      this.sendToExternalService(entry)
    }
  }

  /**
   * Log de debug (solo en desarrollo)
   */
  debug(message: string, meta?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.log('debug', message, meta)
    }
  }

  /**
   * Log de información general
   */
  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta)
  }

  /**
   * Log de advertencia
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta)
  }

  /**
   * Log de error
   */
  error(message: string, error?: Error, meta?: Record<string, any>): void {
    this.log('error', message, meta, error)
  }

  /**
   * Log de error fatal (crash de aplicación)
   */
  fatal(message: string, error?: Error, meta?: Record<string, any>): void {
    this.log('fatal', message, meta, error)
  }

  /**
   * Crea un logger con contexto específico
   */
  withContext(context: string) {
    return {
      debug: (message: string, meta?: Record<string, any>) =>
        this.debug(`[${context}] ${message}`, meta),
      info: (message: string, meta?: Record<string, any>) =>
        this.info(`[${context}] ${message}`, meta),
      warn: (message: string, meta?: Record<string, any>) =>
        this.warn(`[${context}] ${message}`, meta),
      error: (message: string, error?: Error, meta?: Record<string, any>) =>
        this.error(`[${context}] ${message}`, error, meta),
      fatal: (message: string, error?: Error, meta?: Record<string, any>) =>
        this.fatal(`[${context}] ${message}`, error, meta),
    }
  }
}

// Exportar instancia singleton
export const logger = new Logger()

// Loggers con contexto pre-configurados
export const emailLogger = logger.withContext('Email Service')
export const apiLogger = logger.withContext('API')
export const dbLogger = logger.withContext('Database')
export const authLogger = logger.withContext('Auth')
