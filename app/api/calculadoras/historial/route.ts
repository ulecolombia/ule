/**
 * API DE CALCULADORAS - HISTORIAL
 * GET /api/calculadoras/historial
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const tipo = searchParams.get('tipo')
    const limite = parseInt(searchParams.get('limite') || '20')

    const where: any = { userId: user.id }
    if (tipo) {
      where.tipoCalculadora = tipo
    }

    const calculos = await prisma.calculoGuardado.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limite,
    })

    return NextResponse.json({ calculos })
  } catch (error) {
    console.error('[API Calculadoras] Error al obtener historial:', error)
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    )
  }
}
