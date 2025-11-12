/**
 * API - COOKIE PREFERENCES
 * Gestión de preferencias de cookies
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { AccionPrivacidad } from '@prisma/client'
import { secureLogger } from '@/lib/security/secure-logger'

const cookiePreferencesSchema = z.object({
  cookiesEsenciales: z.boolean().default(true),
  cookiesAnaliticas: z.boolean(),
  cookiesMarketing: z.boolean(),
  cookiesPersonalizacion: z.boolean(),
})

/**
 * GET - Obtener preferencias de cookies del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const configuracion = await db.configuracionCookies.findUnique({
      where: { userId: session.user.id! },
      select: {
        cookiesEsenciales: true,
        cookiesAnaliticas: true,
        cookiesMarketing: true,
        cookiesPersonalizacion: true,
        fechaAceptacion: true,
        updatedAt: true,
      },
    })

    // Si no existe configuración, retornar valores por defecto
    if (!configuracion) {
      return NextResponse.json({
        configuracion: {
          cookiesEsenciales: true,
          cookiesAnaliticas: false,
          cookiesMarketing: false,
          cookiesPersonalizacion: false,
          fechaAceptacion: null,
        },
        nueva: true,
      })
    }

    return NextResponse.json({
      configuracion,
      nueva: false,
    })
  } catch (error) {
    secureLogger.error('Error en GET /api/privacy/cookies', error)
    return NextResponse.json(
      { error: 'Error al obtener preferencias' },
      { status: 500 }
    )
  }
}

/**
 * POST - Actualizar preferencias de cookies
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = cookiePreferencesSchema.parse(body)

    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown'

    // Upsert configuración
    const configuracion = await db.configuracionCookies.upsert({
      where: { userId: session.user.id! },
      create: {
        userId: session.user.id!,
        ...validatedData,
        ipAceptacion: ipAddress,
        fechaAceptacion: new Date(),
      },
      update: {
        ...validatedData,
        ipAceptacion: ipAddress,
        fechaAceptacion: new Date(),
      },
    })

    // Log de privacidad
    await db.logPrivacidad.create({
      data: {
        userId: session.user.id!,
        accion: AccionPrivacidad.CONFIGURACION_COOKIES_ACTUALIZADA,
        descripcion: 'Preferencias de cookies actualizadas',
        ipAddress,
        metadata: validatedData,
      },
    })

    secureLogger.audit('Preferencias de cookies actualizadas', {
      userId: session.user.id!,
      preferencias: validatedData,
    })

    return NextResponse.json({
      success: true,
      message: 'Preferencias guardadas exitosamente',
      configuracion,
    })
  } catch (error) {
    secureLogger.error('Error en POST /api/privacy/cookies', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al guardar preferencias' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Actualizar preferencias de cookies (alias de POST)
 */
export async function PUT(req: NextRequest) {
  return POST(req)
}
