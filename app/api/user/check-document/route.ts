/**
 * ULE - CHECK DOCUMENT API
 * Valida si un documento ya existe en la base de datos
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { TipoDocumento } from '@prisma/client'

const checkDocumentSchema = z.object({
  tipoDocumento: z.nativeEnum(TipoDocumento),
  numeroDocumento: z.string().min(1, 'Número de documento requerido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar entrada
    const validation = checkDocumentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tipoDocumento, numeroDocumento } = validation.data

    // Buscar usuario con ese documento
    const existingUser = await db.user.findFirst({
      where: {
        tipoDocumento,
        numeroDocumento,
      },
      select: {
        id: true,
      },
    })

    return NextResponse.json({
      exists: !!existingUser,
      message: existingUser
        ? 'Este documento ya está registrado'
        : 'Documento disponible',
    })
  } catch (error) {
    console.error('Error checking document:', error)
    return NextResponse.json(
      { error: 'Error al verificar documento' },
      { status: 500 }
    )
  }
}
