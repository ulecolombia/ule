/**
 * ULE - API DE CLIENTE POR ID
 * Endpoints para operaciones sobre un cliente específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createClienteSchema } from '@/lib/validations/cliente'
import { z } from 'zod'
import { RegimenTributario } from '@prisma/client'

/**
 * GET /api/clientes/[id]
 * Obtiene un cliente específico con sus facturas recientes
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Obtener cliente con facturas recientes
    const cliente = await db.cliente.findFirst({
      where: {
        id: params.id,
        userId: user.id, // Seguridad: solo sus propios clientes
      },
      include: {
        _count: {
          select: { facturas: true },
        },
        facturas: {
          select: {
            id: true,
            numeroFactura: true,
            fecha: true,
            total: true,
            estado: true,
          },
          orderBy: { fecha: 'desc' },
          take: 5, // Últimas 5 facturas
        },
      },
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ cliente })
  } catch (error) {
    console.error('[API Cliente GET] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/clientes/[id]
 * Actualiza un cliente existente
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validar
    const schema = createClienteSchema(body.tipoDocumento)
    const validatedData = schema.parse(body)

    // Verificar que el cliente existe y pertenece al usuario
    const clienteExistente = await db.cliente.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Si cambió el documento, verificar que no exista otro con ese documento
    if (validatedData.numeroDocumento !== clienteExistente.numeroDocumento) {
      const documentoDuplicado = await db.cliente.findFirst({
        where: {
          userId: user.id,
          numeroDocumento: validatedData.numeroDocumento,
          id: { not: params.id },
        },
      })

      if (documentoDuplicado) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con este documento' },
          { status: 400 }
        )
      }
    }

    // Actualizar - cast para campos opcionales de empresa
    const dataAsRecord = validatedData as Record<string, unknown>
    const clienteActualizado = await db.cliente.update({
      where: { id: params.id },
      data: {
        nombre: validatedData.nombre,
        tipoDocumento: validatedData.tipoDocumento,
        numeroDocumento: validatedData.numeroDocumento,
        email: validatedData.email,
        telefono: validatedData.telefono,
        direccion: validatedData.direccion,
        ciudad: validatedData.ciudad,
        departamento: validatedData.departamento,
        // Campos adicionales para empresas (NIT)
        razonSocial: (dataAsRecord.razonSocial as string) || undefined,
        nombreComercial: (dataAsRecord.nombreComercial as string) || undefined,
        regimenTributario:
          (dataAsRecord.regimenTributario as RegimenTributario) || undefined,
        responsabilidadFiscal:
          (dataAsRecord.responsabilidadFiscal as string) || undefined,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: { facturas: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      cliente: clienteActualizado,
    })
  } catch (error) {
    console.error('[API Cliente PUT] Error:', error)

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
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/clientes/[id]
 * Elimina un cliente (solo si no tiene facturas)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar que el cliente existe y pertenece al usuario
    const cliente = await db.cliente.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        _count: {
          select: { facturas: true },
        },
      },
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si tiene facturas
    if (cliente._count.facturas > 0) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar',
          message: `Este cliente tiene ${cliente._count.facturas} factura(s) asociada(s). Por favor, elimina o reasigna las facturas primero.`,
          facturasCount: cliente._count.facturas,
        },
        { status: 400 }
      )
    }

    // Eliminar
    await db.cliente.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
    })
  } catch (error) {
    console.error('[API Cliente DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
}
