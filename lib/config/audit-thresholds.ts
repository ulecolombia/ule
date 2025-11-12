/**
 * CONFIGURACIÓN CENTRALIZADA DE UMBRALES DE ALERTAS
 * ✅ ALTO #13 RESUELTO: Configuración en lugar de valores hardcodeados
 *
 * Estos umbrales determinan cuándo se generan alertas de seguridad
 */

export const ALERT_THRESHOLDS = {
  /**
   * Múltiples intentos de login fallidos
   */
  LOGIN_FAILURES: {
    count: 5, // Número de intentos fallidos
    windowMinutes: 15, // Ventana de tiempo en minutos
    severidad: 'ALTA' as const,
  },

  /**
   * Múltiples cambios en perfil/seguridad
   */
  PROFILE_CHANGES: {
    count: 5,
    windowMinutes: 10,
    severidad: 'ALTA' as const,
  },

  /**
   * Descarga masiva de archivos
   */
  DOWNLOADS: {
    count: 10,
    windowMinutes: 5,
    severidad: 'ALTA' as const,
  },

  /**
   * Acceso en horario inusual
   */
  UNUSUAL_HOURS: {
    startHour: 2, // 2 AM
    endHour: 5, // 5 AM
    severidad: 'BAJA' as const,
  },

  /**
   * Ubicación inusual
   */
  UNUSUAL_LOCATION: {
    checkLastNLogins: 10, // Revisar últimos N logins
    daysToCheck: 30, // En los últimos N días
    severidad: 'MEDIA' as const,
  },

  /**
   * Máximos de logIds por alerta
   */
  MAX_LOG_IDS_PER_ALERT: 100,

  /**
   * Contador para incrementar severidad
   */
  SEVERITY_ESCALATION: {
    // Si una alerta se repite N veces, aumentar severidad
    repeatThreshold: 3,
  },
} as const

/**
 * Obtener umbral dinámicamente (útil para futuras implementaciones con DB)
 */
export function getThreshold(key: keyof typeof ALERT_THRESHOLDS) {
  return ALERT_THRESHOLDS[key]
}

/**
 * Validar si un contador excede el umbral
 */
export function exceedsThreshold(
  count: number,
  threshold: typeof ALERT_THRESHOLDS.LOGIN_FAILURES
): boolean {
  return count >= threshold.count
}

/**
 * Calcular ventana de tiempo en milisegundos
 */
export function getTimeWindow(minutes: number): number {
  return minutes * 60 * 1000
}
