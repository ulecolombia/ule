/**
 * CRON JOB: LIMPIEZA DE SESIONES EXPIRADAS
 *
 * Características:
 * - Elimina sesiones expiradas y revocadas antiguas
 * - Se ejecuta diariamente a las 3:00 AM
 * - Mantiene la base de datos limpia
 * - Registra eventos de limpieza
 *
 * Configuración:
 * - Vercel Cron: Usar /app/api/cron/cleanup-sessions/route.ts
 * - Node Cron: Usar este archivo directamente
 * - Heroku Scheduler: Ejecutar como script
 *
 * Uso:
 *   node -r ts-node/register lib/cron/cleanup-sessions.ts
 */

import { cleanupExpiredSessions } from '@/lib/security/session-manager'
import { logger } from '@/lib/logger'

/**
 * Ejecutar limpieza de sesiones
 * Diariamente a las 3:00 AM
 */
export async function ejecutarLimpiezaSesiones() {
  const startTime = Date.now()

  logger.info('Iniciando limpieza de sesiones expiradas', {
    context: 'cron.cleanup-sessions',
  })

  try {
    const cantidadEliminadas = await cleanupExpiredSessions()

    const duration = Date.now() - startTime

    logger.info('Limpieza de sesiones completada', {
      context: 'cron.cleanup-sessions',
      cantidadEliminadas,
      duracionMs: duration,
    })

    console.log(`✅ ${cantidadEliminadas} sesión(es) eliminada(s) en ${duration}ms`)

    return {
      success: true,
      cantidadEliminadas,
      duracionMs: duration,
    }
  } catch (error) {
    logger.error('Error en limpieza de sesiones', error as Error, {
      context: 'cron.cleanup-sessions',
    })

    console.error('❌ Error en limpieza de sesiones:', error)

    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

// Si se ejecuta directamente (no como módulo importado)
if (require.main === module) {
  ejecutarLimpiezaSesiones()
    .then((result) => {
      console.log('Resultado:', result)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error('Error fatal:', error)
      process.exit(1)
    })
}
