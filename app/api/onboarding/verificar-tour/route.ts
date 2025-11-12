/**
 * API: GET /api/onboarding/verificar-tour
 * Verifica si un tour ya fue visto
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tourKey = searchParams.get('tour')

    if (!tourKey) {
      return NextResponse.json({ error: 'tour requerido' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        onboardingProgreso: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Si no existe progreso, crear uno
    let progreso = user.onboardingProgreso
    if (!progreso) {
      progreso = await prisma.onboardingProgreso.create({
        data: { userId: user.id },
      })
    }

    // Mapear tourKey a campo en DB
    const tourFieldMap: Record<string, keyof typeof progreso> = {
      dashboard: 'tourDashboardVisto',
      pila: 'tourPILAVisto',
      facturacion: 'tourFacturacionVisto',
      asesoria: 'tourAsesoriaVisto',
    }

    const field = tourFieldMap[tourKey]
    if (!field) {
      return NextResponse.json({ error: 'tourKey inválido' }, { status: 400 })
    }

    const visto = progreso[field] || false

    return NextResponse.json({ visto })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al verificar tour' }, { status: 500 })
  }
}
