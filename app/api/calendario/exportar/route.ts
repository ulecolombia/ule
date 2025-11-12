/**
 * API DE CALENDARIO - EXPORTAR A ICS
 * GET /api/calendario/exportar - Exportar eventos a formato iCalendar
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generarICS } from '@/lib/services/calendario-service'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
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

    const { searchParams } = new URL(req.url)
    const eventosParam = searchParams.get('eventos')
    const eventoIds = eventosParam ? eventosParam.split(',') : undefined

    const icsContent = await generarICS(user.id, eventoIds)

    return new Response(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition':
          'attachment; filename="calendario-tributario.ics"',
      },
    })
  } catch (error) {
    console.error('[API Calendario] Error al exportar calendario:', error)
    return NextResponse.json(
      { error: 'Error al exportar calendario' },
      { status: 500 }
    )
  }
}
