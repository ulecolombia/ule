/**
 * API - DETALLE DE LOG DE AUDITORÍA
 * Consultar detalles completos de un log específico
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditarRevisionLog } from '@/lib/audit/audit-helpers'

/**
 * GET - Obtener detalle completo de un log
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // ✅ ALTO #10: Verificar permisos desde JWT (sin query a DB)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!session.user.isAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const log = await db.logAuditoria.findUnique({
      where: { id: params.id },
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
    })

    if (!log) {
      return NextResponse.json({ error: 'Log no encontrado' }, { status: 404 })
    }

    // Auditar que admin revisó este log
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    await auditarRevisionLog(session.user.id, log.id, ip)

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Error obteniendo log:', error)
    return NextResponse.json({ error: 'Error al obtener log' }, { status: 500 })
  }
}

/**
 * PATCH - Marcar log como revisado
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    // ✅ ALTO #10: Verificar permisos desde JWT (sin query a DB)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (!session.user.isAdmin && !session.user.isSuperAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const log = await db.logAuditoria.update({
      where: { id: params.id },
      data: {
        requiereRevision: false,
        revisadoPor: session.user.id,
        fechaRevision: new Date(),
      },
    })

    return NextResponse.json({ success: true, log })
  } catch (error) {
    console.error('Error actualizando log:', error)
    return NextResponse.json(
      { error: 'Error al actualizar log' },
      { status: 500 }
    )
  }
}
