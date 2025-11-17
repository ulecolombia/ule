/**
 * API: POST /api/analytics/track
 * Trackea eventos de usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { trackEvent } from '@/lib/services/analytics-service'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const trackEventSchema = z.object({
  evento: z.string(),
  categoria: z.enum([
    'ONBOARDING',
    'PILA',
    'FACTURACION',
    'ASESORIA',
    'EXPORTACION',
    'NAVEGACION',
    'SISTEMA',
  ]),
  metadata: z.any().optional(),
  sessionId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    // ✅ Rate limiting: 100 eventos por minuto por IP
    const limiter = await rateLimit(req, { max: 100, window: 60000 })

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': limiter.remaining.toString(),
            'X-RateLimit-Reset': new Date(limiter.reset).toISOString(),
            'Retry-After': Math.ceil(
              (limiter.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    const session = await auth()
    const body = await req.json()
    const { evento, categoria, metadata, sessionId } =
      trackEventSchema.parse(body)

    // ✅ Usar userId directamente del token JWT (no query a DB)
    const userId = (session?.user as any)?.id || undefined

    // Obtener contexto de headers
    const userAgent = req.headers.get('user-agent') || undefined
    const ip =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      undefined

    await trackEvent({
      userId, // ✅ Ya no hay query a DB, mucho más rápido
      evento,
      categoria,
      metadata,
      sessionId,
      userAgent,
      ip,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json(
      { error: 'Error al trackear evento' },
      { status: 500 }
    )
  }
}
