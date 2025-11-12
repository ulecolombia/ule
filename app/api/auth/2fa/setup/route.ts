/**
 * API ENDPOINT: SETUP DE 2FA (Autenticación de Dos Factores)
 *
 * Genera el secret, QR code y códigos de respaldo para configurar 2FA
 *
 * POST /api/auth/2fa/setup
 * Headers: Authorization: Bearer {token}
 * Response: { qrCode, secret, backupCodes }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTwoFactorSecret } from '@/lib/security/two-factor'
import { encrypt, encryptBackupCodes } from '@/lib/security/encryption'
import { logger } from '@/lib/logger'

// Función helper para obtener userId del token
// TODO: Implementar autenticación real con JWT o NextAuth
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  // Por ahora, simulamos con un header
  // En producción, validar JWT o usar NextAuth getServerSession
  const userId = req.headers.get('x-user-id')
  return userId
}

export async function POST(req: NextRequest) {
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

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA ya está habilitado' },
        { status: 400 }
      )
    }

    // Generar secret y QR code
    const setup = await generateTwoFactorSecret(user.email)

    // Encriptar secret para guardarlo en BD
    const encryptedSecret = encrypt(setup.manualEntryKey)
    const encryptedBackupCodes = encryptBackupCodes(setup.backupCodes)

    // Guardar temporalmente (sin habilitar aún)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: encryptedBackupCodes,
      },
    })

    logger.info('Setup de 2FA iniciado', {
      context: '2fa.setup',
      userId: user.id,
    })

    return NextResponse.json({
      qrCode: setup.qrCodeUrl,
      secret: setup.manualEntryKey, // Mostrar una vez para entrada manual
      backupCodes: setup.backupCodes, // Mostrar una vez para guardar
      message:
        'Escanea el código QR con tu app de autenticación (Google Authenticator, Authy, etc.)',
    })
  } catch (error) {
    logger.error('Error al configurar 2FA', error as Error, {
      context: '2fa.setup',
    })

    return NextResponse.json(
      { error: 'Error al configurar 2FA' },
      { status: 500 }
    )
  }
}
