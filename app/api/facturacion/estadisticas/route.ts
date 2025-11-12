/**
 * ULE - API ENDPOINT PARA ESTADÍSTICAS DE FACTURACIÓN
 * Retorna métricas del dashboard y datos para gráficos
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/facturacion/estadisticas
 * Obtiene estadísticas de facturación para el dashboard
 *
 * Response:
 * {
 *   totalFacturadoMes: 5000000,
 *   totalFacturadoAño: 50000000,
 *   facturasPendientes: 5,
 *   promedioFactura: 500000,
 *   facturacionMensual: [
 *     { mes: 'Ene', total: 1000000 },
 *     ...
 *   ],
 *   topClientes: [
 *     {
 *       clienteId: '...',
 *       clienteNombre: 'Cliente ABC',
 *       totalFacturado: 2000000,
 *       cantidadFacturas: 5
 *     },
 *     ...
 *   ]
 * }
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

    // ==============================================
    // CALCULAR FECHAS
    // ==============================================

    const now = new Date()
    const inicioMesActual = new Date(now.getFullYear(), now.getMonth(), 1)
    const inicioAñoActual = new Date(now.getFullYear(), 0, 1)

    // Para el gráfico: últimos 6 meses
    const hace6Meses = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    // ==============================================
    // 1. TOTAL FACTURADO MES ACTUAL
    // ==============================================

    const facturasEmitidas = await db.factura.findMany({
      where: {
        userId: user.id,
        estado: 'EMITIDA',
        fechaEmision: {
          gte: inicioMesActual,
        },
      },
      select: {
        total: true,
      },
    })

    const totalFacturadoMes = facturasEmitidas.reduce(
      (sum, f) => sum + Number(f.total),
      0
    )

    // ==============================================
    // 2. TOTAL FACTURADO AÑO ACTUAL
    // ==============================================

    const facturasAño = await db.factura.findMany({
      where: {
        userId: user.id,
        estado: 'EMITIDA',
        fechaEmision: {
          gte: inicioAñoActual,
        },
      },
      select: {
        total: true,
      },
    })

    const totalFacturadoAño = facturasAño.reduce(
      (sum, f) => sum + Number(f.total),
      0
    )

    // ==============================================
    // 3. FACTURAS PENDIENTES (BORRADORES)
    // ==============================================

    const facturasPendientes = await db.factura.count({
      where: {
        userId: user.id,
        estado: 'BORRADOR',
      },
    })

    // ==============================================
    // 4. PROMEDIO POR FACTURA
    // ==============================================

    const cantidadEmitidas = facturasEmitidas.length
    const promedioFactura =
      cantidadEmitidas > 0 ? totalFacturadoMes / cantidadEmitidas : 0

    // ==============================================
    // 5. FACTURACIÓN MENSUAL (ÚLTIMOS 6 MESES)
    // ==============================================

    const facturasUltimos6Meses = await db.factura.findMany({
      where: {
        userId: user.id,
        estado: 'EMITIDA',
        fechaEmision: {
          gte: hace6Meses,
        },
      },
      select: {
        fechaEmision: true,
        total: true,
      },
      orderBy: {
        fechaEmision: 'asc',
      },
    })

    // Agrupar por mes
    const mesesAbreviados = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ]

    const facturacionPorMes = new Map<string, number>()

    // Inicializar últimos 6 meses con 0
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}`
      const label = mesesAbreviados[fecha.getMonth()]
      facturacionPorMes.set(key, 0)
    }

    // Sumar facturas
    facturasUltimos6Meses.forEach((factura) => {
      if (factura.fechaEmision) {
        const fecha = new Date(factura.fechaEmision)
        const key = `${fecha.getFullYear()}-${fecha.getMonth()}`
        const current = facturacionPorMes.get(key) || 0
        facturacionPorMes.set(key, current + Number(factura.total))
      }
    })

    // Convertir a array con labels
    const facturacionMensual: { mes: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}`
      const label = mesesAbreviados[fecha.getMonth()]
      const total = facturacionPorMes.get(key) || 0
      facturacionMensual.push({ mes: label, total })
    }

    // ==============================================
    // 6. TOP 5 CLIENTES
    // ==============================================

    // Obtener todas las facturas emitidas del año actual con cliente
    const facturasConCliente = await db.factura.findMany({
      where: {
        userId: user.id,
        estado: 'EMITIDA',
        fechaEmision: {
          gte: inicioAñoActual,
        },
      },
      select: {
        clienteId: true,
        total: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    // Agrupar por cliente
    const clientesMap = new Map<
      string,
      {
        clienteId: string
        clienteNombre: string
        totalFacturado: number
        cantidadFacturas: number
      }
    >()

    facturasConCliente.forEach((factura) => {
      const clienteId = factura.clienteId
      const clienteNombre = factura.cliente.nombre

      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          clienteId,
          clienteNombre,
          totalFacturado: 0,
          cantidadFacturas: 0,
        })
      }

      const cliente = clientesMap.get(clienteId)!
      cliente.totalFacturado += Number(factura.total)
      cliente.cantidadFacturas += 1
    })

    // Convertir a array y ordenar por total facturado
    const topClientes = Array.from(clientesMap.values())
      .sort((a, b) => b.totalFacturado - a.totalFacturado)
      .slice(0, 5)

    // ==============================================
    // RESPUESTA
    // ==============================================

    return NextResponse.json({
      totalFacturadoMes,
      totalFacturadoAño,
      facturasPendientes,
      promedioFactura,
      facturacionMensual,
      topClientes,
    })
  } catch (error) {
    console.error('[API Estadísticas Facturación] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
