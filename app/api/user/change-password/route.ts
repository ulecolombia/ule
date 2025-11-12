/**
 * ULE - CHANGE PASSWORD API
 * Endpoint para cambiar contraseña del usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'
import { hash, compare } from 'bcrypt'

const cambioPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe tener al menos una minúscula')
      .regex(/[0-9]/, 'Debe tener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const validated = cambioPasswordSchema.parse(body)

    // Obtener usuario con password
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario tenga contraseña (no sea OAuth)
    if (!user.password) {
      return NextResponse.json(
        { error: 'No puedes cambiar la contraseña de una cuenta OAuth' },
        { status: 400 }
      )
    }

    // Verificar contraseña actual
    const isValidPassword = await compare(
      validated.currentPassword,
      user.password
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 400 }
      )
    }

    // Hash nueva contraseña
    const hashedPassword = await hash(validated.newPassword, 10)

    // Actualizar
    await db.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    })

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    })
  } catch (error) {
    console.error('[Change Password API] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al cambiar contraseña' },
      { status: 500 }
    )
  }
}
