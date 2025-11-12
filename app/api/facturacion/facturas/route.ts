/**
 * ULE - API ENDPOINT PARA LISTADO DE FACTURAS
 * Lista facturas con filtros avanzados y organización por mes
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/facturacion/facturas
 * Lista facturas con filtros y paginación
 *
 * Query params:
 * - estado: BORRADOR | EMITIDA | ANULADA | VENCIDA
 * - fechaDesde: ISO date
 * - fechaHasta: ISO date
 * - clienteId: string
 * - montoMin: number
 * - montoMax: number
 * - busqueda: string (busca en número de factura)
 * - page: number (default 1)
 * - limit: number (default 50)
 *
 * Response:
 * {
 *   facturasPorMes: [
 *     {
 *       mes: 'Enero 2025',
 *       mesNumero: 1,
 *       año: 2025,
 *       facturas: [...],
 *       totalMes: 1500000,
 *       cantidadFacturas: 10
 *     }
 *   ],
 *   pagination: {
 *     total: 100,
 *     page: 1,
 *     limit: 50,
 *     totalPages: 2
 *   }
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
    // PARSEAR QUERY PARAMS
    // ==============================================

    const { searchParams } = new URL(req.url)

    const estado = searchParams.get('estado') as
      | 'BORRADOR'
      | 'EMITIDA'
      | 'ANULADA'
      | 'VENCIDA'
      | null

    const fechaDesde = searchParams.get('fechaDesde')
      ? new Date(searchParams.get('fechaDesde')!)
      : null

    const fechaHasta = searchParams.get('fechaHasta')
      ? new Date(searchParams.get('fechaHasta')!)
      : null

    const clienteId = searchParams.get('clienteId')

    const montoMin = searchParams.get('montoMin')
      ? parseFloat(searchParams.get('montoMin')!)
      : null

    const montoMax = searchParams.get('montoMax')
      ? parseFloat(searchParams.get('montoMax')!)
      : null

    const busqueda = searchParams.get('busqueda')

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // ==============================================
    // CONSTRUIR WHERE CLAUSE
    // ==============================================

    const where: any = {
      userId: user.id,
    }

    if (estado) {
      where.estado = estado
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}
      if (fechaDesde) {
        where.fecha.gte = fechaDesde
      }
      if (fechaHasta) {
        where.fecha.lte = fechaHasta
      }
    }

    if (clienteId) {
      where.clienteId = clienteId
    }

    if (montoMin !== null || montoMax !== null) {
      where.total = {}
      if (montoMin !== null) {
        where.total.gte = montoMin
      }
      if (montoMax !== null) {
        where.total.lte = montoMax
      }
    }

    if (busqueda) {
      where.numeroFactura = {
        contains: busqueda,
        mode: 'insensitive',
      }
    }

    // ==============================================
    // OBTENER FACTURAS
    // ==============================================

    const [facturas, total] = await Promise.all([
      db.factura.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              email: true,
              numeroDocumento: true,
            },
          },
        },
        orderBy: [
          { fecha: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.factura.count({ where }),
    ])

    // ==============================================
    // ORGANIZAR POR MES
    // ==============================================

    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]

    // Agrupar facturas por mes
    const facturasPorMes = new Map<
      string,
      {
        mes: string
        mesNumero: number
        año: number
        facturas: any[]
        totalMes: number
        cantidadFacturas: number
      }
    >()

    facturas.forEach((factura) => {
      const fecha = new Date(factura.fecha)
      const mesNumero = fecha.getMonth() + 1
      const año = fecha.getFullYear()
      const mesNombre = meses[fecha.getMonth()]
      const key = `${año}-${mesNumero}`

      if (!facturasPorMes.has(key)) {
        facturasPorMes.set(key, {
          mes: `${mesNombre} ${año}`,
          mesNumero,
          año,
          facturas: [],
          totalMes: 0,
          cantidadFacturas: 0,
        })
      }

      const grupo = facturasPorMes.get(key)!
      grupo.facturas.push({
        id: factura.id,
        numeroFactura: factura.numeroFactura,
        fecha: factura.fecha,
        fechaEmision: factura.fechaEmision,
        estado: factura.estado,
        total: Number(factura.total),
        subtotal: Number(factura.subtotal),
        totalIva: Number(factura.totalIva),
        cliente: factura.cliente,
        cufe: factura.cufe,
        pdfUrl: factura.pdfUrl,
        xmlUrl: factura.xmlUrl,
      })
      grupo.totalMes += Number(factura.total)
      grupo.cantidadFacturas += 1
    })

    // Convertir Map a array y ordenar por fecha (más reciente primero)
    const facturasPorMesArray = Array.from(facturasPorMes.values()).sort(
      (a, b) => {
        if (a.año !== b.año) {
          return b.año - a.año
        }
        return b.mesNumero - a.mesNumero
      }
    )

    // ==============================================
    // PAGINACIÓN
    // ==============================================

    const pagination = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }

    return NextResponse.json({
      facturasPorMes: facturasPorMesArray,
      pagination,
    })
  } catch (error) {
    console.error('[API Lista Facturas] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}
