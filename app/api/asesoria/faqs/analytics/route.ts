import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Top 10 FAQs más consultadas
    const topFAQs = await prisma.fAQ.findMany({
      where: { activa: true },
      orderBy: { vecesConsultada: 'desc' },
      take: 10,
      select: {
        id: true,
        pregunta: true,
        categoria: true,
        vecesConsultada: true,
      },
    })

    // Consultas por categoría
    const consultasPorCategoria = await prisma.fAQ.groupBy({
      by: ['categoria'],
      _sum: {
        vecesConsultada: true,
      },
      where: { activa: true },
    })

    // Tendencias recientes (últimos 30 días)
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)

    const consultasRecientes = await prisma.consultaFAQ.groupBy({
      by: ['faqId'],
      _count: true,
      where: {
        timestamp: { gte: hace30Dias },
      },
      orderBy: {
        _count: {
          faqId: 'desc',
        },
      },
      take: 5,
    })

    // Obtener detalles de FAQs tendencia
    const faqsTendencia = await prisma.fAQ.findMany({
      where: {
        id: { in: consultasRecientes.map((c) => c.faqId) },
      },
      select: {
        id: true,
        pregunta: true,
        categoria: true,
      },
    })

    // Total de consultas
    const totalConsultas = await prisma.consultaFAQ.count()

    return NextResponse.json({
      topFAQs,
      consultasPorCategoria,
      tendencias: faqsTendencia,
      totalConsultas,
    })
  } catch (error) {
    console.error('Error al obtener analytics:', error)
    return NextResponse.json(
      { error: 'Error al obtener analytics' },
      { status: 500 }
    )
  }
}
