/**
 * API - GESTIÓN DE ALERTAS DE SEGURIDAD
 * Listado y gestión de alertas generadas automáticamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().min(10).max(100).default(20),
  estado: z.string().optional(),
  severidad: z.string().optional(),
  tipo: z.string().optional(),
})

/**
 * GET - Listar alertas de seguridad
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    // ✅ ALTO #10: Verificar permisos desde JWT (sin query a DB)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!session.user.isAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const params = querySchema.parse(searchParams)

    // ✅ MEDIO #18: Type safety con Prisma types
    const where: Prisma.AlertaSeguridadWhereInput = {}
    if (params.estado) where.estado = params.estado as any // EstadoAlerta enum
    if (params.severidad) where.severidad = params.severidad as any // SeveridadAlerta enum
    if (params.tipo) where.tipo = params.tipo as any // TipoAlerta enum

    const skip = (params.page - 1) * params.limit

    const [alertas, total] = await Promise.all([
      db.alertaSeguridad.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: [{ severidad: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nombre: true,
              name: true,
            },
          },
        },
      }),
      db.alertaSeguridad.count({ where }),
    ])

    return NextResponse.json({
      alertas,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    })
  } catch (error) {
    console.error('Error obteniendo alertas:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al obtener alertas' },
      { status: 500 }
    )
  }
}
