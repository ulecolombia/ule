/**
 * ULE - API ENDPOINT PARA CONVERSACIÓN INDIVIDUAL
 * PUT /api/ia/conversaciones/[id] - Actualizar conversación (título)
 * DELETE /api/ia/conversaciones/[id] - Eliminar conversación
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiLogger } from '@/lib/utils/logger'
import { isValidCUID } from '@/lib/utils/security'
import { z } from 'zod'

/**
 * Schema de validación para actualización
 */
const actualizarConversacionSchema = z.object({
  titulo: z.string().min(1).max(200),
})

/**
 * PUT - Actualizar una conversación (título)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validar CUID
    if (!isValidCUID(id)) {
      return NextResponse.json(
        { error: 'ID de conversación inválido' },
        { status: 400 }
      )
    }

    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener usuario
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Parsear body
    const body = await req.json()
    const validation = actualizarConversacionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { titulo } = validation.data

    // Verificar que la conversación existe y pertenece al usuario
    const conversacion = await db.conversacion.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!conversacion) {
      apiLogger.warn('Intento de actualizar conversación no encontrada', {
        conversacionId: id,
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar título
    const conversacionActualizada = await db.conversacion.update({
      where: { id },
      data: {
        titulo,
        updatedAt: new Date(),
      },
    })

    apiLogger.info('Conversación actualizada', {
      conversacionId: id,
      userId: user.id,
      nuevoTitulo: titulo,
    })

    return NextResponse.json({
      success: true,
      conversacion: conversacionActualizada,
    })
  } catch (error) {
    apiLogger.error(
      'Error en PUT /api/ia/conversaciones/[id]',
      error as Error
    )
    return NextResponse.json(
      { error: 'Error al actualizar conversación' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Eliminar una conversación
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validar CUID
    if (!isValidCUID(id)) {
      return NextResponse.json(
        { error: 'ID de conversación inválido' },
        { status: 400 }
      )
    }

    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener usuario
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la conversación pertenece al usuario
    const conversacion = await db.conversacion.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!conversacion) {
      apiLogger.warn('Intento de eliminar conversación no encontrada', {
        conversacionId: id,
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar conversación (cascade eliminará mensajes automáticamente)
    await db.conversacion.delete({
      where: { id },
    })

    apiLogger.info('Conversación eliminada', {
      conversacionId: id,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Conversación eliminada exitosamente',
    })
  } catch (error) {
    apiLogger.error(
      'Error en DELETE /api/ia/conversaciones/[id]',
      error as Error
    )
    return NextResponse.json(
      { error: 'Error al eliminar conversación' },
      { status: 500 }
    )
  }
}
