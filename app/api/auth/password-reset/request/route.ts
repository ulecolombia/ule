/**
 * API ENDPOINT: SOLICITAR RESET DE CONTRASEÑA
 *
 * Envía email con link de recuperación de contraseña
 *
 * POST /api/auth/password-reset/request
 * Body: { email: string }
 * Response: { success: boolean, message: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requestPasswordReset } from '@/lib/security/password-reset'
import {
  checkPasswordResetRateLimit,
  formatRateLimitError,
} from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'

const requestSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = requestSchema.parse(body)

    // Rate limiting por email
    const rateLimit = await checkPasswordResetRateLimit(email.toLowerCase())

    if (!rateLimit.success) {
      const errorMessage = formatRateLimitError(
        rateLimit,
        'recuperación de contraseña'
      )

      logger.warn('Reset de contraseña bloqueado por rate limit', {
        context: 'password-reset.request',
        email: email.toLowerCase(),
      })

      return NextResponse.json(
        {
          error: errorMessage,
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        { status: 429 }
      )
    }

    // Solicitar reset (siempre retorna success)
    const result = await requestPasswordReset(email)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Error al solicitar reset de contraseña', error as Error, {
      context: 'password-reset.request',
    })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Email inválido', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}
