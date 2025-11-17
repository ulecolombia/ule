/**
 * API DE BÚSQUEDA DE CLIENTES
 * GET /api/clientes/buscar?q=término - Buscar clientes por nombre o documento
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
    const query = searchParams.get('q') || ''

    if (!query.trim()) {
      return NextResponse.json({ clientes: [] })
    }

    // Buscar por nombre o documento (case-insensitive)
    const clientes = await prisma.cliente.findMany({
      where: {
        userId: user.id,
        activo: true,
        OR: [
          {
            nombre: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            documento: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        nombre: true,
        documento: true,
        tipoDocumento: true,
        email: true,
        telefono: true,
        direccion: true,
        ciudad: true,
      },
      orderBy: [{ nombre: 'asc' }],
      take: 10, // Limitar a 10 resultados
    })

    return NextResponse.json({ clientes })
  } catch (error) {
    console.error('[API Clientes Buscar] Error:', error)
    return NextResponse.json(
      { error: 'Error al buscar clientes' },
      { status: 500 }
    )
  }
}
