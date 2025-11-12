/**
 * API DE CALENDARIO - EVENTOS
 * GET /api/calendario/eventos - Listar eventos
 * POST /api/calendario/eventos - Crear evento
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth } from 'date-fns'
import { z } from 'zod'

/**
 * GET - Listar eventos del mes
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const mes = parseInt(
      searchParams.get('mes') || new Date().getMonth().toString()
    )
    const año = parseInt(
      searchParams.get('año') || new Date().getFullYear().toString()
    )

    const inicio = startOfMonth(new Date(año, mes))
    const fin = endOfMonth(new Date(año, mes))

    const eventos = await prisma.eventoCalendario.findMany({
      where: {
        userId: user.id,
        fecha: {
          gte: inicio,
          lte: fin,
        },
      },
      orderBy: { fecha: 'asc' },
    })

    return NextResponse.json({ eventos })
  } catch (error) {
    console.error('[API Calendario] Error al obtener eventos:', error)
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear evento
 */
const crearEventoSchema = z.object({
  titulo: z.string().min(1).max(200),
  descripcion: z.string().optional(),
  fecha: z.string(), // ISO date
  fechaFin: z.string().optional(),
  tipo: z.enum([
    'VENCIMIENTO_PILA',
    'DECLARACION_RENTA',
    'DECLARACION_IVA',
    'DECLARACION_RETEFUENTE',
    'ACTUALIZACION_SMMLV',
    'PAGO_IMPUESTOS',
    'RENOVACION_RUT',
    'EVENTO_PERSONAL',
    'OTRO',
  ]),
  categoria: z
    .enum(['TRIBUTARIO', 'CONTABLE', 'LABORAL', 'ADMINISTRATIVO', 'PERSONAL'])
    .optional(),
  notificar: z.boolean().default(true),
  color: z.string().optional(),
  recurrente: z.boolean().default(false),
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

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const data = crearEventoSchema.parse(body)

    const evento = await prisma.eventoCalendario.create({
      data: {
        ...data,
        userId: user.id,
        fecha: new Date(data.fecha),
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
      },
    })

    return NextResponse.json({ success: true, evento })
  } catch (error) {
    console.error('[API Calendario] Error al crear evento:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear evento' },
      { status: 500 }
    )
  }
}
