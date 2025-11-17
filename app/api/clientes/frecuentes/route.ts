/**
 * API DE CLIENTES FRECUENTES
 * GET /api/clientes/frecuentes - Obtener clientes más facturados
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

    // Obtener clientes con más facturas (top 5)
    const clientesFrecuentes = await prisma.cliente.findMany({
      where: {
        userId: user.id,
        facturas: {
          some: {}, // Solo clientes que tienen al menos una factura
        },
      },
      select: {
        id: true,
        nombre: true,
        numeroDocumento: true,
        tipoDocumento: true,
        email: true,
        telefono: true,
        direccion: true,
        ciudad: true,
        _count: {
          select: {
            facturas: true,
          },
        },
      },
      orderBy: {
        facturas: {
          _count: 'desc',
        },
      },
      take: 5, // Top 5 clientes más frecuentes
    })

    // Si no hay clientes frecuentes, devolver los más recientes
    if (clientesFrecuentes.length === 0) {
      const clientesRecientes = await prisma.cliente.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          nombre: true,
          numeroDocumento: true,
          tipoDocumento: true,
          email: true,
          telefono: true,
          direccion: true,
          ciudad: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      })

      return NextResponse.json({ clientes: clientesRecientes })
    }

    // Remover el campo _count antes de devolver
    const clientes = clientesFrecuentes.map(({ _count, ...cliente }) => cliente)

    return NextResponse.json({ clientes })
  } catch (error) {
    console.error('[API Clientes Frecuentes] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener clientes frecuentes' },
      { status: 500 }
    )
  }
}
