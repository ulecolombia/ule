/**
 * API ENDPOINT: VERIFICAR Y ACTIVAR 2FA
 *
 * Verifica que el código TOTP ingresado sea correcto y activa 2FA
 *
 * POST /api/auth/2fa/verify
 * Headers: Authorization: Bearer {token}
 * Body: { code: string }
 * Response: { success: boolean, message: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyTwoFactorToken } from '@/lib/security/two-factor'
import { decrypt } from '@/lib/security/encryption'
import { logger } from '@/lib/logger'

// Función helper para obtener userId del token
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const userId = req.headers.get('x-user-id')
  return userId
}

const verifySchema = z.object({
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
})

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)

    if (!userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { code } = verifySchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: 'Configuración 2FA no iniciada' },
        { status: 400 }
      )
    }

    // Desencriptar secret y verificar código
    const secret = decrypt(user.twoFactorSecret)
    const isValid = verifyTwoFactorToken(secret, code)

    if (!isValid) {
      logger.warn('Código 2FA incorrecto al activar', {
        context: '2fa.verify',
        userId: user.id,
      })

      return NextResponse.json(
        { error: 'Código 2FA incorrecto' },
        { status: 401 }
      )
    }

    // Activar 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorEnabledAt: new Date(),
      },
    })

    // Registrar evento
    await prisma.eventoSeguridad.create({
      data: {
        userId: user.id,
        tipo: 'TWO_FACTOR_HABILITADO',
        descripcion: '2FA habilitado exitosamente',
        severidad: 'ALTA',
      },
    })

    logger.info('2FA activado exitosamente', {
      context: '2fa.verify',
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      message:
        '2FA habilitado exitosamente. Guarda los códigos de respaldo en un lugar seguro',
    })
  } catch (error) {
    logger.error('Error al activar 2FA', error as Error, {
      context: '2fa.verify',
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Código inválido', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al activar 2FA' },
      { status: 500 }
    )
  }
}
