import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import {
  analizarPerfilTributario,
  obtenerHistorialAnalisis,
  compararAnalisis
} from '@/lib/services/analisis-tributario-service'

// Cache simple en memoria para análisis (1 hora de TTL)
const analysisCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

function getCachedAnalysis(userId: string) {
  const cached = analysisCache.get(userId)
  if (!cached) return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL) {
    analysisCache.delete(userId)
    return null
  }

  return cached.data
}

function setCachedAnalysis(userId: string, data: any) {
  analysisCache.set(userId, { data, timestamp: Date.now() })

  // Limpiar caché viejo (máximo 100 entradas)
  if (analysisCache.size > 100) {
    const firstKey = analysisCache.keys().next().value
    if (firstKey) analysisCache.delete(firstKey)
  }
}

export async function GET(req: NextRequest) {
  let userId: string | undefined

  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    userId = user.id

    const { searchParams } = new URL(req.url)
    const accion = searchParams.get('accion')

    // Obtener historial (sin rate limit, es consulta simple)
    if (accion === 'historial') {
      const historial = await obtenerHistorialAnalisis(user.id)
      return NextResponse.json({ historial })
    }

    // Rate limiting: 3 análisis por minuto máximo
    const rateLimitResult = await rateLimit(user.id, {
      limit: 3,
      interval: 60 * 1000, // 1 minuto
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes. Intenta en 1 minuto.',
          retryAfter: 60,
        },
        { status: 429 }
      )
    }

    // Verificar caché
    const cached = getCachedAnalysis(user.id)
    if (cached) {
      return NextResponse.json({
        ...cached,
        fromCache: true,
      })
    }

    // Generar nuevo análisis (ya incluye obtención de análisis anterior)
    const { reporte, analisisAnterior } = await analizarPerfilTributario(user.id)

    // Comparar con análisis anterior
    const comparacion = compararAnalisis(analisisAnterior, reporte)

    const result = {
      reporte,
      comparacion,
    }

    // Guardar en caché
    setCachedAnalysis(user.id, result)

    return NextResponse.json(result)
  } catch (error) {
    logger.error(
      'Error en análisis tributario',
      error instanceof Error ? error : new Error(String(error)),
      userId ? { userId } : undefined
    )

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Error al realizar análisis' },
      { status: 500 }
    )
  }
}
