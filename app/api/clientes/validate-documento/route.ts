/**
 * ULE - API DE VALIDACIÓN DE DOCUMENTO
 * Verifica si un número de documento ya está registrado
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { validarDocumentoSchema } from '@/lib/validations/cliente'
import { z } from 'zod'

/**
 * POST /api/clientes/validate-documento
 * Valida si un número de documento ya existe para el usuario
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

    // Validar datos
    const validatedData = validarDocumentoSchema.parse(body)

    // Buscar cliente con ese documento
    const exists = await db.cliente.findFirst({
      where: {
        userId: user.id,
        numeroDocumento: validatedData.numeroDocumento,
        ...(validatedData.excludeId && { id: { not: validatedData.excludeId } }),
      },
    })

    return NextResponse.json({
      exists: !!exists,
      available: !exists,
    })
  } catch (error) {
    console.error('[API Validate Documento] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al validar documento' },
      { status: 500 }
    )
  }
}
