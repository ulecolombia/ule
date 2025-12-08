/**
 * API: GET /api/onboarding/progreso
 * Obtiene el progreso de onboarding del usuario
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
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

    // Calcular pasos pendientes
    const pasos = [
      {
        titulo: 'Completa tu perfil',
        completado: progreso.perfilCompletado,
        url: '/perfil',
      },
      {
        titulo: 'Configura tus entidades de seguridad social',
        completado: progreso.entidadesConfiguradas,
        url: '/perfil',
      },
      {
        titulo: 'Calcula tu primera PILA',
        completado: progreso.primeraPILA,
        url: '/pila/liquidar',
      },
      {
        titulo: 'Emite tu primera factura',
        completado: progreso.primeraFactura,
        url: '/facturacion/nueva',
      },
      {
        titulo: 'Prueba el asesor de IA',
        completado: progreso.primeraConsultaIA,
        url: '/asesoria',
      },
    ]

    const completados = pasos.filter((p) => p.completado).length
    const porcentaje = Math.round((completados / pasos.length) * 100)

    return NextResponse.json({
      porcentaje,
      pasosPendientes: pasos,
      completados,
      total: pasos.length,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener progreso' },
      { status: 500 }
    )
  }
}
