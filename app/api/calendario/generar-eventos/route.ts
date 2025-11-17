/**
 * API DE CALENDARIO - GENERAR EVENTOS PRE-CARGADOS
 * POST /api/calendario/generar-eventos
 * Genera eventos tributarios automáticos para el usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generarEventosPreCargados } from '@/lib/services/calendario-service'

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
    const año = body.año || new Date().getFullYear()

    // Generar eventos pre-cargados
    await generarEventosPreCargados(user.id, año)

    return NextResponse.json({
      success: true,
      message: `Eventos tributarios generados para el año ${año}`,
    })
  } catch (error) {
    console.error('[API Calendario] Error al generar eventos:', error)
    return NextResponse.json(
      {
        error: 'Error al generar eventos',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
