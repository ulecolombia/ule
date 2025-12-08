/**
 * ULE - API DE FACTURACIÓN
 * Endpoints para crear y gestionar facturas electrónicas
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  crearFacturaSchema,
  guardarBorradorSchema,
} from '@/lib/validations/factura'
import {
  calcularTotalesFactura,
  generarNumeroFactura,
  generarCUFE,
  extraerNumeroDeFactura,
} from '@/lib/utils/facturacion-utils'
import { z } from 'zod'

/**
 * GET /api/facturacion
 * Lista facturas del usuario con paginación y filtros
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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || ''

    const where: any = { userId: user.id }

    // Filtro por búsqueda (número de factura o nombre de cliente)
    if (search) {
      where.OR = [
        { numeroFactura: { contains: search, mode: 'insensitive' } },
        {
          cliente: {
            nombre: { contains: search, mode: 'insensitive' },
          },
        },
      ]
    }

    // Filtro por estado
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }

    const [facturas, total] = await Promise.all([
      db.factura.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              numeroDocumento: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.factura.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      facturas,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('[API Facturacion GET] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/facturacion
 * Crea una nueva factura (borrador o emitida)
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json()

    // Validar según el estado
    let validatedData
    if (body.estado === 'BORRADOR') {
      validatedData = guardarBorradorSchema.parse(body)
    } else {
      validatedData = crearFacturaSchema.parse(body)
    }

    // Verificar que el cliente existe y pertenece al usuario
    let cliente = null
    if (validatedData.clienteId) {
      cliente = await db.cliente.findFirst({
        where: {
          id: validatedData.clienteId,
          userId: user.id,
        },
      })

      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente no encontrado o no pertenece al usuario' },
          { status: 404 }
        )
      }
    }

    // Calcular totales
    const totales = calcularTotalesFactura(validatedData.items || [])

    // Obtener última factura del usuario para generar el siguiente número
    const ultimaFactura = await db.factura.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { numeroFactura: true },
    })

    const ultimoNumero = ultimaFactura?.numeroFactura
      ? extraerNumeroDeFactura(ultimaFactura.numeroFactura)
      : 0

    // Generar número de factura
    const numeroFactura = generarNumeroFactura(ultimoNumero, 'ULE')

    // Generar CUFE solo si es EMITIDA
    let cufe: string | undefined
    if (validatedData.estado === 'EMITIDA') {
      cufe = generarCUFE(
        numeroFactura,
        validatedData.fecha || new Date(),
        user.numeroDocumento || '900000000-0',
        totales.total
      )
    }

    // Crear factura en base de datos
    const nuevaFactura = await db.factura.create({
      data: {
        userId: user.id,
        clienteId: validatedData.clienteId!,
        numeroFactura,
        fecha: validatedData.fecha || new Date(),
        metodoPago: validatedData.metodoPago,
        // Información desnormalizada del cliente
        clienteNombre: cliente?.nombre || 'Cliente sin nombre',
        clienteDocumento: cliente?.numeroDocumento || 'Sin documento',
        clienteEmail: cliente?.email,
        clienteTelefono: cliente?.telefono,
        clienteDireccion: cliente?.direccion,
        clienteCiudad: cliente?.ciudad,
        // Items y totales
        conceptos: validatedData.items || [],
        subtotal: totales.subtotal,
        totalIva: totales.totalIva,
        total: totales.total,
        estado: validatedData.estado || 'BORRADOR',
        cufe,
        notas: validatedData.notas || null,
        terminosPago: validatedData.terminos || null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            numeroDocumento: true,
            email: true,
            telefono: true,
            direccion: true,
            ciudad: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message:
          validatedData.estado === 'EMITIDA'
            ? 'Factura emitida exitosamente'
            : 'Borrador guardado exitosamente',
        factura: nuevaFactura,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API Facturacion POST] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear factura' },
      { status: 500 }
    )
  }
}
