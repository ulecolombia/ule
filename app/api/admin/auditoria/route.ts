/**
 * API - CONSULTA DE LOGS DE AUDITORÍA
 * Endpoint para que administradores consulten logs con filtros avanzados
 *
 * OPTIMIZACIONES IMPLEMENTADAS:
 * - Límite de páginas (previene queries muy lentas)
 * - Type safety con Prisma types
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const MAX_PAGE = 1000 // ✅ CRÍTICO #6: Límite de páginas

const querySchema = z.object({
  page: z.coerce.number().min(1).max(MAX_PAGE).default(1),
  limit: z.coerce.number().min(10).max(100).default(50),
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  accion: z.string().optional(),
  categoria: z.string().optional(),
  nivelRiesgo: z.string().optional(),
  exitoso: z.coerce.boolean().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaFin: z.string().datetime().optional(),
  ip: z.string().optional(),
  busqueda: z.string().optional(),
  sortBy: z.enum(['timestamp', 'nivelRiesgo', 'accion']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET - Obtener logs de auditoría con filtros
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

    // Parsear query params
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const params = querySchema.parse(searchParams)

    // ✅ Validación adicional de página
    if (params.page > MAX_PAGE) {
      return NextResponse.json(
        {
          error: `Máximo ${MAX_PAGE} páginas. Para datos antiguos, usa filtros de fecha.`,
        },
        { status: 400 }
      )
    }

    // Construir filtros con type safety
    const where: Prisma.LogAuditoriaWhereInput = {}

    if (params.userId) where.userId = params.userId
    if (params.userEmail)
      where.userEmail = { contains: params.userEmail, mode: 'insensitive' }
    if (params.accion) where.accion = params.accion as any
    if (params.categoria) where.categoria = params.categoria as any
    if (params.nivelRiesgo) where.nivelRiesgo = params.nivelRiesgo as any
    if (params.exitoso !== undefined) where.exitoso = params.exitoso
    if (params.ip) where.ip = { contains: params.ip }

    // Filtro de fechas
    if (params.fechaInicio || params.fechaFin) {
      where.timestamp = {}
      if (params.fechaInicio) where.timestamp.gte = new Date(params.fechaInicio)
      if (params.fechaFin) where.timestamp.lte = new Date(params.fechaFin)
    }

    // Paginación
    const skip = (params.page - 1) * params.limit

    // Obtener logs
    const [logs, total] = await Promise.all([
      db.logAuditoria.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        select: {
          id: true,
          userId: true,
          userEmail: true,
          userName: true,
          accion: true,
          recurso: true,
          exitoso: true,
          codigoError: true,
          mensajeError: true,
          ip: true,
          ipGeo: true,
          dispositivo: true,
          navegador: true,
          sistemaOperativo: true,
          categoria: true,
          nivelRiesgo: true,
          timestamp: true,
          detalles: true,
          metodoHttp: true,
          ruta: true,
          duracionMs: true,
        },
      }),
      db.logAuditoria.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    })
  } catch (error) {
    console.error('Error obteniendo logs:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al obtener logs de auditoría' },
      { status: 500 }
    )
  }
}
