/**
 * ULE - API DE CUENTA DE COBRO
 * Endpoints para crear y gestionar cuentas de cobro
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  crearCuentaCobroSchema,
  guardarBorradorCuentaCobroSchema,
} from '@/lib/validations/cuenta-cobro'
import {
  calcularTotalesCuentaCobro,
  generarNumeroCuentaCobro,
  extraerNumeroDeCuentaCobro,
  prepararItems,
} from '@/lib/utils/cuenta-cobro-utils'
import { z } from 'zod'

/**
 * GET /api/cuenta-cobro
 * Lista cuentas de cobro del usuario con paginación y filtros
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

    // Filtro por búsqueda (número de cuenta o nombre de cliente)
    if (search) {
      where.OR = [
        { numeroCuenta: { contains: search, mode: 'insensitive' } },
        { clienteNombre: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filtro por estado
    if (estado && estado !== 'TODOS') {
      where.estado = estado
    }

    const [cuentas, total] = await Promise.all([
      db.cuentaCobro.findMany({
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
      db.cuentaCobro.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      cuentas,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('[API CuentaCobro GET] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cuentas de cobro' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cuenta-cobro
 * Crea una nueva cuenta de cobro (borrador o emitida)
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
      validatedData = guardarBorradorCuentaCobroSchema.parse(body)
    } else {
      validatedData = crearCuentaCobroSchema.parse(body)
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

    // Preparar items y calcular totales
    const items = prepararItems(validatedData.items || [])
    const totales = calcularTotalesCuentaCobro(items)

    // Obtener última cuenta de cobro para generar el siguiente número
    const ultimaCuenta = await db.cuentaCobro.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { numeroCuenta: true },
    })

    const ultimoNumero = ultimaCuenta?.numeroCuenta
      ? extraerNumeroDeCuentaCobro(ultimaCuenta.numeroCuenta)
      : 0

    // Generar número de cuenta
    const numeroCuenta = generarNumeroCuentaCobro(ultimoNumero, 'CC')

    // Crear cuenta de cobro en base de datos
    const nuevaCuenta = await db.cuentaCobro.create({
      data: {
        userId: user.id,
        clienteId: validatedData.clienteId!,
        numeroCuenta,
        fecha: validatedData.fecha || new Date(),
        fechaVencimiento: validatedData.fechaVencimiento || null,
        // Información del emisor (persona natural)
        emisorNombre: user.name || 'Sin nombre',
        emisorDocumento: user.numeroDocumento || 'Sin documento',
        emisorTipoDoc: user.tipoDocumento || 'CC',
        emisorEmail: user.email,
        emisorTelefono: user.telefono || null,
        emisorDireccion: user.direccion || null,
        emisorCiudad: user.ciudad || null,
        emisorBanco: user.nombreBanco || null,
        emisorTipoCuenta: user.tipoCuenta || null,
        emisorNumeroCuenta: user.numeroCuenta || null,
        // Información del cliente
        clienteNombre: cliente?.nombre || 'Cliente sin nombre',
        clienteDocumento: cliente?.numeroDocumento || 'Sin documento',
        clienteTipoDoc: cliente?.tipoDocumento || 'NIT',
        clienteEmail: cliente?.email || null,
        clienteTelefono: cliente?.telefono || null,
        clienteDireccion: cliente?.direccion || null,
        clienteCiudad: cliente?.ciudad || null,
        // Items y totales
        conceptos: items,
        subtotal: totales.subtotal,
        total: totales.total,
        estado: validatedData.estado || 'BORRADOR',
        notas: validatedData.notas || null,
        conceptoServicio: validatedData.conceptoServicio || null,
        declaracionNoIVA: true,
        // Fecha de emisión si no es borrador
        fechaEmision: validatedData.estado === 'EMITIDA' ? new Date() : null,
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
            ? 'Cuenta de cobro emitida exitosamente'
            : 'Borrador guardado exitosamente',
        cuentaCobro: nuevaCuenta,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API CuentaCobro POST] Error:', error)

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
      { error: 'Error al crear cuenta de cobro' },
      { status: 500 }
    )
  }
}
