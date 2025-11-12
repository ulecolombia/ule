/**
 * CRON JOB: LIMPIAR EXPORTACIONES EXPIRADAS
 * Elimina archivos y registros de exportaciones vencidas (24h)
 *
 * Ejecutar diariamente a las 2:00 AM
 * Vercel Cron: 0 2 * * *
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { acquireLock, releaseLock } from '@/lib/distributed-lock'
import fs from 'fs'
import path from 'path'

const LOCK_ID = 'cron:limpiar-exportaciones'
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
    console.error('[Cron Limpiar Exportaciones] Acceso no autorizado')
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    )
  }

  let lockAcquired = false

  try {
    // Intentar adquirir lock distribuido
    lockAcquired = await acquireLock(LOCK_ID, LOCK_TIMEOUT)

    if (!lockAcquired) {
      console.log('[Cron Limpiar Exportaciones] Ya hay una ejecución en curso, saltando...')
      return NextResponse.json({
        message: 'Job ya en ejecución',
        skipped: true,
      })
    }

    console.log('[Cron Limpiar Exportaciones] Iniciando limpieza...')

    // Buscar exportaciones expiradas
    const exportacionesExpiradas = await prisma.exportacion.findMany({
      where: {
        expiraEn: {
          lt: new Date(), // Menor que ahora = expiradas
        },
      },
    })

    console.log(
      `[Cron Limpiar Exportaciones] Encontradas ${exportacionesExpiradas.length} exportaciones expiradas`
    )

    const exportsDir = path.join(process.cwd(), 'public', 'exports')
    let archivosEliminados = 0
    let erroresArchivos = 0
    let registrosEliminados = 0

    // Eliminar archivos físicos y registros de base de datos
    for (const exportacion of exportacionesExpiradas) {
      try {
        // Construir ruta completa del archivo
        const filePath = path.join(exportsDir, exportacion.nombreArchivo)

        // Verificar si el archivo existe y eliminarlo
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          archivosEliminados++
          console.log(
            `[Cron Limpiar Exportaciones] Archivo eliminado: ${exportacion.nombreArchivo}`
          )
        }

        // Eliminar registro de base de datos
        await prisma.exportacion.delete({
          where: { id: exportacion.id },
        })
        registrosEliminados++
      } catch (error) {
        console.error(
          `[Cron Limpiar Exportaciones] Error al eliminar exportación ${exportacion.id}:`,
          error
        )
        erroresArchivos++
      }
    }

    const duration = Date.now() - startTime

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      duracionMs: duration,
      estadisticas: {
        exportacionesExpiradas: exportacionesExpiradas.length,
        archivosEliminados,
        registrosEliminados,
        errores: erroresArchivos,
      },
    }

    console.log('[Cron Limpiar Exportaciones] Completado:', resultado)

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('[Cron Limpiar Exportaciones] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al limpiar exportaciones',
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
