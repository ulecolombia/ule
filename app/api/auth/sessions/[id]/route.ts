/**
 * API ENDPOINT: REVOCAR SESIÓN ESPECÍFICA
 *
 * DELETE /api/auth/sessions/[id]
 * Revoca (cierra) una sesión específica del usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revokeSession } from '@/lib/security/session-manager'
import { logger } from '@/lib/logger'

// TODO: Reemplazar con autenticación real
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const userId = req.headers.get('x-user-id')
  return userId
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    await revokeSession(params.id, user.id)

    logger.info('Sesión revocada', {
      context: 'sessions.revoke',
      userId,
      sesionId: params.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    })
  } catch (error) {
    logger.error('Error revocando sesión', error as Error, {
      context: 'sessions.revoke',
      sesionId: params.id,
    })

    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
