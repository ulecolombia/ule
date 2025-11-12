/**
 * API ENDPOINT: REVOCAR TODAS LAS SESIONES (excepto la actual)
 *
 * POST /api/auth/sessions/revoke-all
 * Cierra todas las sesiones del usuario excepto la actual
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revokeAllOtherSessions } from '@/lib/security/session-manager'
import { logger } from '@/lib/logger'

// TODO: Reemplazar con autenticación real
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const userId = req.headers.get('x-user-id')
  return userId
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
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

    // Obtener token de sesión actual
    const currentToken =
      req.headers.get('authorization')?.replace('Bearer ', '') ||
      req.cookies.get('session')?.value

    if (!currentToken) {
      return NextResponse.json(
        { error: 'Token de sesión no encontrado' },
        { status: 400 }
      )
    }

    const cantidadRevocadas = await revokeAllOtherSessions(
      user.id,
      currentToken
    )

    logger.info('Todas las sesiones revocadas', {
      context: 'sessions.revoke-all',
      userId,
      cantidadRevocadas,
    })

    return NextResponse.json({
      success: true,
      message: `${cantidadRevocadas} sesión(es) cerrada(s) exitosamente`,
      sesionesRevocadas: cantidadRevocadas,
    })
  } catch (error) {
    logger.error('Error revocando sesiones', error as Error, {
      context: 'sessions.revoke-all',
    })

    return NextResponse.json(
      { error: 'Error al cerrar sesiones' },
      { status: 500 }
    )
  }
}
