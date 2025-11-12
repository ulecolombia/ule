/**
 * ULE - API DE ESTADÍSTICAS DE CLIENTES
 * Obtiene estadísticas generales de clientes
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/clientes/stats
 * Obtiene estadísticas de clientes del usuario
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Total de clientes
    const totalClientes = await db.cliente.count({
      where: { userId: user.id },
    })

    // Clientes activos este mes (con facturas en el mes actual)
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const clientesActivosMes = await db.cliente.findMany({
      where: {
        userId: user.id,
        facturas: {
          some: {
            fecha: {
              gte: inicioMes,
            },
          },
        },
      },
      select: { id: true },
    })

    // Clientes nuevos este mes
    const clientesNuevos = await db.cliente.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: inicioMes,
        },
      },
    })

    // Top 5 clientes por facturación
    const topClientes = await db.cliente.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { facturas: true },
        },
        facturas: {
          select: { total: true },
          where: { estado: { in: ['EMITIDA', 'PAGADA'] } },
        },
      },
      orderBy: {
        facturas: {
          _count: 'desc',
        },
      },
      take: 5,
    })

    const topClientesData = topClientes.map((cliente) => {
      const totalFacturado = cliente.facturas.reduce(
        (sum, f) => sum + Number(f.total),
        0
      )

      return {
        id: cliente.id,
        nombre: cliente.nombre,
        numeroDocumento: cliente.numeroDocumento,
        totalFacturado,
        numeroFacturas: cliente._count.facturas,
      }
    })

    return NextResponse.json({
      totalClientes,
      clientesActivosMes: clientesActivosMes.length,
      clientesNuevosMes: clientesNuevos,
      topClientes: topClientesData,
    })
  } catch (error) {
    console.error('[API Clientes Stats] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
