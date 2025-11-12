import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const aceptarTerminosSchema = z.object({
  tipoTermino: z.enum(['ASESORIA_IA', 'USO_PLATAFORMA', 'PRIVACIDAD', 'LIMITACION_RESPONSABILIDAD']),
  version: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
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
    const { tipoTermino, version } = aceptarTerminosSchema.parse(body)

    // Obtener IP y User Agent
    const ipAddress = req.headers.get('x-forwarded-for') ||
                     req.headers.get('x-real-ip') ||
                     'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Registrar aceptación
    const terminoAceptado = await prisma.terminosAceptados.create({
      data: {
        userId: user.id,
        tipoTermino,
        version,
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.json({
      success: true,
      terminoAceptado,
    })
  } catch (error) {
    console.error('Error al aceptar términos:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al registrar aceptación' },
      { status: 500 }
    )
  }
}
