/**
 * API: POST /api/analytics/error
 * Registra errores de la aplicación
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logError } from '@/lib/services/analytics-service'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const logErrorSchema = z.object({
  mensaje: z.string(),
  stack: z.string().optional(),
  tipo: z.string().optional(),
  severidad: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
  url: z.string().optional(),
  componente: z.string().optional(),
  accion: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.any().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // ✅ Rate limiting: 50 errores por minuto por IP
    const limiter = await rateLimit(req, { max: 50, window: 60000 })

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': limiter.remaining.toString(),
            'X-RateLimit-Reset': new Date(limiter.reset).toISOString(),
          },
        }
      )
    }

    const session = await auth()
    const body = await req.json()
    const data = logErrorSchema.parse(body)

    // ✅ Usar userId directamente del token JWT (no query a DB)
    const userId = (session?.user as any)?.id || undefined

    // Obtener contexto de headers
    const userAgent = req.headers.get('user-agent') || undefined
    const dispositivo = userAgent
      ? /mobile/i.test(userAgent)
        ? 'mobile'
        : /tablet|ipad/i.test(userAgent)
          ? 'tablet'
          : 'desktop'
      : undefined
    const navegador = userAgent
      ? userAgent.includes('Chrome')
        ? 'Chrome'
        : userAgent.includes('Firefox')
          ? 'Firefox'
          : userAgent.includes('Safari')
            ? 'Safari'
            : 'Other'
      : undefined

    await logError({
      userId, // ✅ Ya no hay query a DB
      ...data,
      userAgent,
      dispositivo,
      navegador,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error logging error:', error)
    return NextResponse.json(
      { error: 'Error al registrar error' },
      { status: 500 }
    )
  }
}
