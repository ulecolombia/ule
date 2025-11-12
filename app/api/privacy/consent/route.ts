/**
 * API - CONSENT MANAGEMENT
 * Gestión de consentimientos según Ley 1581 de 2012
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { TipoConsentimiento } from '@prisma/client'
import {
  registrarConsentimiento,
  obtenerConsentimientos,
  tieneConsentimiento,
  revocarConsentimiento,
  verificarConsentimientosRequeridos,
  obtenerHistorialConsentimientos,
} from '@/lib/privacy/consent-manager'
import { secureLogger } from '@/lib/security/secure-logger'

// Schema de validación
const consentSchema = z.object({
  tipo: z.nativeEnum(TipoConsentimiento),
  otorgado: z.boolean(),
  version: z.string(),
})

/**
 * GET - Obtener consentimientos del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo')
    const historial = searchParams.get('historial') === 'true'

    // Si se solicita historial completo
    if (historial) {
      const data = await obtenerHistorialConsentimientos(session.user.id!)
      return NextResponse.json({ historial: data })
    }

    // Si se consulta un tipo específico
    if (tipo) {
      const tiene = await tieneConsentimiento(
        session.user.id!,
        tipo as TipoConsentimiento
      )
      return NextResponse.json({ tiene, tipo })
    }

    // Retornar todos los consentimientos vigentes
    const consentimientos = await obtenerConsentimientos(session.user.id!)
    const requeridos = await verificarConsentimientosRequeridos(
      session.user.id!
    )

    return NextResponse.json({
      consentimientos,
      requeridos,
    })
  } catch (error) {
    secureLogger.error('Error en GET /api/privacy/consent', error)
    return NextResponse.json(
      { error: 'Error al obtener consentimientos' },
      { status: 500 }
    )
  }
}

/**
 * POST - Registrar nuevo consentimiento
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = consentSchema.parse(body)

    // Obtener IP y User-Agent para auditoría
    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    await registrarConsentimiento({
      userId: session.user.id!,
      tipo: validatedData.tipo,
      otorgado: validatedData.otorgado,
      version: validatedData.version,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({
      success: true,
      message: 'Consentimiento registrado exitosamente',
    })
  } catch (error) {
    secureLogger.error('Error en POST /api/privacy/consent', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al registrar consentimiento' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Revocar consentimiento
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo')

    if (!tipo) {
      return NextResponse.json(
        { error: 'Parámetro "tipo" requerido' },
        { status: 400 }
      )
    }

    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    await revocarConsentimiento(
      session.user.id!,
      tipo as TipoConsentimiento,
      ipAddress,
      userAgent
    )

    return NextResponse.json({
      success: true,
      message: 'Consentimiento revocado exitosamente',
    })
  } catch (error: any) {
    secureLogger.error('Error en DELETE /api/privacy/consent', error)

    return NextResponse.json(
      { error: error.message || 'Error al revocar consentimiento' },
      { status: 500 }
    )
  }
}
