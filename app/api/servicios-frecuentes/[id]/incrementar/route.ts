/**
 * API INCREMENTAR CONTADOR DE SERVICIO FRECUENTE
 * POST /api/servicios-frecuentes/[id]/incrementar - Incrementar vecesUtilizado
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    // Verificar que el servicio pertenece al usuario
    const servicio = await prisma.servicioFrecuente.findFirst({
      where: {
        id: params.id,
        userId: user.id,
        activo: true,
      },
    })

    if (!servicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      )
    }

    // Incrementar contador
    await prisma.servicioFrecuente.update({
      where: { id: params.id },
      data: {
        vecesUtilizado: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Contador incrementado',
    })
  } catch (error) {
    console.error(
      '[API Servicios Frecuentes] Error al incrementar contador:',
      error
    )
    return NextResponse.json(
      { error: 'Error al actualizar contador' },
      { status: 500 }
    )
  }
}
