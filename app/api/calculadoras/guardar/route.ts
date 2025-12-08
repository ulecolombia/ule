/**
 * API DE CALCULADORAS - GUARDAR CÁLCULO
 * POST /api/calculadoras/guardar
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const guardarCalculoSchema = z.object({
  tipoCalculadora: z.enum([
    'RETENCION_FUENTE',
    'IVA',
    'PROYECCION_PILA',
    'SIMULADOR_REGIMEN',
    'CONVERSOR_UVT',
  ]),
  inputs: z.record(z.any()),
  resultados: z.record(z.any()),
  notas: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data = guardarCalculoSchema.parse(body)

    const calculo = await prisma.calculoGuardado.create({
      data: {
        userId: user.id,
        ...data,
      },
    })

    return NextResponse.json({
      success: true,
      calculo,
    })
  } catch (error) {
    console.error('[API Calculadoras] Error al guardar cálculo:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al guardar cálculo' },
      { status: 500 }
    )
  }
}
