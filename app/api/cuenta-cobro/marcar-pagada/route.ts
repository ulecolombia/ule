/**
 * ULE - API PARA MARCAR CUENTA DE COBRO COMO PAGADA
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const marcarPagadaSchema = z.object({
  cuentaCobroId: z.string().min(1, 'ID requerido'),
})

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
    const { cuentaCobroId } = marcarPagadaSchema.parse(body)

    const cuenta = await db.cuentaCobro.findFirst({
      where: {
        id: cuentaCobroId,
        userId: user.id,
      },
    })

    if (!cuenta) {
      return NextResponse.json(
        { error: 'Cuenta de cobro no encontrada' },
        { status: 404 }
      )
    }

    if (!['EMITIDA', 'ENVIADA', 'VENCIDA'].includes(cuenta.estado)) {
      return NextResponse.json(
        {
          error:
            'Solo se pueden marcar como pagadas cuentas emitidas o enviadas',
        },
        { status: 400 }
      )
    }

    const cuentaActualizada = await db.cuentaCobro.update({
      where: { id: cuentaCobroId },
      data: { estado: 'PAGADA' },
    })

    return NextResponse.json({
      success: true,
      message: 'Cuenta marcada como pagada',
      cuentaCobro: cuentaActualizada,
    })
  } catch (error) {
    console.error('[API CuentaCobro MarcarPagada] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Error al marcar como pagada' },
      { status: 500 }
    )
  }
}
