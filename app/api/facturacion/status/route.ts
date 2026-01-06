/**
 * ULE - API DE ESTADO DE FACTURACIÓN ELECTRÓNICA
 * Devuelve si el usuario tiene habilitada la facturación electrónica
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        name: true,
        email: true,
        facturacionElectronicaHabilitada: true,
        fechaSolicitudFacturacion: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      habilitada: user.facturacionElectronicaHabilitada,
      yaSolicito: !!user.fechaSolicitudFacturacion,
      fechaSolicitud: user.fechaSolicitudFacturacion?.toISOString() || null,
      userName: user.name || '',
      userEmail: user.email,
    })
  } catch (error) {
    console.error('Error al obtener estado de facturación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
