/**
 * API DE SERVICIOS FRECUENTES - ROUTE POR ID
 * PUT /api/servicios-frecuentes/[id] - Actualizar servicio
 * DELETE /api/servicios-frecuentes/[id] - Eliminar servicio
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { servicioFrecuenteSchema } from '@/lib/validations/servicio-frecuente'
import { z } from 'zod'

// PUT - Actualizar servicio
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar que el servicio pertenece al usuario
    const servicio = await prisma.servicioFrecuente.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!servicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    const updated = await prisma.servicioFrecuente.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json({
      success: true,
      servicio: updated,
      message: 'Servicio actualizado exitosamente',
    })
  } catch (error) {
    console.error(
      '[API Servicios Frecuentes] Error al actualizar servicio:',
      error
    )

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar servicio' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar servicio (soft delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar que el servicio pertenece al usuario
    const servicio = await prisma.servicioFrecuente.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!servicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    // Soft delete - marcar como inactivo
    await prisma.servicioFrecuente.update({
      where: { id: params.id },
      data: { activo: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Servicio eliminado exitosamente',
    })
  } catch (error) {
    console.error(
      '[API Servicios Frecuentes] Error al eliminar servicio:',
      error
    )
    return NextResponse.json(
      { error: 'Error al eliminar servicio' },
      { status: 500 }
    )
  }
}
