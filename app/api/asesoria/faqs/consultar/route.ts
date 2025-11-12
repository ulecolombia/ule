import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const consultarFAQSchema = z.object({
  faqId: z.string().cuid(),
  conversacionId: z.string().cuid().optional(),
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
    const { faqId, conversacionId } = consultarFAQSchema.parse(body)

    // Verificar que FAQ existe
    const faq = await prisma.fAQ.findUnique({
      where: { id: faqId },
    })

    if (!faq) {
      return NextResponse.json(
        { error: 'FAQ no encontrada' },
        { status: 404 }
      )
    }

    // Registrar consulta
    await prisma.consultaFAQ.create({
      data: {
        faqId,
        userId: user.id,
        conversacionId,
      },
    })

    // Incrementar contador
    await prisma.fAQ.update({
      where: { id: faqId },
      data: {
        vecesConsultada: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      pregunta: faq.pregunta,
    })
  } catch (error) {
    console.error('Error al registrar consulta FAQ:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al registrar consulta' },
      { status: 500 }
    )
  }
}
