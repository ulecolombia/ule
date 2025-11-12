/**
 * API ENDPOINT: COMPLETAR RESET DE CONTRASEÑA
 *
 * Valida el token y actualiza la contraseña del usuario
 *
 * POST /api/auth/password-reset/complete
 * Body: { token: string, newPassword: string }
 * Response: { success: boolean, message: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resetPassword } from '@/lib/security/password-reset'
import { validatePassword } from '@/lib/security/password-validator'
import { logger } from '@/lib/logger'

const completeSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, newPassword } = completeSchema.parse(body)

    // Validar fortaleza de la nueva contraseña
    const validation = validatePassword(newPassword)

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Contraseña demasiado débil',
          errors: validation.errors,
          warnings: validation.warnings,
          suggestions: validation.suggestions,
          score: validation.score,
        },
        { status: 400 }
      )
    }

    // Completar el reset
    const result = await resetPassword(token, newPassword)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    logger.info('Reset de contraseña completado exitosamente', {
      context: 'password-reset.complete',
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error al completar reset de contraseña', error as Error, {
      context: 'password-reset.complete',
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}
