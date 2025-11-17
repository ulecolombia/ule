/**
 * API: POST /api/onboarding/completar-tour
 * Marca un tour como completado
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { tourKey } = await req.json()

    if (!tourKey) {
      return NextResponse.json({ error: 'tourKey requerido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        onboardingProgreso: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Si no existe progreso, crear uno
    let progreso = user.onboardingProgreso
    if (!progreso) {
      progreso = await prisma.onboardingProgreso.create({
        data: { userId: user.id },
      })
    }

    // Mapear tourKey a campo en DB
    const tourFieldMap: Record<string, string> = {
      dashboard: 'tourDashboardVisto',
      pila: 'tourPILAVisto',
      facturacion: 'tourFacturacionVisto',
      asesoria: 'tourAsesoriaVisto',
    }

    const field = tourFieldMap[tourKey]
    if (!field) {
      return NextResponse.json({ error: 'tourKey inválido' }, { status: 400 })
    }

    // Actualizar progreso
    await prisma.onboardingProgreso.update({
      where: { userId: user.id },
      data: {
        [field]: true,
        ultimoTourVisto: new Date(),
      },
    })

    // Registrar interacción
    await prisma.interaccionAyuda.create({
      data: {
        userId: user.id,
        tipo: 'TOUR_COMPLETADO',
        contenido: tourKey,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al completar tour' },
      { status: 500 }
    )
  }
}
