/**
 * CRON JOB: LIMPIAR DATOS DE ANALYTICS ANTIGUOS
 * Implementa política de retención de datos para analytics
 *
 * Política de retención:
 * - Eventos de analytics: 90 días
 * - Errores de aplicación: 30 días
 * - Métricas diarias: 365 días (1 año)
 *
 * Ejecutar diariamente a las 3:00 AM
 * Vercel Cron: 0 3 * * *
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { acquireLock, releaseLock } from '@/lib/distributed-lock'
import { subDays } from 'date-fns'

const LOCK_ID = 'cron:limpiar-analytics'
const LOCK_TIMEOUT = 10 * 60 * 1000 // 10 minutos

// Política de retención (en días)
const RETENTION_POLICY = {
  eventos: 90, // 90 días para eventos
  errores: 30, // 30 días para errores
  metricas: 365, // 1 año para métricas diarias
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel: máximo 60 segundos en Hobby plan

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  // Verificar autorización (clave secreta de Vercel Cron)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron Limpiar Analytics] Acceso no autorizado')
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let lockAcquired = false

  try {
    // Intentar adquirir lock distribuido
    lockAcquired = await acquireLock(LOCK_ID, LOCK_TIMEOUT)

    if (!lockAcquired) {
      console.log(
        '[Cron Limpiar Analytics] Ya hay una ejecución en curso, saltando...'
      )
      return NextResponse.json({
        message: 'Job ya en ejecución',
        skipped: true,
      })
    }

    console.log('[Cron Limpiar Analytics] Iniciando limpieza...')

    // Calcular fechas de corte
    const fechaCorteEventos = subDays(new Date(), RETENTION_POLICY.eventos)
    const fechaCorteErrores = subDays(new Date(), RETENTION_POLICY.errores)
    const fechaCorteMetricas = subDays(new Date(), RETENTION_POLICY.metricas)

    console.log('[Cron Limpiar Analytics] Fechas de corte:')
    console.log(`  - Eventos: ${fechaCorteEventos.toISOString()}`)
    console.log(`  - Errores: ${fechaCorteErrores.toISOString()}`)
    console.log(`  - Métricas: ${fechaCorteMetricas.toISOString()}`)

    // ==========================================
    // 1. LIMPIAR EVENTOS ANTIGUOS
    // ==========================================
    const eventosEliminados = await prisma.analyticsEvento.deleteMany({
      where: {
        timestamp: {
          lt: fechaCorteEventos,
        },
      },
    })

    console.log(
      `[Cron Limpiar Analytics] Eventos eliminados: ${eventosEliminados.count}`
    )

    // ==========================================
    // 2. LIMPIAR ERRORES ANTIGUOS
    // ==========================================
    const erroresEliminados = await prisma.analyticsError.deleteMany({
      where: {
        timestamp: {
          lt: fechaCorteErrores,
        },
      },
    })

    console.log(
      `[Cron Limpiar Analytics] Errores eliminados: ${erroresEliminados.count}`
    )

    // ==========================================
    // 3. LIMPIAR MÉTRICAS DIARIAS ANTIGUAS
    // ==========================================
    const metricasEliminadas = await prisma.analyticsDiario.deleteMany({
      where: {
        fecha: {
          lt: fechaCorteMetricas,
        },
      },
    })

    console.log(
      `[Cron Limpiar Analytics] Métricas diarias eliminadas: ${metricasEliminadas.count}`
    )

    // ==========================================
    // 4. CALCULAR ESPACIO LIBERADO (ESTIMADO)
    // ==========================================
    // Estimación aproximada:
    // - Evento: ~500 bytes (metadata JSON)
    // - Error: ~2KB (stack trace)
    // - Métrica diaria: ~200 bytes
    const espacioLiberadoMB =
      (eventosEliminados.count * 0.5 +
        erroresEliminados.count * 2 +
        metricasEliminadas.count * 0.2) /
      1024

    const duration = Date.now() - startTime

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      duracionMs: duration,
      politicaRetencion: RETENTION_POLICY,
      estadisticas: {
        eventosEliminados: eventosEliminados.count,
        erroresEliminados: erroresEliminados.count,
        metricasEliminadas: metricasEliminadas.count,
        totalRegistrosEliminados:
          eventosEliminados.count +
          erroresEliminados.count +
          metricasEliminadas.count,
        espacioLiberadoEstimadoMB: Math.round(espacioLiberadoMB * 100) / 100,
      },
    }

    console.log('[Cron Limpiar Analytics] Completado:', resultado)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('[Cron Limpiar Analytics] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al limpiar analytics',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  } finally {
    // Liberar lock
    if (lockAcquired) {
      await releaseLock(LOCK_ID)
    }
  }
}
