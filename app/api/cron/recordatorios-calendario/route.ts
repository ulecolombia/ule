/**
 * CRON JOB: RECORDATORIOS DE CALENDARIO
 * Procesa y envía recordatorios de eventos próximos (7, 3, 1 días antes)
 *
 * Ejecutar diariamente a las 9:00 AM
 * Vercel Cron: 0 9 * * *
 */

import { NextRequest, NextResponse } from 'next/server'
import { procesarRecordatorios } from '@/lib/services/calendario-service'
import { acquireLock, releaseLock } from '@/lib/distributed-lock'

const LOCK_ID = 'cron:recordatorios-calendario'
const LOCK_TIMEOUT = 5 * 60 * 1000 // 5 minutos

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Vercel: máximo 60 segundos en Hobby plan

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  // Verificar autorización (clave secreta de Vercel Cron)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron Recordatorios Calendario] Acceso no autorizado')
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let lockAcquired = false

  try {
    // Intentar adquirir lock distribuido
    lockAcquired = await acquireLock(LOCK_ID, LOCK_TIMEOUT)

    if (!lockAcquired) {
      console.log(
        '[Cron Recordatorios Calendario] Ya hay una ejecución en curso, saltando...'
      )
      return NextResponse.json({
        message: 'Job ya en ejecución',
        skipped: true,
      })
    }

    console.log('[Cron Recordatorios Calendario] Iniciando procesamiento...')

    // Procesar recordatorios
    await procesarRecordatorios()

    const duration = Date.now() - startTime

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      duracionMs: duration,
    }

    console.log('[Cron Recordatorios Calendario] Completado:', resultado)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('[Cron Recordatorios Calendario] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar recordatorios',
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
