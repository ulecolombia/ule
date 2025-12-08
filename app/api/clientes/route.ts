/**
 * ULE - API DE CLIENTES
 * Endpoints para gestión de clientes de facturación
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createClienteSchema } from '@/lib/validations/cliente'
import { z } from 'zod'
import { RegimenTributario } from '@prisma/client'

/**
 * GET /api/clientes
 * Lista clientes con paginación, búsqueda y filtros
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Obtener usuario
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Parámetros de consulta
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const tipoDocumento = searchParams.get('tipoDocumento') || ''

    // Construir filtros
    const where: any = {
      userId: user.id,
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { numeroDocumento: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (tipoDocumento && tipoDocumento !== 'TODOS') {
      where.tipoDocumento = tipoDocumento
    }

    // Contar total
    const total = await db.cliente.count({ where })

    // Obtener clientes con count de facturas
    const clientes = await db.cliente.findMany({
      where,
      include: {
        _count: {
          select: { facturas: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({
      clientes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[API Clientes GET] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/clientes
 * Crea un nuevo cliente
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

    // Validar con schema apropiado
    const schema = createClienteSchema(body.tipoDocumento)
    const validatedData = schema.parse(body)

    // Verificar que el documento no exista para este usuario
    const existingCliente = await db.cliente.findFirst({
      where: {
        userId: user.id,
        numeroDocumento: validatedData.numeroDocumento,
      },
    })

    if (existingCliente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este documento' },
        { status: 400 }
      )
    }

    // Crear cliente
    const nuevoCliente = await db.cliente.create({
      data: {
        userId: user.id,
        nombre: validatedData.nombre,
        tipoDocumento: validatedData.tipoDocumento,
        numeroDocumento: validatedData.numeroDocumento,
        email: validatedData.email,
        telefono: validatedData.telefono,
        direccion: validatedData.direccion,
        ciudad: validatedData.ciudad,
        departamento: validatedData.departamento,
        // Campos adicionales para empresas (NIT)
        razonSocial: (validatedData as Record<string, unknown>).razonSocial as
          | string
          | undefined,
        nombreComercial: (validatedData as Record<string, unknown>)
          .nombreComercial as string | undefined,
        regimenTributario: (validatedData as Record<string, unknown>)
          .regimenTributario as RegimenTributario | undefined,
        responsabilidadFiscal: (validatedData as Record<string, unknown>)
          .responsabilidadFiscal as string | undefined,
      },
      include: {
        _count: {
          select: { facturas: true },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Cliente creado exitosamente',
        cliente: nuevoCliente,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API Clientes POST] Error:', error)

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
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}
