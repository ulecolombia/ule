/**
 * ULE - API PARA EMITIR CUENTA DE COBRO
 * Cambia el estado de borrador a emitida
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { emitirCuentaCobroSchema } from '@/lib/validations/cuenta-cobro'
import { z } from 'zod'

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
    const { cuentaCobroId } = emitirCuentaCobroSchema.parse(body)

    // Buscar la cuenta de cobro
    const cuentaCobro = await db.cuentaCobro.findFirst({
      where: {
        id: cuentaCobroId,
        userId: user.id,
      },
    })

    if (!cuentaCobro) {
      return NextResponse.json(
        { error: 'Cuenta de cobro no encontrada' },
        { status: 404 }
      )
    }

    if (cuentaCobro.estado !== 'BORRADOR') {
      return NextResponse.json(
        { error: 'Solo se pueden emitir cuentas en estado borrador' },
        { status: 400 }
      )
    }

    // Validar que tenga los datos mínimos
    if (!cuentaCobro.clienteId) {
      return NextResponse.json(
        { error: 'La cuenta de cobro debe tener un cliente asignado' },
        { status: 400 }
      )
    }

    const conceptos = cuentaCobro.conceptos as any[]
    if (!conceptos || conceptos.length === 0) {
      return NextResponse.json(
        { error: 'La cuenta de cobro debe tener al menos un concepto' },
        { status: 400 }
      )
    }

    // Emitir la cuenta de cobro
    const cuentaEmitida = await db.cuentaCobro.update({
      where: { id: cuentaCobroId },
      data: {
        estado: 'EMITIDA',
        fechaEmision: new Date(),
      },
      include: {
        cliente: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Cuenta de cobro emitida exitosamente',
      cuentaCobro: cuentaEmitida,
    })
  } catch (error) {
    console.error('[API CuentaCobro Emitir] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al emitir cuenta de cobro' },
      { status: 500 }
    )
  }
}
