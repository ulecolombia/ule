/**
 * ULE - API DE ESTADÍSTICAS DE CUENTAS DE COBRO
 * Devuelve métricas y estadísticas del usuario
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
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

    // Obtener fecha de inicio del mes actual
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    // Estadísticas generales
    const [
      totalCuentas,
      cuentasEmitidas,
      cuentasPagadas,
      cuentasPendientes,
      totalMes,
      cuentasMes,
    ] = await Promise.all([
      // Total de cuentas
      db.cuentaCobro.count({
        where: { userId: user.id },
      }),
      // Cuentas emitidas
      db.cuentaCobro.count({
        where: {
          userId: user.id,
          estado: { in: ['EMITIDA', 'ENVIADA'] },
        },
      }),
      // Cuentas pagadas
      db.cuentaCobro.count({
        where: {
          userId: user.id,
          estado: 'PAGADA',
        },
      }),
      // Cuentas pendientes de pago (emitidas pero no pagadas)
      db.cuentaCobro.count({
        where: {
          userId: user.id,
          estado: { in: ['EMITIDA', 'ENVIADA', 'VENCIDA'] },
        },
      }),
      // Total facturado este mes
      db.cuentaCobro.aggregate({
        where: {
          userId: user.id,
          estado: { in: ['EMITIDA', 'ENVIADA', 'PAGADA'] },
          fecha: { gte: inicioMes },
        },
        _sum: { total: true },
      }),
      // Cantidad de cuentas este mes
      db.cuentaCobro.count({
        where: {
          userId: user.id,
          fecha: { gte: inicioMes },
        },
      }),
    ])

    // Total cobrado (pagadas)
    const totalCobrado = await db.cuentaCobro.aggregate({
      where: {
        userId: user.id,
        estado: 'PAGADA',
      },
      _sum: { total: true },
    })

    // Total pendiente de cobro
    const totalPendiente = await db.cuentaCobro.aggregate({
      where: {
        userId: user.id,
        estado: { in: ['EMITIDA', 'ENVIADA', 'VENCIDA'] },
      },
      _sum: { total: true },
    })

    // Últimas 5 cuentas
    const ultimasCuentas = await db.cuentaCobro.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        numeroCuenta: true,
        clienteNombre: true,
        total: true,
        estado: true,
        fecha: true,
      },
    })

    // Top 5 clientes por monto
    const topClientes = await db.cuentaCobro.groupBy({
      by: ['clienteId', 'clienteNombre'],
      where: {
        userId: user.id,
        estado: { in: ['EMITIDA', 'ENVIADA', 'PAGADA'] },
      },
      _sum: { total: true },
      _count: true,
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    })

    return NextResponse.json({
      resumen: {
        totalCuentas,
        cuentasEmitidas,
        cuentasPagadas,
        cuentasPendientes,
        cuentasMes,
      },
      montos: {
        totalMes: Number(totalMes._sum.total) || 0,
        totalCobrado: Number(totalCobrado._sum.total) || 0,
        totalPendiente: Number(totalPendiente._sum.total) || 0,
      },
      ultimasCuentas,
      topClientes: topClientes.map((c) => ({
        clienteId: c.clienteId,
        clienteNombre: c.clienteNombre,
        totalFacturado: Number(c._sum.total) || 0,
        cantidadCuentas: c._count,
      })),
    })
  } catch (error) {
    console.error('[API CuentaCobro Estadisticas] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
