/**
 * API ENDPOINT: GESTIÓN DE SESIONES DEL USUARIO
 *
 * GET /api/auth/sessions
 * Obtiene todas las sesiones activas del usuario autenticado
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserActiveSessions } from '@/lib/security/session-manager'
import { logger } from '@/lib/logger'

// TODO: Reemplazar con autenticación real
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const userId = req.headers.get('x-user-id')
  return userId
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const sesiones = await getUserActiveSessions(user.id)

    // Formatear respuesta
    const sesionesFormateadas = sesiones.map((s) => ({
      id: s.id,
      dispositivo: s.dispositivo,
      navegador: s.navegador,
      sistemaOperativo: s.sistemaOperativo,
      ip: s.ip,
      pais: s.pais,
      ciudad: s.ciudad,
      esActual: s.esActual,
      ultimaActividad: s.ultimaActividad,
      createdAt: s.createdAt,
    }))

    logger.info('Sesiones consultadas', {
      context: 'sessions.list',
      userId,
      totalSesiones: sesionesFormateadas.length,
    })

    return NextResponse.json({
      sesiones: sesionesFormateadas,
      total: sesionesFormateadas.length,
    })
  } catch (error) {
    logger.error('Error obteniendo sesiones', error as Error, {
      context: 'sessions.list',
    })

    return NextResponse.json(
      { error: 'Error al obtener sesiones' },
      { status: 500 }
    )
  }
}
