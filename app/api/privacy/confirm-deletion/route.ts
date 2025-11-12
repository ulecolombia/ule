/**
 * API - CONFIRMACIÓN DE ELIMINACIÓN DE CUENTA
 * Usuario confirma eliminación a través del token enviado por email
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { EstadoSolicitudEliminacion, AccionPrivacidad } from '@prisma/client'
import { secureLogger } from '@/lib/security/secure-logger'

const confirmSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
})

/**
 * Calcula fecha de ejecución (30 días desde confirmación)
 */
function calcularFechaEjecucion(): Date {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 30)
  return fecha
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = confirmSchema.parse(body)

    // 1. Buscar solicitud con el token
    const solicitud = await db.solicitudEliminacion.findFirst({
      where: {
        tokenConfirmacion: token,
        estado: EstadoSolicitudEliminacion.PENDIENTE,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    })

    if (!solicitud) {
      return NextResponse.json(
        { error: 'Token inválido o solicitud no encontrada' },
        { status: 400 }
      )
    }

    // 2. Calcular fecha de ejecución (30 días desde ahora)
    const fechaEjecucion = calcularFechaEjecucion()

    // 3. Actualizar solicitud
    await db.solicitudEliminacion.update({
      where: { id: solicitud.id },
      data: {
        estado: EstadoSolicitudEliminacion.EN_PERIODO_GRACIA,
        fechaConfirmacion: new Date(),
        fechaEjecucion,
      },
    })

    // 4. Log de privacidad
    await db.logPrivacidad.create({
      data: {
        userId: solicitud.userId,
        accion: AccionPrivacidad.ELIMINACION_CONFIRMADA,
        descripcion: `Eliminación confirmada. Se ejecutará el ${fechaEjecucion.toLocaleDateString('es-CO')}`,
        metadata: {
          solicitudId: solicitud.id,
          fechaEjecucion: fechaEjecucion.toISOString(),
        },
      },
    })

    secureLogger.audit('Eliminación confirmada vía token', {
      userId: solicitud.userId,
      email: solicitud.user.email,
      solicitudId: solicitud.id,
      fechaEjecucion,
    })

    return NextResponse.json({
      success: true,
      message: 'Tu solicitud de eliminación ha sido confirmada. Tu cuenta será eliminada en 30 días.',
      fechaEjecucion: fechaEjecucion.toISOString(),
    })
  } catch (error: any) {
    console.error('Error confirmando eliminación:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al confirmar eliminación' },
      { status: 500 }
    )
  }
}
