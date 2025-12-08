/**
 * API - DOWNLOAD EXPORTED DATA
 * Descarga segura de archivos de exportación de datos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { secureLogger } from '@/lib/security/secure-logger'
import { EstadoSolicitudPortabilidad } from '@prisma/client'

/**
 * GET - Descargar archivo de exportación
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const filename = params.filename

    // Validar formato de nombre de archivo (prevenir path traversal)
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      secureLogger.warn('Intento de acceso con filename sospechoso', {
        userId: session.user.id,
        filename,
      })
      return NextResponse.json(
        { error: 'Nombre de archivo inválido' },
        { status: 400 }
      )
    }

    // Verificar que el archivo pertenece al usuario y no ha expirado
    const solicitud = await db.solicitudPortabilidad.findFirst({
      where: {
        userId: session.user.id!,
        archivoUrl: {
          contains: filename,
        },
        estado: EstadoSolicitudPortabilidad.COMPLETADA,
      },
    })

    if (!solicitud) {
      secureLogger.warn('Intento de acceso a archivo no autorizado', {
        userId: session.user.id,
        filename,
      })
      return NextResponse.json(
        { error: 'Archivo no encontrado o no autorizado' },
        { status: 404 }
      )
    }

    // Verificar expiración
    if (solicitud.archivoExpira && new Date() > solicitud.archivoExpira) {
      secureLogger.info('Intento de descarga de archivo expirado', {
        userId: session.user.id,
        filename,
        expiro: solicitud.archivoExpira,
      })
      return NextResponse.json(
        { error: 'El archivo ha expirado' },
        { status: 410 } // Gone
      )
    }

    // Leer archivo del sistema de archivos
    const filepath = join(
      process.cwd(),
      'public',
      'exportaciones',
      session.user.id!,
      filename
    )

    let fileBuffer: Buffer
    try {
      fileBuffer = await readFile(filepath)
    } catch (error) {
      secureLogger.error('Error leyendo archivo de exportación', error, {
        userId: session.user.id,
        filename,
        filepath,
      })
      return NextResponse.json(
        { error: 'Error al leer el archivo' },
        { status: 500 }
      )
    }

    // Log de auditoría
    secureLogger.audit('Archivo de exportación descargado', {
      userId: session.user.id,
      solicitudId: solicitud.id,
      filename,
      tamanoBytes: fileBuffer.length,
    })

    // Retornar archivo
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')
    headers.set(
      'Content-Disposition',
      `attachment; filename="datos-personales-${new Date().toISOString().split('T')[0]}.json"`
    )
    headers.set('Content-Length', fileBuffer.length.toString())

    return new NextResponse(new Uint8Array(fileBuffer), { headers })
  } catch (error) {
    secureLogger.error('Error en API de descarga', error)
    return NextResponse.json(
      { error: 'Error al descargar archivo' },
      { status: 500 }
    )
  }
}
