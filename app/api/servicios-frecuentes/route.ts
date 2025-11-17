/**
 * API DE SERVICIOS FRECUENTES - ROUTE PRINCIPAL
 * GET /api/servicios-frecuentes - Listar servicios del usuario
 * POST /api/servicios-frecuentes - Crear nuevo servicio
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { servicioFrecuenteSchema } from '@/lib/validations/servicio-frecuente'
import { z } from 'zod'

// GET - Listar servicios del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [servicios, total] = await Promise.all([
      prisma.servicioFrecuente.findMany({
        where: {
          userId: user.id,
          activo: true, // Solo servicios activos
        },
        orderBy: { vecesUtilizado: 'desc' }, // Más usados primero
        skip,
        take: limit,
      }),
      prisma.servicioFrecuente.count({
        where: {
          userId: user.id,
          activo: true,
        },
      }),
    ])

    return NextResponse.json({
      servicios,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error(
      '[API Servicios Frecuentes] Error al obtener servicios:',
      error
    )
    return NextResponse.json(
      { error: 'Error al obtener servicios' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo servicio
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

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
    const validatedData = servicioFrecuenteSchema.parse(body)

    const servicio = await prisma.servicioFrecuente.create({
      data: {
        ...validatedData,
        userId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      servicio,
      message: 'Servicio creado exitosamente',
    })
  } catch (error) {
    console.error('[API Servicios Frecuentes] Error al crear servicio:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear servicio' },
      { status: 500 }
    )
  }
}
