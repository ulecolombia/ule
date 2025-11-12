import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CURRENT_TERMS_VERSION, TIPOS_TERMINOS } from '@/lib/constants/terms'

export async function GET(req: NextRequest) {
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

    // Verificar si ya aceptó términos de asesoría IA (versión actual)
    const terminoAceptado = await prisma.terminosAceptados.findFirst({
      where: {
        userId: user.id,
        tipoTermino: TIPOS_TERMINOS.ASESORIA_IA,
        version: CURRENT_TERMS_VERSION,
      },
    })

    return NextResponse.json({
      aceptado: !!terminoAceptado,
      fechaAceptacion: terminoAceptado?.fechaAceptacion,
    })
  } catch (error) {
    console.error('Error al verificar términos:', error)
    return NextResponse.json(
      { error: 'Error al verificar términos' },
      { status: 500 }
    )
  }
}
