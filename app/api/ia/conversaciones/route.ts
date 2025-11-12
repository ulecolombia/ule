/**
 * ULE - API ENDPOINT PARA GESTIÓN DE CONVERSACIONES
 * GET /api/ia/conversaciones - Obtener lista de conversaciones del usuario
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiLogger } from '@/lib/utils/logger'

/**
 * GET - Obtener conversaciones del usuario actual
 */
export async function GET() {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.email) {
      apiLogger.warn('Intento de acceder conversaciones sin autenticación')
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

    // Obtener conversaciones con mensajes (para contar)
    const conversaciones = await db.conversacion.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { mensajes: true },
        },
      },
    })

    apiLogger.info('Conversaciones recuperadas', {
      userId: user.id,
      count: conversaciones.length,
    })

    return NextResponse.json({
      success: true,
      conversaciones: conversaciones.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        mensajesCount: c._count.mensajes,
      })),
    })
  } catch (error) {
    apiLogger.error(
      'Error en GET /api/ia/conversaciones',
      error as Error
    )
    return NextResponse.json(
      { error: 'Error al obtener conversaciones' },
      { status: 500 }
    )
  }
}
