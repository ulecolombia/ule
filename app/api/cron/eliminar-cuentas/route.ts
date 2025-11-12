/**
 * CRON JOB - ELIMINAR CUENTAS PROGRAMADAS
 *
 * Ejecuta la eliminación de cuentas que completaron el periodo de gracia
 *
 * Configuración en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/eliminar-cuentas",
 *     "schedule": "0 2 * * *"  // Diario a las 2 AM
 *   }]
 * }
 *
 * Seguridad:
 * - Requiere CRON_SECRET para ejecutar
 * - Valida token en header de autorización
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  obtenerSolicitudesPendientes,
  ejecutarEliminacion,
} from '@/lib/privacy/account-deletion'
import { secureLogger } from '@/lib/security/secure-logger'

export const dynamic = 'force-dynamic'

/**
 * GET - Ejecutar eliminaciones programadas
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. VALIDAR TOKEN DE SEGURIDAD
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      secureLogger.error('CRON_SECRET no configurado')
      return NextResponse.json(
        { error: 'Configuración inválida' },
        { status: 500 }
      )
    }

    // Validar token
    if (authHeader !== `Bearer ${cronSecret}`) {
      secureLogger.warn('Intento de acceso no autorizado a cron job', {
        authHeader: authHeader ? 'presente' : 'ausente',
        ip: req.headers.get('x-forwarded-for'),
      })
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    secureLogger.info('Iniciando cron job de eliminación de cuentas')

    // 2. OBTENER SOLICITUDES PENDIENTES
    const solicitudes = await obtenerSolicitudesPendientes()

    if (solicitudes.length === 0) {
      secureLogger.info('No hay solicitudes pendientes de eliminación')
      return NextResponse.json({
        success: true,
        message: 'No hay solicitudes pendientes',
        procesadas: 0,
      })
    }

    secureLogger.info(
      `Encontradas ${solicitudes.length} solicitudes pendientes de eliminación`
    )

    // 3. PROCESAR CADA SOLICITUD
    const resultados = {
      exitosas: 0,
      fallidas: 0,
      errores: [] as Array<{ solicitudId: string; error: string }>,
    }

    for (const solicitud of solicitudes) {
      try {
        secureLogger.info('Procesando eliminación', {
          solicitudId: solicitud.id,
          userId: solicitud.userId,
          fechaEjecucion: solicitud.fechaEjecucion,
        })

        await ejecutarEliminacion(solicitud.id)

        resultados.exitosas++

        secureLogger.audit('Cuenta eliminada por cron job', {
          solicitudId: solicitud.id,
          userId: solicitud.userId,
        })
      } catch (error: any) {
        resultados.fallidas++
        resultados.errores.push({
          solicitudId: solicitud.id,
          error: error.message,
        })

        secureLogger.error('Error eliminando cuenta en cron job', error, {
          solicitudId: solicitud.id,
          userId: solicitud.userId,
        })
      }
    }

    // 4. RESUMEN
    const duracion = Date.now() - startTime

    secureLogger.audit('Cron job de eliminación completado', {
      total: solicitudes.length,
      exitosas: resultados.exitosas,
      fallidas: resultados.fallidas,
      duracion: `${duracion}ms`,
    })

    return NextResponse.json({
      success: true,
      message: 'Proceso de eliminación completado',
      total: solicitudes.length,
      exitosas: resultados.exitosas,
      fallidas: resultados.fallidas,
      errores: resultados.errores,
      duracion: `${duracion}ms`,
    })
  } catch (error) {
    secureLogger.error('Error fatal en cron job de eliminación', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Error ejecutando cron job',
      },
      { status: 500 }
    )
  }
}
