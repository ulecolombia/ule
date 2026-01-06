/**
 * ULE - API DE DETALLE DE CUENTA DE COBRO
 * GET: Obtiene una cuenta de cobro por ID
 * PUT: Actualiza una cuenta de cobro
 * DELETE: Elimina una cuenta de cobro (solo borradores)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { guardarBorradorCuentaCobroSchema } from '@/lib/validations/cuenta-cobro'
import {
  calcularTotalesCuentaCobro,
  prepararItems,
} from '@/lib/utils/cuenta-cobro-utils'
import { z } from 'zod'

interface RouteParams {
  params: { id: string }
}

/**
 * GET /api/cuenta-cobro/[id]
 * Obtiene el detalle de una cuenta de cobro
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
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

    const cuentaCobro = await db.cuentaCobro.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        cliente: true,
        envios: {
          orderBy: { fechaEnvio: 'desc' },
        },
      },
    })

    if (!cuentaCobro) {
      return NextResponse.json(
        { error: 'Cuenta de cobro no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ cuentaCobro })
  } catch (error) {
    console.error('[API CuentaCobro GET ID] Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cuenta de cobro' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/cuenta-cobro/[id]
 * Actualiza una cuenta de cobro (solo borradores)
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    // Verificar que la cuenta existe y es del usuario
    const cuentaExistente = await db.cuentaCobro.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!cuentaExistente) {
      return NextResponse.json(
        { error: 'Cuenta de cobro no encontrada' },
        { status: 404 }
      )
    }

    if (cuentaExistente.estado !== 'BORRADOR') {
      return NextResponse.json(
        { error: 'Solo se pueden editar cuentas en estado borrador' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = guardarBorradorCuentaCobroSchema.parse(body)

    // Verificar cliente si se proporciona
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
          { error: 'Cliente no encontrado' },
          { status: 404 }
        )
      }
    }

    // Preparar items y calcular totales
    const items = prepararItems(validatedData.items || [])
    const totales = calcularTotalesCuentaCobro(items)

    // Actualizar cuenta de cobro
    const cuentaActualizada = await db.cuentaCobro.update({
      where: { id: params.id },
      data: {
        clienteId: validatedData.clienteId || cuentaExistente.clienteId,
        fecha: validatedData.fecha || cuentaExistente.fecha,
        fechaVencimiento: validatedData.fechaVencimiento,
        clienteNombre: cliente?.nombre || cuentaExistente.clienteNombre,
        clienteDocumento:
          cliente?.numeroDocumento || cuentaExistente.clienteDocumento,
        clienteTipoDoc:
          cliente?.tipoDocumento || cuentaExistente.clienteTipoDoc,
        clienteEmail: cliente?.email || cuentaExistente.clienteEmail,
        clienteTelefono: cliente?.telefono || cuentaExistente.clienteTelefono,
        clienteDireccion:
          cliente?.direccion || cuentaExistente.clienteDireccion,
        clienteCiudad: cliente?.ciudad || cuentaExistente.clienteCiudad,
        conceptos: items.length > 0 ? items : (cuentaExistente.conceptos ?? []),
        subtotal:
          items.length > 0 ? totales.subtotal : cuentaExistente.subtotal,
        total: items.length > 0 ? totales.total : cuentaExistente.total,
        notas: validatedData.notas,
        conceptoServicio: validatedData.conceptoServicio,
      },
      include: {
        cliente: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Cuenta de cobro actualizada',
      cuentaCobro: cuentaActualizada,
    })
  } catch (error) {
    console.error('[API CuentaCobro PUT] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar cuenta de cobro' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cuenta-cobro/[id]
 * Elimina una cuenta de cobro (solo borradores)
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
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

    // Verificar que la cuenta existe y es del usuario
    const cuenta = await db.cuentaCobro.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    })

    if (!cuenta) {
      return NextResponse.json(
        { error: 'Cuenta de cobro no encontrada' },
        { status: 404 }
      )
    }

    if (cuenta.estado !== 'BORRADOR') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar cuentas en estado borrador' },
        { status: 400 }
      )
    }

    await db.cuentaCobro.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Cuenta de cobro eliminada',
    })
  } catch (error) {
    console.error('[API CuentaCobro DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cuenta de cobro' },
      { status: 500 }
    )
  }
}
