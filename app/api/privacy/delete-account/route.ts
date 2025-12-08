/**
 * API - ACCOUNT DELETION
 * Eliminación de cuenta según Ley 1581 de 2012 (Derecho al Olvido)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import {
  solicitarEliminacion,
  confirmarEliminacion,
  cancelarEliminacion,
  obtenerEstadoEliminacion,
  obtenerHistorialEliminaciones,
} from '@/lib/privacy/account-deletion'
import { secureLogger } from '@/lib/security/secure-logger'

const solicitudSchema = z.object({
  motivoEliminacion: z.string().optional(),
})

const confirmacionSchema = z.object({
  token: z.string(),
})

/**
 * GET - Obtener estado de solicitud de eliminación
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const historial = searchParams.get('historial') === 'true'

    if (historial) {
      const data = await obtenerHistorialEliminaciones(session.user.id!)
      return NextResponse.json({ historial: data })
    }

    const solicitud = await obtenerEstadoEliminacion(session.user.id!)

    return NextResponse.json({
      solicitud: solicitud || null,
      tieneSolicitudActiva: !!solicitud,
    })
  } catch (error) {
    secureLogger.error('Error en GET /api/privacy/delete-account', error)
    return NextResponse.json(
      { error: 'Error al obtener estado' },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear solicitud de eliminación o confirmarla
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    const ipAddress =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown'

    // Confirmar eliminación con token
    if (action === 'confirm') {
      const validatedData = confirmacionSchema.parse(body)

      await confirmarEliminacion(session.user.id!, validatedData.token)

      return NextResponse.json({
        success: true,
        message:
          'Eliminación confirmada. Se ejecutará en 30 días. Puedes cancelarla en cualquier momento.',
      })
    }

    // Cancelar eliminación
    if (action === 'cancel') {
      await cancelarEliminacion(session.user.id!)

      return NextResponse.json({
        success: true,
        message: 'Solicitud de eliminación cancelada exitosamente',
      })
    }

    // Crear nueva solicitud
    const validatedData = solicitudSchema.parse(body)

    const token = await solicitarEliminacion(
      session.user.id!,
      validatedData.motivoEliminacion,
      ipAddress
    )

    return NextResponse.json({
      success: true,
      message:
        'Solicitud creada. Revisa tu correo para confirmar la eliminación.',
      token, // En producción, NO retornar el token, solo enviarlo por email
    })
  } catch (error: any) {
    secureLogger.error('Error en POST /api/privacy/delete-account', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al procesar solicitud' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Cancelar solicitud de eliminación
 */
export async function DELETE(_req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    await cancelarEliminacion(session.user.id!)

    return NextResponse.json({
      success: true,
      message: 'Solicitud de eliminación cancelada',
    })
  } catch (error: any) {
    secureLogger.error('Error en DELETE /api/privacy/delete-account', error)

    return NextResponse.json(
      { error: error.message || 'Error al cancelar solicitud' },
      { status: 500 }
    )
  }
}
