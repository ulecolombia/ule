/**
 * API - DATA PORTABILITY
 * Exportación de datos personales según Ley 1581 de 2012
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  solicitarExportacion,
  obtenerEstadoExportacion,
  listarExportaciones,
} from '@/lib/privacy/data-portability'
import { secureLogger } from '@/lib/security/secure-logger'

/**
 * GET - Listar exportaciones del usuario u obtener estado de una específica
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const solicitudId = searchParams.get('id')

    // Si se solicita una exportación específica
    if (solicitudId) {
      const estado = await obtenerEstadoExportacion(solicitudId)
      return NextResponse.json({ exportacion: estado })
    }

    // Listar todas las exportaciones
    const exportaciones = await listarExportaciones(session.user.id!)

    return NextResponse.json({ exportaciones })
  } catch (error) {
    secureLogger.error('Error en GET /api/privacy/export', error)
    return NextResponse.json(
      { error: 'Error al obtener exportaciones' },
      { status: 500 }
    )
  }
}

/**
 * POST - Solicitar nueva exportación de datos
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const solicitudId = await solicitarExportacion(session.user.id!, ipAddress)

    return NextResponse.json({
      success: true,
      message: 'Solicitud de exportación creada',
      solicitudId,
    })
  } catch (error: any) {
    secureLogger.error('Error en POST /api/privacy/export', error)

    return NextResponse.json(
      { error: error.message || 'Error al solicitar exportación' },
      { status: 500 }
    )
  }
}
