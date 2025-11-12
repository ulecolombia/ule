/**
 * API DE CALENDARIO - EVENTO INDIVIDUAL
 * PUT /api/calendario/eventos/[id] - Actualizar evento
 * DELETE /api/calendario/eventos/[id] - Eliminar evento
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const actualizarEventoSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descripcion: z.string().optional(),
  fecha: z.string().optional(), // ISO date
  fechaFin: z.string().optional(),
  tipo: z
    .enum([
      'VENCIMIENTO_PILA',
      'DECLARACION_RENTA',
      'DECLARACION_IVA',
      'DECLARACION_RETEFUENTE',
      'ACTUALIZACION_SMMLV',
      'PAGO_IMPUESTOS',
      'RENOVACION_RUT',
      'EVENTO_PERSONAL',
      'OTRO',
    ])
    .optional(),
  categoria: z
    .enum(['TRIBUTARIO', 'CONTABLE', 'LABORAL', 'ADMINISTRATIVO', 'PERSONAL'])
    .optional(),
  notificar: z.boolean().optional(),
  completado: z.boolean().optional(),
  color: z.string().optional(),
  recurrente: z.boolean().optional(),
  frecuencia: z
    .enum([
      'MENSUAL',
      'BIMESTRAL',
      'TRIMESTRAL',
      'CUATRIMESTRAL',
      'SEMESTRAL',
      'ANUAL',
    ])
    .optional(),
})

/**
 * PUT - Actualizar evento
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
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

    // Verificar que el evento pertenece al usuario
    const eventoExistente = await prisma.eventoCalendario.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!eventoExistente) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data = actualizarEventoSchema.parse(body)

    const evento = await prisma.eventoCalendario.update({
      where: { id: params.id },
      data: {
        ...data,
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
      },
    })

    return NextResponse.json({ success: true, evento })
  } catch (error) {
    console.error('[API Calendario] Error al actualizar evento:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar evento' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Eliminar evento
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
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

    // Verificar que el evento pertenece al usuario
    const eventoExistente = await prisma.eventoCalendario.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!eventoExistente) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      )
    }

    await prisma.eventoCalendario.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Calendario] Error al eliminar evento:', error)
    return NextResponse.json(
      { error: 'Error al eliminar evento' },
      { status: 500 }
    )
  }
}
