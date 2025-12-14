/**
 * API - DETALLE Y ACTUALIZACIÓN DE ALERTA
 * Gestionar estado y resolución de alertas de seguridad
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { auditarGestionAlerta } from '@/lib/audit/audit-helpers'

const updateSchema = z.object({
  estado: z.enum([
    'PENDIENTE',
    'EN_REVISION',
    'FALSO_POSITIVO',
    'CONFIRMADA',
    'RESUELTA',
    'ARCHIVADA',
  ]),
  notas: z.string().optional(),
  accionTomada: z.string().optional(),
})

/**
 * GET - Obtener detalle de alerta
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // ✅ ALTO #10: Verificar permisos desde JWT (sin query a DB)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!session.user.isAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const alerta = await db.alertaSeguridad.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!alerta) {
      return NextResponse.json(
        { error: 'Alerta no encontrada' },
        { status: 404 }
      )
    }

    // Obtener logs relacionados
    const logs = await db.logAuditoria.findMany({
      where: {
        id: {
          in: alerta.logIds,
        },
      },
      select: {
        id: true,
        accion: true,
        exitoso: true,
        timestamp: true,
        ip: true,
        nivelRiesgo: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    })

    return NextResponse.json({ alerta, logs })
  } catch (error) {
    console.error('Error obteniendo alerta:', error)
    return NextResponse.json(
      { error: 'Error al obtener alerta' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Actualizar alerta
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // ✅ ALTO #10: Verificar permisos desde JWT (sin query a DB)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!session.user.isAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    // Obtener alerta actual
    const alertaActual = await db.alertaSeguridad.findUnique({
      where: { id: params.id },
    })

    if (!alertaActual) {
      return NextResponse.json(
        { error: 'Alerta no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar alerta
    const alerta = await db.alertaSeguridad.update({
      where: { id: params.id },
      data: {
        ...data,
        asignadoA: session.user.id,
        fechaAsignacion: new Date(),
        fechaResolucion: ['RESUELTA', 'ARCHIVADA', 'FALSO_POSITIVO'].includes(
          data.estado
        )
          ? new Date()
          : undefined,
      },
    })

    // Auditar gestión de alerta
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    await auditarGestionAlerta(
      session.user.id,
      alerta.id,
      {
        estadoAnterior: alertaActual.estado,
        estadoNuevo: data.estado,
        notas: data.notas,
      },
      ip
    )

    return NextResponse.json({ success: true, alerta })
  } catch (error) {
    console.error('Error actualizando alerta:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar alerta' },
      { status: 500 }
    )
  }
}
