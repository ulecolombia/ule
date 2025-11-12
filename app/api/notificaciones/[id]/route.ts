import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface RouteContext {
  params: {
    id: string
  }
}

/**
 * PUT /api/notificaciones/[id]
 * Actualiza una notificación (marca como leída)
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { id } = context.params
    const body = await req.json()

    // Verificar que la notificación pertenece al usuario
    const notificacion = await prisma.recordatorio.findUnique({
      where: { id },
    })

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    if (notificacion.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para actualizar esta notificación' },
        { status: 403 }
      )
    }

    // Actualizar notificación
    const updated = await prisma.recordatorio.update({
      where: { id },
      data: {
        leido: body.leido ?? notificacion.leido,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    logger.error(
      'Error al actualizar notificación',
      error instanceof Error ? error : new Error(String(error))
    )

    return NextResponse.json(
      { error: 'Error al actualizar notificación' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notificaciones/[id]
 * Elimina una notificación
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { id } = context.params

    // Verificar que la notificación pertenece al usuario
    const notificacion = await prisma.recordatorio.findUnique({
      where: { id },
    })

    if (!notificacion) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      )
    }

    if (notificacion.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta notificación' },
        { status: 403 }
      )
    }

    // Eliminar notificación
    await prisma.recordatorio.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Notificación eliminada' })
  } catch (error) {
    logger.error(
      'Error al eliminar notificación',
      error instanceof Error ? error : new Error(String(error))
    )

    return NextResponse.json(
      { error: 'Error al eliminar notificación' },
      { status: 500 }
    )
  }
}
