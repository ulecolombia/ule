/**
 * ULE - SENTRY CONFIGURATION
 * Error tracking y monitoring opcional
 */

export function initSentry() {
  // Sentry es opcional - solo se inicializa si existe la variable de entorno
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log('[Ule Sentry] Sentry habilitado')
    // La configuración real de Sentry está en sentry.server.config.js
  } else {
    console.log('[Ule Sentry] Sentry deshabilitado (no hay SENTRY_DSN)')
  }
}
