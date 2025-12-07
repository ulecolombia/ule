import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, CategoriaFAQ } from '@prisma/client'

/**
 * Sanitizar búsqueda para prevenir inyección
 */
function sanitizarBusqueda(input: string): string {
  return input
    .replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/gi, '') // Remover caracteres especiales
    .trim()
    .slice(0, 100) // Limitar longitud
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoria = searchParams.get('categoria')
    const busquedaRaw = searchParams.get('busqueda')
    const ordenarPor = searchParams.get('ordenarPor') || 'popularidad' // popularidad | orden
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Máximo 100
    const skip = (page - 1) * limit

    // Sanitizar búsqueda
    const busqueda = busquedaRaw ? sanitizarBusqueda(busquedaRaw) : null

    // Construir filtros
    const where: Prisma.FAQWhereInput = {
      activa: true,
    }

    if (categoria && categoria !== 'TODAS') {
      // Validar que sea un valor válido del enum
      if (Object.values(CategoriaFAQ).includes(categoria as CategoriaFAQ)) {
        where.categoria = categoria as CategoriaFAQ
      }
    }

    if (busqueda) {
      where.OR = [
        { pregunta: { contains: busqueda, mode: 'insensitive' } },
        { descripcionCorta: { contains: busqueda, mode: 'insensitive' } },
        { tags: { has: busqueda.toLowerCase() } },
      ]
    }

    // Ordenamiento
    const orderBy: Prisma.FAQOrderByWithRelationInput[] = []
    if (ordenarPor === 'popularidad') {
      orderBy.push({ vecesConsultada: 'desc' })
    }
    orderBy.push({ orden: 'asc' })
    orderBy.push({ createdAt: 'desc' })

    // Obtener FAQs y total en paralelo
    const [faqs, total, estadisticas] = await Promise.all([
      prisma.fAQ.findMany({
        where,
        orderBy,
        take: limit,
        skip,
      }),
      prisma.fAQ.count({ where }),
      prisma.fAQ.aggregate({
        _sum: { vecesConsultada: true },
        _count: true,
        where, // Mismo filtro para estadísticas
      }),
    ])

    // Agrupar por categoría
    const faqsPorCategoria = faqs.reduce(
      (acc, faq) => {
        const categoria = faq.categoria
        if (!acc[categoria]) {
          acc[categoria] = []
        }
        acc[categoria]!.push(faq)
        return acc
      },
      {} as Record<string, typeof faqs>
    )

    return NextResponse.json({
      faqs: faqsPorCategoria,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + faqs.length < total,
      },
      estadisticas: {
        totalFAQs: estadisticas._count,
        totalConsultas: estadisticas._sum.vecesConsultada || 0,
      },
    })
  } catch (error) {
    console.error('Error al obtener FAQs:', error)
    return NextResponse.json(
      { error: 'Error al obtener FAQs' },
      { status: 500 }
    )
  }
}
