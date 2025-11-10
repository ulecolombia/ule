/**
 * ULE - API ROUTE DE REGISTRO
 * Endpoint para crear nuevos usuarios
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { registerSchema } from '@/lib/validations/auth'
import { Prisma } from '@prisma/client'
import { rateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit'
import { isCommonPassword, isSimilarToUserInfo } from '@/lib/password-security'

/**
 * API Route: Registro de usuarios
 * POST /api/auth/register
 */
export async function POST(request: Request) {
  try {
    // Rate limiting: 3 registros por IP cada hora
    const ip = getClientIp(request)
    const rateLimitResult = await rateLimit(`register:${ip}`, RATE_LIMITS.REGISTER)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          message: 'Demasiados intentos de registro. Por favor intenta más tarde.',
        },
        {
          status: 429,
        }
      )
    }

    const body = await request.json()

    // Validar datos con Zod
    const validatedFields = registerSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { message: 'Datos inválidos', errors: validatedFields.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password } = validatedFields.data

    // Validación avanzada de contraseña
    if (isCommonPassword(password)) {
      return NextResponse.json(
        { message: 'Esta contraseña es muy común. Por favor elige una más segura.' },
        { status: 400 }
      )
    }

    if (isSimilarToUserInfo(password, { name, email })) {
      return NextResponse.json(
        { message: 'La contraseña no debe contener tu email o nombre.' },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este email ya está registrado' },
        { status: 409 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password)

    // Crear usuario en la base de datos
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'USER', // Rol por defecto
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    console.log(`[Ule Auth] Usuario creado: ${user.email}`)

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Ule Auth] Error en registro:', error)

    // Manejar errores específicos de Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'Este email ya está registrado' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
