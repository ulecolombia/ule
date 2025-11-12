/**
 * ULE - API ENDPOINT PARA MENSAJES DE CONVERSACIÓN
 * GET /api/ia/conversaciones/[id]/mensajes - Obtener mensajes de una conversación
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiLogger } from '@/lib/utils/logger'
import { isValidCUID } from '@/lib/utils/security'

/**
 * GET - Obtener mensajes de una conversación
 */
export async function GET(
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
      include: {
        mensajes: {
          orderBy: { timestamp: 'asc' },
        },
      },
    })

    if (!conversacion) {
      apiLogger.warn('Intento de acceder mensajes de conversación no encontrada', {
        conversacionId: id,
        userId: user.id,
      })
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      )
    }

    apiLogger.info('Mensajes recuperados', {
      conversacionId: id,
      userId: user.id,
      mensajesCount: conversacion.mensajes.length,
    })

    return NextResponse.json({
      success: true,
      conversacion: {
        id: conversacion.id,
        titulo: conversacion.titulo,
        createdAt: conversacion.createdAt,
        updatedAt: conversacion.updatedAt,
      },
      mensajes: conversacion.mensajes.map((m) => ({
        id: m.id,
        rol: m.rol,
        contenido: m.contenido,
        timestamp: m.timestamp,
      })),
    })
  } catch (error) {
    apiLogger.error(
      'Error en GET /api/ia/conversaciones/[id]/mensajes',
      error as Error
    )
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}
